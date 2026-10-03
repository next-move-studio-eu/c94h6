import BlockWrapper from '../BlockWrapper';
import type { VideoBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function VideoBlockEditor({
  block,
  index,
  totalBlocks,
  videoIds = [],
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<VideoBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockVideo')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-2">
        {videoIds.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.blockVideo')}</label>
            <select
              value={String(block.videoNumber)}
              onChange={(e) => onUpdate({ ...block, videoNumber: parseInt(e.target.value, 10) })}
              className="field-filled focus-ring"
            >
              {videoIds.map((n) => (
                <option key={n} value={String(n)}>
                  {t('articleEditor.videoUploaded', { N: n }).replace(' ✓', '')}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.videoSelectHint', { n: block.videoNumber })}
          </p>
        )}
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
      </div>
    </BlockWrapper>
  );
}
