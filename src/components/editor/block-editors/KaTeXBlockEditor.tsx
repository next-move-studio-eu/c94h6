import BlockWrapper from '../BlockWrapper';
import type { KaTeXBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function KaTeXBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<KaTeXBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockKatex')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ ...block, content: e.target.value })}
        placeholder={t('articleEditor.placeholderKatex')}
        rows={4}
        spellCheck={false}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
      />
    </BlockWrapper>
  );
}
