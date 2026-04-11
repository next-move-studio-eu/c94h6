/**
 * Stable fingerprint of the on-disk article ZIP for dirty detection (vs last saved snapshot).
 */
import type { EditorState } from '../types/articleEditor';
import { buildArticleZip } from './articleZip';

export async function fingerprintArticleZip(state: EditorState): Promise<string> {
  const blob = await buildArticleZip(state);
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
