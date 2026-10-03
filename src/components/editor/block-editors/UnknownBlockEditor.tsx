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
      <details className="overflow-hidden rounded-xl">
        <summary className="cursor-pointer list-none bg-[var(--md-sys-color-error-container)] px-3 py-2 text-sm text-[var(--md-sys-color-on-error-container)] [&::-webkit-details-marker]:hidden [&::marker]:hidden">
          <span className="select-none">
            {t('articleEditor.blockUnknown')}: {typeLabel}
          </span>
          <span className="ml-1 inline-block" aria-hidden>▾</span>
        </summary>
        <pre className="surface-container-high m-0 overflow-x-auto whitespace-pre-wrap p-3 font-mono text-xs text-[var(--md-sys-color-on-surface)]">
          {prettyJson}
        </pre>
      </details>
    </BlockWrapper>
  );
}
