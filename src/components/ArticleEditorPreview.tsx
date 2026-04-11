/**
 * Editor preview: renders article blocks as content using ArticleContentRenderer
 * so the user sees real content (markdown, accordions, boards, images, videos, etc.).
 */
import { useTranslation } from 'react-i18next';
import { blocksToContentJson } from '../utils/articleContentJson';
import ArticleContentRenderer from './ArticleContentRenderer';
import type { EditorBlock, ArticleSection } from '../types/articleEditor';

const EDITOR_PREVIEW_SECTION = 'chess' as const;

interface ArticleEditorPreviewProps {
  blocks: EditorBlock[];
  section?: ArticleSection;
}

export default function ArticleEditorPreview({ blocks }: ArticleEditorPreviewProps) {
  const { t } = useTranslation('articleBlocks');
  const payload = blocksToContentJson(blocks);

  const hasContent = payload.content.some((item) => {
    if (item.type === 'markdown') return ((item as { content?: string }).content?.trim() ?? '').length > 0;
    return true;
  });

  if (!hasContent) {
    return (
      <p className="text-sm text-[var(--textDisabled)]">{t('articleEditor.previewEmpty')}</p>
    );
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <ArticleContentRenderer content={payload} section={EDITOR_PREVIEW_SECTION} variant="preview" />
    </div>
  );
}
