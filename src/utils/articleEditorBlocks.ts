/**
 * Build info.json for article ZIP. Block ↔ content serialization is in articleContentJson.ts.
 */
import type { EditorState } from '../types/articleEditor';

/**
 * Build info.json object (used when serializing for management; editor no longer adds it to content.zip).
 * Root fields + per-attachment entries (accessLevel only).
 */
export function buildInfoJson(state: EditorState): Record<string, unknown> {
  const { info, attachments } = state;
  const root: Record<string, unknown> = {
    title: (info.title || '').trim().slice(0, 255),
    intro: (info.intro || '').trim().slice(0, 1000),
    language: info.language,
    section: info.section,
    articleContent: info.articleContent || 'NORMAL',
  };
  for (const [filename, meta] of Object.entries(attachments)) {
    root[filename] = { accessLevel: meta.accessLevel };
  }
  return root;
}
