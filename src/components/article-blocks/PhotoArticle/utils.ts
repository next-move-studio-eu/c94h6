export function idToFileName(id: string): string {
  const s = (id || '').trim().replace(/\.avif$/i, '');
  if (/^thumbnail$/i.test(s)) return 'Thumbnail.avif';
  return /^\d+$/.test(s) ? `${s}.avif` : `${id}.avif`;
}
