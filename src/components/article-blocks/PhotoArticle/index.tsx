import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useArticleContent } from '../../../contexts/ArticleContentContext';
import { useEditorArticle } from '../../../contexts/EditorArticleContext';
import {
  exitDocumentFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../../../utils/fullscreen';
import PhotoArticleFullscreen from './PhotoArticleFullscreen';
import PhotoArticleInline from './PhotoArticleInline';
import type { PhotoArticleProps, PhotoArticleViewProps } from './types';
import { idToFileName } from './utils';

export default function PhotoArticle({ id, caption }: PhotoArticleProps) {
  const { t } = useTranslation('articleBlocks');
  const articleContent = useArticleContent();
  const editorArticle = useEditorArticle();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenIcon, setShowFullscreenIcon] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const editorArticleRef = useRef(editorArticle);
  editorArticleRef.current = editorArticle;

  useEffect(() => {
    const loadImage = () => {
      try {
        setLoading(true);
        setError(null);
        setImageLoaded(false);
        const editor = editorArticleRef.current;
        if (editor) {
          const file = idToFileName(id);
          const url = editor.getFileUrl(file);
          if (url) {
            setImageUrl(url);
          } else {
            setError(t('photoArticle.imageNotFoundInEditorAssets'));
            setLoading(false);
          }
        } else if (articleContent) {
          setError(t('photoArticle.imageNotAvailableInPreview'));
          setLoading(false);
        } else {
          setError(t('photoArticle.imageNotAvailable'));
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('photoArticle.failedToLoadImage'));
        setLoading(false);
      }
    };

    loadImage();
  }, [id, articleContent?.articleId, t]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoading(false);
  };

  const isFullscreenActive = useCallback(() => {
    const el = fullscreenRef.current;
    // Inline view does not attach fullscreenRef; both refs would be null and
    // `null === getFullscreenElement()` would wrongly read as "fullscreen active".
    if (!el) return false;
    return getFullscreenElement() === el;
  }, []);

  const handleFullscreen = useCallback(() => {
    if (isFullscreenActive()) {
      exitDocumentFullscreen();
    } else {
      setIsFullscreen(true);
    }
  }, [isFullscreenActive]);

  useEffect(() => {
    if (!isFullscreen || isFullscreenActive()) return;

    const timer = setTimeout(() => {
      if (fullscreenRef.current && !isFullscreenActive()) {
        requestElementFullscreen(fullscreenRef.current);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isFullscreen, isFullscreenActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    setIsFullscreen(isFullscreenActive());
    return subscribeToFullscreenChanges(handleFullscreenChange);
  }, [isFullscreenActive]);

  useEffect(() => {
    if (!isFullscreen || !fullscreenRef.current) return;

    const resetIconTimeout = () => setShowFullscreenIcon(true);
    const handleMouseMove = () => resetIconTimeout();
    const handleMouseLeave = () => {
      setTimeout(() => {
        setShowFullscreenIcon(false);
      }, 2000);
    };

    setShowFullscreenIcon(true);

    const element = fullscreenRef.current;
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFullscreen]);

  const viewProps: PhotoArticleViewProps = {
    caption,
    imageUrl,
    loading,
    error,
    imageLoaded,
    showFullscreenIcon,
    imageContainerRef,
    fullscreenRef,
    onInlineMouseEnter: () => setShowFullscreenIcon(true),
    onInlineMouseLeave: () => setShowFullscreenIcon(false),
    onFullscreenToggle: handleFullscreen,
    onImageLoad: handleImageLoad,
    onImageError: () => {
      setError(t('photoArticle.failedToLoadImage'));
      setLoading(false);
    },
    t,
  };

  return isFullscreen ? <PhotoArticleFullscreen {...viewProps} /> : <PhotoArticleInline {...viewProps} />;
}
