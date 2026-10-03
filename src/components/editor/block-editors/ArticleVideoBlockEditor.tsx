import BlockWrapper from '../BlockWrapper';
import type { ArticleVideoBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function ArticleVideoBlockEditor({
  block,
  index,
  totalBlocks,
  articleVideoIds = [],
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<ArticleVideoBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockArticleVideo')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-2">
        {articleVideoIds.length > 0 && (
          <div>
            <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.articleVideoId')}</label>
            <select
              value={block.videoId}
              onChange={(e) => onUpdate({ ...block, videoId: e.target.value })}
              className="field-filled focus-ring"
            >
              {articleVideoIds.map((n) => (
                <option key={n} value={String(n)}>{`video${n}.webm`}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.articleVideoTitle')}</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder={t('articleEditor.articleVideoTitlePlaceholder')}
            className="field-filled focus-ring"
          />
        </div>
      </div>
    </BlockWrapper>
  );
}
