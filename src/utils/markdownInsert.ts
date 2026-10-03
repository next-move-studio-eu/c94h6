/** Caret-to-insert plan for a markdown block. Blank means no non-whitespace character. */

export type MarkdownInsertDisabledReason = 'empty' | 'caret';

export type MarkdownInsertPlan =
  | { action: 'disabled'; reason: MarkdownInsertDisabledReason }
  | { action: 'before'; markdown: string }
  | { action: 'after'; markdown: string }
  | { action: 'between'; before: string; after: string };

export type MarkdownInsertPlacement = Exclude<MarkdownInsertPlan, { action: 'disabled' }>;

function hasNonWhitespace(value: string): boolean {
  return /\S/.test(value);
}

function lineAtCaret(text: string, caret: number): string {
  const previousBreak = caret === 0 ? -1 : text.lastIndexOf('\n', caret - 1);
  const lineStart = previousBreak + 1;
  const nextBreak = text.indexOf('\n', caret);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  return text.slice(lineStart, lineEnd);
}

/**
 * Collapsed caret on a blank line:
 * - neither side has non-blank text → disabled (empty)
 * - only text after → insert above, trimStart the remaining markdown
 * - only text before → insert below, trimEnd the remaining markdown
 * - text on both sides → split, trimEnd the prefix and trimStart the suffix
 * Selection, a missing caret, or a caret off a blank line → disabled (caret).
 */
export function planMarkdownInsert(
  text: string,
  selectionStart: number | null,
  selectionEnd: number | null,
): MarkdownInsertPlan {
  if (
    selectionStart == null ||
    selectionEnd == null ||
    selectionStart !== selectionEnd ||
    selectionStart < 0 ||
    selectionStart > text.length
  ) {
    return { action: 'disabled', reason: 'caret' };
  }

  if (!/^\s*$/.test(lineAtCaret(text, selectionStart))) {
    return { action: 'disabled', reason: 'caret' };
  }

  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionStart);
  const beforeHasText = hasNonWhitespace(before);
  const afterHasText = hasNonWhitespace(after);

  if (!beforeHasText && !afterHasText) {
    return { action: 'disabled', reason: 'empty' };
  }
  if (!beforeHasText) {
    return { action: 'before', markdown: text.trimStart() };
  }
  if (!afterHasText) {
    return { action: 'after', markdown: text.trimEnd() };
  }
  return {
    action: 'between',
    before: before.trimEnd(),
    after: after.trimStart(),
  };
}
