/**
 * Tauri UCI adapter. When running in Tauri, the frontend uses this to talk to a
 * user-loaded UCI engine (spawned by the Rust main process) via invoke().
 * Same InitResult and AnalysisRow shape as the engine API for drop-in use in EngineAnalysisOutput.
 */

import { invoke, isTauri as isTauriEnv } from '@tauri-apps/api/core';

export interface AnalysisRow {
  score: number;
  pv: string[];
}

export interface InitResult {
  ok: boolean;
  reason?: string;
}

/** Re-export so callers can use a single import. Uses official Tauri 2 detection (works in dev and build). */
export function isTauri(): boolean {
  return isTauriEnv();
}

/**
 * Initialize the UCI engine at the given path (user selects via file picker).
 * Returns { ok: true } on success, { ok: false, reason } on failure.
 */
export async function initTauriUciEngine(enginePath: string): Promise<InitResult> {
  if (!isTauri()) {
    return { ok: false, reason: 'Not running in Tauri' };
  }
  try {
    await invoke('init_uci_engine', { enginePath });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}

/**
 * Check if a UCI engine is currently loaded.
 */
export async function tauriUciEngineStatus(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>('uci_engine_status');
  } catch {
    return false;
  }
}

/**
 * Analyze position. multiPv 1 or 5. Returns same shape as the engine API.
 * Throws with message containing "cancelled" when interrupted via stopTauriUciAnalysis.
 */
export async function analyzePositionTauri(fen: string, multiPv: 1 | 5): Promise<AnalysisRow[]> {
  if (!isTauri()) {
    throw new Error('Not running in Tauri');
  }
  const rows = await invoke<{ score: number; pv: string[] }[]>('uci_analyze', {
    fen,
    multiPv: multiPv as number,
  });
  return Array.isArray(rows) ? rows : [];
}

/**
 * Signal in-flight analysis to stop so a newer position can be analyzed.
 */
export async function stopTauriUciAnalysis(): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('uci_stop');
  } catch {
    // Ignore — engine may not be loaded yet.
  }
}

export function isUciAnalysisCancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.toLowerCase().includes('cancelled');
}
