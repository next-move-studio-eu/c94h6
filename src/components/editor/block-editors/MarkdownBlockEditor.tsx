import { useRef, useState, type SyntheticEvent } from 'react';
import BlockWrapper from '../BlockWrapper';
import { MarkdownCaretInsertButton, type AddableBlockType } from '../AddBlockMenu';
import type { MarkdownBlock } from '../../../types/articleEditor';
import {
  planMarkdownInsert,
  type MarkdownInsertPlacement,
} from '../../../utils/markdownInsert';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

type Caret = { start: number; end: number };

function caretFromTextarea(element: HTMLTextAreaElement): Caret | null {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  if (start == null || end == null) return null;
  return { start, end };
}

export function MarkdownBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
  onInsertAtCaret,
}: BlockEditorProps<MarkdownBlock> & {
  onInsertAtCaret: (type: AddableBlockType, plan: MarkdownInsertPlacement) => void;
}) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const caretRef = useRef<Caret | null>(null);
  const menuOpenRef = useRef(false);
  const suppressCaretRef = useRef(false);
  const frozenRef = useRef<MarkdownInsertPlacement | null>(null);
  const [caret, setCaret] = useState<Caret | null>(null);

  const rememberCaret = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    if (menuOpenRef.current || suppressCaretRef.current) return;
    const next = caretFromTextarea(event.currentTarget);
    caretRef.current = next;
    setCaret(next);
  };

  const plan = planMarkdownInsert(block.content, caret?.start ?? null, caret?.end ?? null);

  const freezeCaret = () => {
    menuOpenRef.current = true;
    const live = planMarkdownInsert(
      block.content,
      caretRef.current?.start ?? null,
      caretRef.current?.end ?? null,
    );
    frozenRef.current = live.action === 'disabled' ? null : live;
  };

  const handleInsert = (type: AddableBlockType) => {
    const chosen = frozenRef.current;
    frozenRef.current = null;
    if (!chosen) return;
    onInsertAtCaret(type, chosen);
    suppressCaretRef.current = true;
    caretRef.current = null;
    setCaret(null);
    window.setTimeout(() => {
      suppressCaretRef.current = false;
    }, 0);
  };

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockMarkdown')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
      headerAction={
        <MarkdownCaretInsertButton
          plan={plan}
          onInsert={handleInsert}
          onFreeze={freezeCaret}
          onOpenChange={(open) => {
            menuOpenRef.current = open;
          }}
        />
      }
    >
      <textarea
        value={block.content}
        onChange={(event) => {
          rememberCaret(event);
          onUpdate({ ...block, content: event.target.value });
        }}
        onSelect={rememberCaret}
        onKeyUp={rememberCaret}
        onClick={rememberCaret}
        onFocus={rememberCaret}
        placeholder={t('articleEditor.placeholderMarkdown')}
        rows={6}
        spellCheck={true}
        className="field-filled focus-ring resize-y font-mono"
      />
    </BlockWrapper>
  );
}
