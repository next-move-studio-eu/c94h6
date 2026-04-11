import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Presentation, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useArticleContent } from '../../../contexts/ArticleContentContext';
import { useEditorArticle } from '../../../contexts/EditorArticleContext';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { useFullscreenAutoHideControls } from '../../../hooks/useFullscreenAutoHideControls';
import {
  exitDocumentFullscreen,
  isElementInFullscreen,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../../../utils/fullscreen';
import SlideshowFullscreen from './SlideshowFullscreen';
import SlideshowInline from './SlideshowInline';
import type { ImageTimestamp, SlideshowControlsProps, SlideshowProps } from './types';
import { formatDuration, toSlideshowZipName } from './utils';

export default function Slideshow({ slideshowIdentifier, title: titleProp }: SlideshowProps) {
  const { user } = useAuth();
  const { t } = useTranslation('articleBlocks');
  const articleContent = useArticleContent();
  const editorArticle = useEditorArticle();
  const zipName = toSlideshowZipName(slideshowIdentifier);
  const isEditorPreview = !articleContent?.articleId && editorArticle != null;
  const editorZipUrl = isEditorPreview ? editorArticle?.getFileUrl(zipName) ?? null : null;
  const entry = articleContent?.attachmentsMetadata?.[zipName];
  const accessLevel =
    typeof entry === 'object' && entry !== null && 'accessLevel' in entry
      ? (entry as { accessLevel?: string }).accessLevel
      : undefined;
  const isPaid = accessLevel === 'paid';
  const hasAccess = !isPaid || (user?.roles ?? []).includes('SLIDESHOW');
  const showGetAccess = isPaid && !hasAccess;

  const [editorMeta, setEditorMeta] = useState<{ durationSeconds: number; sizeBytes: number } | null>(null);
  useEffect(() => {
    if (!isEditorPreview || !editorArticle?.getAttachmentMeta) {
      setEditorMeta(null);
      return;
    }

    let cancelled = false;
    editorArticle.getAttachmentMeta(zipName).then((meta) => {
      if (!cancelled && meta) setEditorMeta(meta);
    });

    return () => {
      cancelled = true;
    };
  }, [isEditorPreview, editorArticle, zipName]);

  const durationSeconds =
    typeof (entry as { durationSeconds?: number })?.durationSeconds === 'number'
      ? (entry as { durationSeconds: number }).durationSeconds
      : (editorMeta?.durationSeconds ?? 0);
  const [isOpen, setIsOpen] = useState(false);
  const [timestamps, setTimestamps] = useState<ImageTimestamp[] | null>(null);
  const [currentImageNumber, setCurrentImageNumber] = useState<number | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<number, string>>(new Map());
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenControlsRef = useRef<HTMLDivElement>(null);
  const [fullscreenControlsHeight, setFullscreenControlsHeight] = useState(0);
  const revokeRefs = useRef<{ urls: string[] }>({ urls: [] });
  const accordionId = useId();
  const contentId = `${accordionId}-content`;
  const displayTitle = titleProp?.trim() || t('slideshowPlayer.play');
  const displayDurationStr = formatDuration(durationSeconds);
  const { showControls: showFullscreenControls, setShowControls: setShowFullscreenControls } =
    useFullscreenAutoHideControls({
      enabled: isFullscreen,
      containerRef,
    });

  useEffect(() => {
    if (!isOpen || showGetAccess) return;
    if (!articleContent?.articleId && !editorZipUrl) return;

    let cancelled = false;
    setLoadError(null);
    setIsLoading(true);

    const run = async () => {
      try {
        let url: string | null = editorZipUrl ?? null;
        if (!url && articleContent?.articleId) {
          if (!cancelled) {
            setLoadError(t('slideshow.notAvailablePreview'));
            setIsLoading(false);
          }
          return;
        }
        if (!url || cancelled) return;

        const res = await fetch(url);
        const blob = await res.blob();
        if (cancelled) return;
        const zip = await JSZip.loadAsync(blob);

        const audioEntry = zip.file('audio.webm');
        if (!audioEntry) {
          setLoadError(t('slideshow.missingAudio'));
          return;
        }
        const audioBlob = await audioEntry.async('blob');
        const audioBlobUrl = URL.createObjectURL(audioBlob);
        revokeRefs.current.urls.push(audioBlobUrl);
        setAudioUrl(audioBlobUrl);

        const tsEntry = zip.file('timestamps.json');
        if (!tsEntry) {
          setLoadError(t('slideshow.missingTimestamps'));
          return;
        }
        const tsJson = await tsEntry.async('string');
        const data: ImageTimestamp[] = JSON.parse(tsJson);
        if (!cancelled) setTimestamps(data);

        const imageMap = new Map<number, string>();
        for (const item of data) {
          const n = item.image;
          if (!imageMap.has(n)) {
            const imgEntry = zip.file(`${n}.avif`);
            if (imgEntry) {
              const imgBlob = await imgEntry.async('blob');
              const imgUrl = URL.createObjectURL(imgBlob);
              revokeRefs.current.urls.push(imgUrl);
              imageMap.set(n, imgUrl);
            }
          }
        }

        if (!cancelled) {
          setImageBlobUrls(imageMap);
          if (data.length > 0) {
            const first = data[0];
            setCurrentImageNumber(first.image);
            setCurrentImageUrl(imageMap.get(first.image) ?? null);
            if (first.timestamp > 0) setCurrentTime(first.timestamp / 1000);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('slideshow.loadFailed'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      revokeRefs.current.urls.forEach((u) => URL.revokeObjectURL(u));
      revokeRefs.current.urls = [];
      setAudioUrl(null);
      setTimestamps(null);
      setImageBlobUrls(new Map());
      setCurrentImageUrl(null);
      setCurrentImageNumber(null);
    };
  }, [isOpen, articleContent?.articleId, zipName, showGetAccess, editorZipUrl, t]);

  useEffect(() => {
    if (!timestamps?.length || !imageBlobUrls.size) return;

    const currentTimeMs = currentTime * 1000;
    let active: ImageTimestamp | null = null;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i].timestamp <= currentTimeMs) {
        active = timestamps[i];
        break;
      }
    }

    if (active && active.image !== currentImageNumber) {
      setCurrentImageNumber(active.image);
      setCurrentImageUrl(imageBlobUrls.get(active.image) ?? null);
    }
  }, [currentTime, timestamps, currentImageNumber, imageBlobUrls]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleSeek = useCallback((time: number) => setCurrentTime(time), []);
  const handleTimeUpdate = useCallback((time: number) => setCurrentTime(time), []);

  const findPreviousTimestamp = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
    if (!timestamps?.length) {
      handleSeek(Math.max(0, currentTime - 10));
      return;
    }

    const currentTimeMs = currentTime * 1000;
    let idx = -1;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i].timestamp <= currentTimeMs) {
        idx = i;
        break;
      }
    }
    if (idx <= 0) {
      handleSeek(0);
      return;
    }
    handleSeek(timestamps[idx - 1].timestamp / 1000);
  }, [timestamps, currentTime, handleSeek, isPlaying]);

  const findNextTimestamp = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
    if (!timestamps?.length) return;

    const currentTimeMs = currentTime * 1000;
    let idx = -1;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i].timestamp <= currentTimeMs) {
        idx = i;
        break;
      }
    }
    if (idx < timestamps.length - 1) {
      handleSeek(timestamps[idx + 1].timestamp / 1000);
    } else {
      handleSeek(durationSeconds || 0);
    }
  }, [timestamps, currentTime, isPlaying, durationSeconds, handleSeek]);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isElementInFullscreen(container)) {
      exitDocumentFullscreen();
    } else {
      requestElementFullscreen(container);
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const active = isElementInFullscreen(containerRef.current);
      setIsFullscreen(active);
      if (active) setShowFullscreenControls(true);
    };

    return subscribeToFullscreenChanges(onChange);
  }, [setShowFullscreenControls]);

  useEffect(() => {
    if (!isFullscreen || !showFullscreenControls || !fullscreenControlsRef.current) {
      setFullscreenControlsHeight(0);
      return;
    }

    const el = fullscreenControlsRef.current;
    const updateHeight = () => setFullscreenControlsHeight(el.offsetHeight);
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen, showFullscreenControls]);

  const controlsPropsBase: Omit<SlideshowControlsProps, 'variant' | 'controlsRef' | 'showFullscreenControls'> = {
    audioUrl: audioUrl ?? '',
    durationSeconds,
    isPlaying,
    currentTime,
    isFullscreen,
    handlePlay,
    handlePause,
    handleSeek,
    handleTimeUpdate,
    findPreviousTimestamp,
    findNextTimestamp,
    handleFullscreen,
    texts: {
      enterFullscreen: t('videoPlayer.enterFullscreen'),
      exitFullscreen: t('videoPlayer.exitFullscreen'),
      skipBackward: t('slideshowPlayer.skipBackward'),
      skipForward: t('slideshowPlayer.skipForward'),
    },
  };

  if (showGetAccess) {
    return (
      <div
        className="my-6 rounded-lg overflow-hidden border p-6 text-center"
        style={{
          borderColor: `var(--borderSubtle)`,
          backgroundColor: `var(--surfaceHigh)`,
        }}
      >
        <p style={{ color: `var(--textSecondary)` }}>{t('articleCard.getAccess')}</p>
      </div>
    );
  }

  return (
    <div
      className="my-6 rounded-lg overflow-hidden border"
      style={{
        borderColor: `var(--borderSubtle)`,
        backgroundColor: `var(--surfaceHigh)`,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `var(--hoverBg)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span
          className="flex-shrink-0 flex items-center justify-center"
          style={{ color: `var(--primary)` }}
          aria-hidden
        >
          <Presentation className="w-5 h-5" strokeWidth={2} />
        </span>
        <span
          className="flex-1 font-medium text-[0.9375rem] leading-snug min-w-0 truncate"
          style={{ color: `var(--text)` }}
        >
          {displayTitle}
        </span>
        <span
          className="flex-shrink-0 flex items-center gap-2 text-sm tabular-nums"
          style={{ color: `var(--textSecondary)` }}
        >
          {displayDurationStr}
        </span>
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: `var(--textSecondary)` }}
          aria-hidden
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2} />
        </span>
      </button>
      <div
        id={contentId}
        role="region"
        className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: `var(--divider)` }}>
          <div
            ref={containerRef}
            className={isFullscreen ? 'relative w-full h-[100vh] min-h-0' : 'w-full'}
            style={isFullscreen ? { height: '100vh', backgroundColor: `var(--bg)` } : undefined}
          >
            {isFullscreen ? (
              <SlideshowFullscreen
                fullscreenControlsRef={fullscreenControlsRef}
                loadError={loadError}
                audioUrl={audioUrl}
                isLoading={isLoading}
                currentImageUrl={currentImageUrl}
                showFullscreenControls={showFullscreenControls}
                fullscreenControlsHeight={fullscreenControlsHeight}
                controlsPropsBase={controlsPropsBase}
              />
            ) : (
              <SlideshowInline
                fullscreenControlsRef={fullscreenControlsRef}
                loadError={loadError}
                audioUrl={audioUrl}
                isLoading={isLoading}
                currentImageUrl={currentImageUrl}
                showFullscreenControls={showFullscreenControls}
                fullscreenControlsHeight={fullscreenControlsHeight}
                controlsPropsBase={controlsPropsBase}
              />
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes videoPlaceholderShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
