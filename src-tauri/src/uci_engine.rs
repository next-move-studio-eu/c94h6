//! UCI chess engine bridge. Spawns a user-provided executable and communicates via UCI over stdin/stdout.

use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Receiver;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

const INIT_TIMEOUT_MS: u64 = 8000;
const ANALYZE_EXTRA_MS: u64 = 1000;
const STOP_DRAIN_MS: u64 = 2000;

const CANCEL_MSG: &str = "cancelled";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisRow {
    pub score: i32,
    pub pv: Vec<String>,
}

struct EngineHandle {
    #[allow(dead_code)]
    child: Child,
    stdin: ChildStdin,
    line_rx: Receiver<String>,
}

static ENGINE: Mutex<Option<EngineHandle>> = Mutex::new(None);
static CANCEL: AtomicBool = AtomicBool::new(false);

fn drain_until_bestmove(handle: &mut EngineHandle, timeout_ms: u64) {
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);
    while std::time::Instant::now() < deadline {
        match handle.line_rx.recv_timeout(Duration::from_millis(50)) {
            Ok(line) => {
                if line.starts_with("bestmove ") {
                    return;
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => return,
        }
    }
}

fn spawn_reader(stdout: std::process::ChildStdout) -> Receiver<String> {
    let (tx, rx) = std::sync::mpsc::channel();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            if tx.send(line).is_err() {
                break;
            }
        }
    });
    rx
}

/// Initialize UCI engine at the given path. Returns Ok(()) on success.
/// If an engine is already loaded, it is killed first.
#[tauri::command]
pub fn init_uci_engine(engine_path: String) -> Result<(), String> {
    let mut guard = ENGINE.lock().map_err(|e| e.to_string())?;
    if let Some(mut h) = guard.take() {
        let _ = h.child.kill();
    }
    let mut child = Command::new(&engine_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn engine: {}", e))?;
    let stdin = child.stdin.take().ok_or("Failed to open engine stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open engine stdout")?;
    let line_rx = spawn_reader(stdout);
    let mut handle = EngineHandle {
        child,
        stdin,
        line_rx,
    };
    // UCI handshake
    writeln!(handle.stdin, "uci").map_err(|e| e.to_string())?;
    handle.stdin.flush().map_err(|e| e.to_string())?;
    let mut seen_uciok = false;
    let mut seen_readyok = false;
    let deadline = std::time::Instant::now() + Duration::from_millis(INIT_TIMEOUT_MS);
    while std::time::Instant::now() < deadline {
        match handle.line_rx.recv_timeout(Duration::from_millis(500)) {
            Ok(line) => {
                if line.trim() == "uciok" {
                    seen_uciok = true;
                    writeln!(handle.stdin, "isready").map_err(|e| e.to_string())?;
                    handle.stdin.flush().map_err(|e| e.to_string())?;
                }
                if line.trim() == "readyok" {
                    seen_readyok = true;
                    break;
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                return Err("Engine process closed during init".to_string());
            }
        }
    }
    if !seen_uciok {
        return Err("UCI handshake timeout (no uciok)".to_string());
    }
    if !seen_readyok {
        return Err("UCI handshake timeout (no readyok)".to_string());
    }
    *guard = Some(handle);
    Ok(())
}

fn parse_info_line(line: &str) -> Option<(u32, i32, Vec<String>)> {
    if !line.starts_with("info ") {
        return None;
    }
    let parts: Vec<&str> = line.split_whitespace().collect();
    let mut multipv = 1u32;
    let mut score = 0i32;
    let mut pv_start = None;
    let mut i = 1;
    while i < parts.len() {
        if parts[i] == "multipv" && i + 1 < parts.len() {
            multipv = parts[i + 1].parse().unwrap_or(1);
            i += 2;
            continue;
        }
        if parts[i] == "score" && i + 2 < parts.len() {
            if parts[i + 1] == "cp" {
                score = parts[i + 2].parse().unwrap_or(0);
            } else if parts[i + 1] == "mate" {
                let mate_in: i32 = parts[i + 2].parse().unwrap_or(0);
                score = if mate_in > 0 {
                    mate_in * 1_000_000
                } else {
                    -mate_in.abs() * 1_000_000
                };
            }
            i += 3;
            continue;
        }
        if parts[i] == "pv" {
            pv_start = Some(i + 1);
            break;
        }
        i += 1;
    }
    let pv = pv_start.map(|start| parts[start..].to_vec().into_iter().map(String::from).collect());
    pv.map(|p| (multipv, score, p))
}

/// Run analysis and return rows. multi_pv 1 = single line (2s), 5 = top 5 (5s).
/// Returns Err("cancelled") when interrupted via `uci_stop`.
#[tauri::command]
pub fn uci_analyze(fen: String, multi_pv: u32) -> Result<Vec<AnalysisRow>, String> {
    let multi_pv = if multi_pv == 0 { 1 } else { multi_pv.min(5) };
    let movetime_ms = if multi_pv == 1 { 2000u64 } else { 5000u64 };
    let timeout_ms = movetime_ms + ANALYZE_EXTRA_MS;

    let mut guard = ENGINE.lock().map_err(|e| e.to_string())?;
    let handle = guard.as_mut().ok_or("Engine not loaded. Use Load UCI first.")?;

    CANCEL.store(false, Ordering::SeqCst);

    writeln!(handle.stdin, "position fen {}", fen).map_err(|e| e.to_string())?;
    writeln!(handle.stdin, "setoption name MultiPV value {}", multi_pv).map_err(|e| e.to_string())?;
    writeln!(handle.stdin, "go movetime {}", movetime_ms).map_err(|e| e.to_string())?;
    handle.stdin.flush().map_err(|e| e.to_string())?;

    let mut results: std::collections::HashMap<u32, AnalysisRow> = std::collections::HashMap::new();
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);

    while std::time::Instant::now() < deadline {
        if CANCEL.load(Ordering::SeqCst) {
            let _ = writeln!(handle.stdin, "stop");
            let _ = handle.stdin.flush();
            drain_until_bestmove(handle, STOP_DRAIN_MS);
            return Err(CANCEL_MSG.to_string());
        }
        match handle.line_rx.recv_timeout(Duration::from_millis(100)) {
            Ok(line) => {
                if line.starts_with("bestmove ") {
                    break;
                }
                if let Some((multipv, score, pv)) = parse_info_line(&line) {
                    if !pv.is_empty() {
                        results.insert(multipv, AnalysisRow { score, pv });
                    }
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }

    if CANCEL.load(Ordering::SeqCst) {
        return Err(CANCEL_MSG.to_string());
    }

    let ordered: Vec<AnalysisRow> = (1..=multi_pv)
        .filter_map(|i| results.remove(&i))
        .collect();
    Ok(ordered)
}

/// Signal in-flight `uci_analyze` to stop. Does not need the engine mutex.
#[tauri::command]
pub fn uci_stop() -> Result<(), String> {
    CANCEL.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn uci_engine_status() -> Result<bool, String> {
    let guard = ENGINE.lock().map_err(|e| e.to_string())?;
    Ok(guard.is_some())
}

#[tauri::command]
pub fn kill_uci_engine() -> Result<(), String> {
    CANCEL.store(true, Ordering::SeqCst);
    let mut guard = ENGINE.lock().map_err(|e| e.to_string())?;
    if let Some(mut h) = guard.take() {
        let _ = h.child.kill();
    }
    Ok(())
}
