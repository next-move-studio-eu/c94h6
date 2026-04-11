import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
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
            <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.articleVideoId')}</label>
            <Select
              value={block.videoId}
              onChange={(v) => onUpdate({ ...block, videoId: v })}
              options={articleVideoIds.map((n) => ({
                value: String(n),
                label: `video${n}.webm`,
              }))}
              variant="editor"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.articleVideoTitle')}</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder={t('articleEditor.articleVideoTitlePlaceholder')}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)]"
          />
        </div>
      </div>
    </BlockWrapper>
  );
}
