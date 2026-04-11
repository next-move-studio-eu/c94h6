/**
 * Bound on-disk target for article Save (without dialog) — Tauri path or browser file handle.
 */
export type ArticleDiskTarget =
  | { kind: 'tauri'; path: string }
  | { kind: 'fileHandle'; handle: FileSystemFileHandle };
