import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
import type { ArticleAudioBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';

export function ArticleAudioBlockEditor({
  block,
  index,
  totalBlocks,
  articleAudioIds = [],
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<ArticleAudioBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockArticleAudio')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-2">
        {articleAudioIds.length > 0 && (
          <div>
            <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.articleAudioId')}</label>
            <Select
              value={block.audioId}
              onChange={(v) => onUpdate({ ...block, audioId: v })}
              options={articleAudioIds.map((n) => ({
                value: String(n),
                label: `audio${n}.webm`,
              }))}
              variant="editor"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.articleAudioTitle')}</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder={t('articleEditor.articleAudioTitlePlaceholder')}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)]"
          />
        </div>
      </div>
    </BlockWrapper>
  );
}
