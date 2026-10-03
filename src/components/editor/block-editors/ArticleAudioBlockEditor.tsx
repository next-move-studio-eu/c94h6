import BlockWrapper from '../BlockWrapper';
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
            <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.articleAudioId')}</label>
            <select
              value={block.audioId}
              onChange={(e) => onUpdate({ ...block, audioId: e.target.value })}
              className="field-filled focus-ring"
            >
              {articleAudioIds.map((n) => (
                <option key={n} value={String(n)}>{`audio${n}.webm`}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.articleAudioTitle')}</label>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            placeholder={t('articleEditor.articleAudioTitlePlaceholder')}
            className="field-filled focus-ring"
          />
        </div>
      </div>
    </BlockWrapper>
  );
}
