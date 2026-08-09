//! UCI chess engine bridge.
//!
//! All engine I/O runs on a dedicated OS worker thread (below-normal priority on Windows)
//! so analysis cannot block Tauri's async/IPC path or the webview MediaRecorder audio path.

use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::OnceLock;
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
    child: Child,
    stdin: ChildStdin,
    line_rx: Receiver<String>,
}

enum WorkerMsg {
    Init {
        path: String,
        reply: Sender<Result<(), String>>,
    },
    Analyze {
        fen: String,
        multi_pv: u32,
        reply: Sender<Result<Vec<AnalysisRow>, String>>,
    },
    Kill {
        reply: Sender<Result<(), String>>,
    },
}

static CANCEL: AtomicBool = AtomicBool::new(false);
static ENGINE_LOADED: AtomicBool = AtomicBool::new(false);
static WORKER_TX: OnceLock<Sender<WorkerMsg>> = OnceLock::new();

/// Soften scheduling so Stockfish I/O cannot starve webview audio capture.
#[cfg(windows)]
fn lower_current_thread_priority() {
    extern "system" {
        fn GetCurrentThread() -> isize;
        fn SetThreadPriority(thread: isize, priority: i32) -> i32;
    }
    const THREAD_PRIORITY_BELOW_NORMAL: i32 = -1;
    unsafe {
        let _ = SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_BELOW_NORMAL);
    }
}

#[cfg(not(windows))]
fn lower_current_thread_priority() {}

#[cfg(windows)]
fn lower_process_priority(child: &Child) {
    use std::os::windows::io::AsRawHandle;
    extern "system" {
        fn SetPriorityClass(process: *mut std::ffi::c_void, class: u32) -> i32;
    }
    const BELOW_NORMAL_PRIORITY_CLASS: u32 = 0x0000_4000;
    unsafe {
        let _ = SetPriorityClass(child.as_raw_handle() as *mut std::ffi::c_void, BELOW_NORMAL_PRIORITY_CLASS);
    }
}

#[cfg(not(windows))]
fn lower_process_priority(_child: &Child) {}

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
    let (tx, rx) = mpsc::channel();
    thread::Builder::new()
        .name("uci-stdout-reader".into())
        .spawn(move || {
            lower_current_thread_priority();
            let reader = BufReader::new(stdout);
            for line in reader.lines().flatten() {
                if tx.send(line).is_err() {
                    break;
                }
            }
        })
        .expect("failed to spawn uci stdout reader");
    rx
}

fn kill_engine(engine: &mut Option<EngineHandle>) {
    CANCEL.store(true, Ordering::SeqCst);
    if let Some(mut h) = engine.take() {
        let _ = h.child.kill();
    }
    ENGINE_LOADED.store(false, Ordering::SeqCst);
}

