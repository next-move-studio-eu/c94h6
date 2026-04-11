/**
 * Path resolver for saves in the editor app.
 * In Tauri: uses native save dialog and writes to user-selected path; remembers last-used directory per save type.
 * In browser: uses showSaveFilePicker when available so user picks path; falls back to download if unsupported or cancelled.
 */

import type { ArticleDiskTarget } from './articleDiskTarget';

/** File System Access API is not on default `Window` in all TS lib versions. */
type WindowWithFileSystemAccess = Window & {
  showOpenFilePicker?: (options?: {
    types?: { description: string; accept: Record<string, string[]> }[];
    excludeAcceptAllOption?: boolean;
  }) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
};

function browserWin(): WindowWithFileSystemAccess {
  return window as WindowWithFileSystemAccess;
}

const STORAGE_PREFIX = 'editor-last-save-dir-';

export type SaveType = 'article' | 'slideshow' | 'chess-video' | 'document' | 'audio';

export type { ArticleDiskTarget } from './articleDiskTarget';

function isTauri(): boolean {
  return typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
}

/** True when running inside the Tauri desktop shell (not the web build). */
export function isTauriRuntime(): boolean {
  return isTauri();
}

function getStorageKey(saveType: SaveType): string {
  return `${STORAGE_PREFIX}${saveType}`;
}

export function getLastUsedDir(saveType: SaveType): string | null {
  try {
    return localStorage.getItem(getStorageKey(saveType));
  } catch {
    return null;
  }
}

export function setLastUsedDir(saveType: SaveType, filePath: string): void {
  try {
    const dir = dirname(filePath);
    if (dir) localStorage.setItem(getStorageKey(saveType), dir);
  } catch {
    // ignore
  }
}

function dirname(path: string): string {
  const normalized = path.replace(/[/\\]+$/, '');
  const lastSlash = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  if (lastSlash <= 0) return '';
  return path.slice(0, lastSlash);
}

export interface SaveDialogFilter {
  name: string;
  extensions: string[];
}

/**
 * Resolve save path via native dialog (Tauri only).
 * Uses last-used directory for the given save type so the dialog opens in a sensible place.
 * @returns Selected path or null if cancelled / not in Tauri.
 */
export async function resolveSavePath(
  saveType: SaveType,
  defaultFileName: string,
  filters: SaveDialogFilter[] = [{ name: 'All', extensions: ['*'] }]
): Promise<string | null> {
  if (!isTauri()) return null;
  const { save } = await import('@tauri-apps/plugin-dialog');
  const lastDir = getLastUsedDir(saveType);
  const defaultPath = lastDir ? joinPath(lastDir, defaultFileName) : defaultFileName;
  const path = await save({
    defaultPath,
    filters: filters.map((f) => ({ name: f.name, extensions: f.extensions })),
  });
  if (path) setLastUsedDir(saveType, path);
  return path ?? null;
}

function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') ? '\\' : '/';
  return dir.replace(/[/\\]+$/, '') + sep + name.replace(/^[/\\]+/, '');
}

/**
 * Write blob to a path (Tauri only). No-op in browser.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function saveBlobToPath(path: string, blob: Blob): Promise<void> {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const contentsBase64 = uint8ArrayToBase64(bytes);
  await invoke('write_save_file', { path, contentsBase64 });
}

/** Read file bytes from an absolute path (Tauri only). */
export async function readBlobFromTauriPath(path: string): Promise<Blob> {
  if (!isTauri()) throw new Error('readBlobFromTauriPath requires Tauri');
  const { invoke } = await import('@tauri-apps/api/core');
  const contentsBase64 = await invoke<string>('read_save_file', { path });
  const binary = atob(contentsBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes.buffer]);
}

/** Open a .zip via native dialog and return its path and contents (Tauri only). */
export async function openArticleZipTauri(): Promise<{ path: string; blob: Blob } | null> {
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'ZIP', extensions: ['zip'] }],
  });
  const pathStr = typeof path === 'string' ? path : Array.isArray(path) && path[0] ? path[0] : null;
  if (!pathStr) return null;
  const blob = await readBlobFromTauriPath(pathStr);
  return { path: pathStr, blob };
}

/** Open a .zip via File System Access API (Chromium); returns handle for Save without dialog. */
export async function openArticleZipWithBrowserPicker(): Promise<{
  blob: Blob;
  handle: FileSystemFileHandle;
} | null> {
  const w = browserWin();
  if (typeof window === 'undefined' || typeof w.showOpenFilePicker !== 'function') {
    return null;
  }
  let handle: FileSystemFileHandle;
  try {
    [handle] = await w.showOpenFilePicker({
      types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }],
      excludeAcceptAllOption: true,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return null;
    throw err;
  }
  const file = await handle.getFile();
  return { blob: file, handle };
}

export async function saveBlobToArticleTarget(target: ArticleDiskTarget, blob: Blob): Promise<void> {
  if (target.kind === 'tauri') {
    await saveBlobToPath(target.path, blob);
    return;
  }
  const writable = await target.handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** Browser: try save via File System Access API (showSaveFilePicker). */
async function saveBlobViaPicker(
  defaultFileName: string,
  blob: Blob,
  filters: SaveDialogFilter[]
): Promise<FileSystemFileHandle | null> {
  const w = browserWin();
  if (typeof window === 'undefined' || typeof w.showSaveFilePicker !== 'function') {
    return null;
  }
  const types: { description: string; accept: Record<string, string[]> }[] = filters.map((f) => ({
    description: f.name,
    accept: {
      'application/octet-stream': f.extensions.map((e) => (e.startsWith('.') ? e : `.${e}`)),
    },
  }));
  let handle: FileSystemFileHandle;
  try {
    handle = await w.showSaveFilePicker({
      suggestedName: defaultFileName,
      types: types.length ? types : undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return null;
    throw err;
  }
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return handle;
}

/** Browser fallback: trigger download via temporary link (no dialog). */
function saveBlobViaDownload(defaultFileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface SaveBlobResult {
  saved: boolean;
  /** Native path when the user saved via Tauri dialog. */
  tauriPath?: string;
  /** File handle when the user saved via File System Access API (Chromium). */
  browserFileHandle?: FileSystemFileHandle;
}

/**
 * Save a blob to a user-selected path (dialog in both Tauri and supported browsers).
 * Tauri: native save dialog + write to path. Browser: showSaveFilePicker when available, else download.
 */
export async function saveBlobWithResolver(
  saveType: SaveType,
  defaultFileName: string,
  blob: Blob,
  filters: SaveDialogFilter[] = [{ name: 'All', extensions: ['*'] }]
): Promise<SaveBlobResult> {
  if (isTauri()) {
    const path = await resolveSavePath(saveType, defaultFileName, filters);
    if (!path) return { saved: false };
    await saveBlobToPath(path, blob);
    return { saved: true, tauriPath: path };
  }
  if (typeof browserWin().showSaveFilePicker !== 'function') {
    saveBlobViaDownload(defaultFileName, blob);
    return { saved: true };
  }
  try {
    const handle = await saveBlobViaPicker(defaultFileName, blob, filters);
    if (handle) return { saved: true, browserFileHandle: handle };
    return { saved: false };
  } catch {
    saveBlobViaDownload(defaultFileName, blob);
    return { saved: true };
  }
}
