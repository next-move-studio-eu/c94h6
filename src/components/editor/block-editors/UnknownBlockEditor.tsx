import BlockWrapper from '../BlockWrapper';
import type { UnknownBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function UnknownBlockEditor({
  block,
  index,
  totalBlocks,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<UnknownBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const typeLabel = typeof block.rawItem?.type === 'string' ? block.rawItem.type : '?';
  const prettyJson = JSON.stringify(block.rawItem ?? {}, null, 2);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockUnknown')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <details className="rounded border border-amber-500/50 bg-amber-500/10 overflow-hidden">
        <summary className="cursor-pointer list-none px-3 py-2 text-sm text-amber-700 dark:text-amber-400 [&::-webkit-details-marker]:hidden [&::marker]:hidden">
          <span className="select-none">
            {t('articleEditor.blockUnknown')}: {typeLabel}
          </span>
          <span className="ml-1 inline-block text-amber-600 dark:text-amber-500" aria-hidden>▾</span>
        </summary>
        <pre className="border-t border-amber-500/30 bg-[var(--surface)] p-3 font-mono text-xs text-[var(--text)] whitespace-pre-wrap overflow-x-auto m-0">
          {prettyJson}
        </pre>
      </details>
    </BlockWrapper>
  );
}
