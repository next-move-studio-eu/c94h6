export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—:—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function toVideoZipName(ident: string): string {
  const s = (ident || '').trim();
  const num = s.replace(/\D/g, '');
  return num ? `chessvideo${num}.zip` : 'chessvideo1.zip';
}

export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
