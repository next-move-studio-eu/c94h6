import BlockWrapper from '../BlockWrapper';
import type { DotBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function DotBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<DotBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockDot')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ ...block, content: e.target.value })}
        placeholder={t('articleEditor.placeholderDot')}
        rows={8}
        spellCheck={false}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
      />
    </BlockWrapper>
  );
}
