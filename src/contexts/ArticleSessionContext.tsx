import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { EditorState } from '../types/articleEditor';
import type { ArticleDiskTarget } from '../utils/articleDiskTarget';

interface ArticleSessionContextValue {
  articleState: EditorState | null;
  setArticleState: Dispatch<SetStateAction<EditorState | null>>;
  showPreview: boolean;
  setShowPreview: Dispatch<SetStateAction<boolean>>;
  isProMode: boolean;
  setIsProMode: Dispatch<SetStateAction<boolean>>;
  proModeJson: string;
  setProModeJson: Dispatch<SetStateAction<string>>;
  loadErrors: string[];
  setLoadErrors: Dispatch<SetStateAction<string[]>>;
  /** Bound file for Save (Tauri path or browser FileSystemFileHandle); null = untitled / no binding. */
  articleDiskTarget: ArticleDiskTarget | null;
  setArticleDiskTarget: Dispatch<SetStateAction<ArticleDiskTarget | null>>;
}

const ArticleSessionContext = createContext<ArticleSessionContextValue | null>(null);

export function ArticleSessionProvider({ children }: { children: ReactNode }) {
  const [articleState, setArticleState] = useState<EditorState | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [proModeJson, setProModeJson] = useState('');
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [articleDiskTarget, setArticleDiskTarget] = useState<ArticleDiskTarget | null>(null);

  const value = useMemo(
    () => ({
      articleState,
      setArticleState,
      showPreview,
      setShowPreview,
      isProMode,
      setIsProMode,
      proModeJson,
      setProModeJson,
      loadErrors,
      setLoadErrors,
      articleDiskTarget,
      setArticleDiskTarget,
    }),
    [articleState, showPreview, isProMode, proModeJson, loadErrors, articleDiskTarget]
  );

  return <ArticleSessionContext.Provider value={value}>{children}</ArticleSessionContext.Provider>;
}

export function useArticleSession() {
  const ctx = useContext(ArticleSessionContext);
  if (!ctx) {
    throw new Error('useArticleSession must be used within ArticleSessionProvider');
  }
  return ctx;
}