fn init_engine(engine: &mut Option<EngineHandle>, engine_path: String) -> Result<(), String> {
    kill_engine(engine);
    CANCEL.store(false, Ordering::SeqCst);

    let mut child = Command::new(&engine_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn engine: {}", e))?;
    lower_process_priority(&child);

    let stdin = child.stdin.take().ok_or("Failed to open engine stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open engine stdout")?;
    let line_rx = spawn_reader(stdout);
    let mut handle = EngineHandle {
        child,
        stdin,
        line_rx,
    };

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
        let _ = handle.child.kill();
        return Err("UCI handshake timeout (no uciok)".to_string());
    }
    if !seen_readyok {
        let _ = handle.child.kill();
        return Err("UCI handshake timeout (no readyok)".to_string());
    }

    *engine = Some(handle);
    ENGINE_LOADED.store(true, Ordering::SeqCst);
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

fn run_analyze(engine: &mut Option<EngineHandle>, fen: String, multi_pv: u32) -> Result<Vec<AnalysisRow>, String> {
    let multi_pv = if multi_pv == 0 { 1 } else { multi_pv.min(5) };
    let movetime_ms = if multi_pv == 1 { 2000u64 } else { 5000u64 };
    let timeout_ms = movetime_ms + ANALYZE_EXTRA_MS;

    let handle = engine
        .as_mut()
        .ok_or_else(|| "Engine not loaded. Use Load UCI first.".to_string())?;

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

    Ok((1..=multi_pv).filter_map(|i| results.remove(&i)).collect())
}

fn worker_loop(rx: Receiver<WorkerMsg>) {
    lower_current_thread_priority();
    let mut engine: Option<EngineHandle> = None;

    while let Ok(msg) = rx.recv() {
        match msg {
            WorkerMsg::Init { path, reply } => {
                let _ = reply.send(init_engine(&mut engine, path));
            }
            WorkerMsg::Analyze {
                fen,
                multi_pv,
                reply,
            } => {
                let _ = reply.send(run_analyze(&mut engine, fen, multi_pv));
            }
            WorkerMsg::Kill { reply } => {
                kill_engine(&mut engine);
                let _ = reply.send(Ok(()));
            }
        }
    }
}

fn worker_tx() -> &'static Sender<WorkerMsg> {
    WORKER_TX.get_or_init(|| {
        let (tx, rx) = mpsc::channel();
        thread::Builder::new()
            .name("uci-worker".into())
            .spawn(move || worker_loop(rx))
            .expect("failed to spawn uci worker");
        tx
    })
}

async fn await_reply<T: Send + 'static>(reply_rx: Receiver<T>) -> Result<T, String> {
    // Park a blocking-pool thread on the oneshot; never block Tauri's async executor
    // with UCI I/O (keeps webview + MediaRecorder responsive).
    tauri::async_runtime::spawn_blocking(move || {
        reply_rx
            .recv()
            .map_err(|_| "UCI worker disconnected".to_string())
    })
    .await
    .map_err(|e| format!("UCI worker join failed: {e}"))?
}

/// Initialize UCI engine at the given path. Returns Ok(()) on success.
/// If an engine is already loaded, it is killed first.
#[tauri::command]
pub async fn init_uci_engine(engine_path: String) -> Result<(), String> {
    let (reply_tx, reply_rx) = mpsc::channel();
    worker_tx()
        .send(WorkerMsg::Init {
            path: engine_path,
            reply: reply_tx,
        })
        .map_err(|_| "UCI worker disconnected".to_string())?;
    await_reply(reply_rx).await?
}

/// Run analysis and return rows. multi_pv 1 = single line (2s), 5 = top 5 (5s).
/// Returns Err("cancelled") when interrupted via `uci_stop`.
#[tauri::command]
pub async fn uci_analyze(fen: String, multi_pv: u32) -> Result<Vec<AnalysisRow>, String> {
    let (reply_tx, reply_rx) = mpsc::channel();
    worker_tx()
        .send(WorkerMsg::Analyze {
            fen,
            multi_pv,
            reply: reply_tx,
        })
        .map_err(|_| "UCI worker disconnected".to_string())?;
    await_reply(reply_rx).await?
}

/// Signal in-flight analysis to stop. Instant; does not touch the worker queue.
#[tauri::command]
pub fn uci_stop() -> Result<(), String> {
    CANCEL.store(true, Ordering::SeqCst);
    Ok(())
}

/// Whether an engine is loaded. Reads an atomic — never waits on in-flight analysis.
#[tauri::command]
pub fn uci_engine_status() -> Result<bool, String> {
    Ok(ENGINE_LOADED.load(Ordering::SeqCst))
}

#[tauri::command]
pub async fn kill_uci_engine() -> Result<(), String> {
    CANCEL.store(true, Ordering::SeqCst);
    let (reply_tx, reply_rx) = mpsc::channel();
    worker_tx()
        .send(WorkerMsg::Kill { reply: reply_tx })
        .map_err(|_| "UCI worker disconnected".to_string())?;
    await_reply(reply_rx).await?
}
