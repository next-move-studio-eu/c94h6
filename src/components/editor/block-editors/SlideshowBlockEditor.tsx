import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
import type { SlideshowBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function SlideshowBlockEditor({
  block,
  index,
  totalBlocks,
  slideshowIds = [],
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<SlideshowBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockSlideshow')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-2">
        {slideshowIds.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.blockSlideshow')}</label>
            <Select
              value={String(block.slideshowNumber)}
              onChange={(v) => onUpdate({ ...block, slideshowNumber: parseInt(v, 10) })}
              options={slideshowIds.map((n) => ({
                value: String(n),
                label: t('articleEditor.slideshowUploaded', { N: n }).replace(' ✓', ''),
              }))}
              variant="editor"
            />
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.articleVideoTitle')}</label>
          <input
            type="text"
            value={block.title ?? ''}
            onChange={(e) => onUpdate({ ...block, title: e.target.value || undefined })}
            placeholder={t('articleEditor.articleVideoTitlePlaceholder')}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)]"
          />
        </div>
        {slideshowIds.length === 0 && (
          <p className="text-sm text-[var(--textSecondary)]">
            {t('articleEditor.slideshowSelectHint', { n: block.slideshowNumber })}
          </p>
        )}
      </div>
    </BlockWrapper>
  );
}
