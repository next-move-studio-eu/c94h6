import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
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
            <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.blockVideo')}</label>
            <Select
              value={String(block.videoNumber)}
              onChange={(v) => onUpdate({ ...block, videoNumber: parseInt(v, 10) })}
              options={videoIds.map((n) => ({
                value: String(n),
                label: t('articleEditor.videoUploaded', { N: n }).replace(' ✓', ''),
              }))}
              variant="editor"
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--textSecondary)]">
            {t('articleEditor.videoSelectHint', { n: block.videoNumber })}
          </p>
        )}
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
      </div>
    </BlockWrapper>
  );
}
