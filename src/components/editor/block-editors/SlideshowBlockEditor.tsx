import BlockWrapper from '../BlockWrapper';
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
            <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.blockSlideshow')}</label>
            <select
              value={String(block.slideshowNumber)}
              onChange={(e) => onUpdate({ ...block, slideshowNumber: parseInt(e.target.value, 10) })}
              className="field-filled focus-ring"
            >
              {slideshowIds.map((n) => (
                <option key={n} value={String(n)}>
                  {t('articleEditor.slideshowUploaded', { N: n }).replace(' ✓', '')}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.articleVideoTitle')}</label>
          <input
            type="text"
            value={block.title ?? ''}
            onChange={(e) => onUpdate({ ...block, title: e.target.value || undefined })}
            placeholder={t('articleEditor.articleVideoTitlePlaceholder')}
            className="field-filled focus-ring"
          />
        </div>
        {slideshowIds.length === 0 && (
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.slideshowSelectHint', { n: block.slideshowNumber })}
          </p>
        )}
      </div>
    </BlockWrapper>
  );
}
