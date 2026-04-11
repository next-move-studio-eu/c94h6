/**
 * Stub for editor: article-blocks expect useArticleContent().
 * In editor we never have article context (no API); blocks use useEditorArticle().getFileUrl() only.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface ArticleContentContextValue {
  articleId: string;
  attachmentsMetadata: Record<string, { name?: string; accessLevel?: string; durationSeconds?: number; sizeBytes?: number }>;
  answeredQuizIds?: Set<number>;
}

const ArticleContentContext = createContext<ArticleContentContextValue | null>(null);

export function ArticleContentProvider({ children }: { children: ReactNode }) {
  return (
    <ArticleContentContext.Provider value={null}>
      {children}
    </ArticleContentContext.Provider>
  );
}

export function useArticleContent(): ArticleContentContextValue | null {
  return useContext(ArticleContentContext);
}
