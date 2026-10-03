import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Video as VideoIcon, ChevronDown, Film } from 'lucide-react';
import { useEditorArticle } from '../../contexts/EditorArticleContext';
import { useArticleContent } from '../../contexts/ArticleContentContext';
import { useFullscreenAutoHideControls } from '../../hooks/useFullscreenAutoHideControls';
import {
  exitDocumentFullscreen,
  isElementInFullscreen,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../../utils/fullscreen';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—:—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function idToFileName(id: string): string {
  const n = String(id).replace(/\D/g, '');
  return n ? `video${n}.webm` : 'video1.webm';
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface VideoControlsBarProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

function VideoControlsBar({
  duration,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onFullscreen,
  isFullscreen,
}: VideoControlsBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
      const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      onSeek(pct * duration);
    },
    [duration, onSeek]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleSeek(e);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleSeek]);

  return (
    <div className="rounded-xl p-4 surface-container">
      {/* Progress bar */}
      <div
        ref={progressBarRef}
        onMouseDown={(e) => { setIsDragging(true); handleSeek(e); }}
        onClick={handleSeek}
        className="mb-4 h-2 w-full cursor-pointer rounded-full bg-[var(--md-sys-color-surface-container-highest)]"
      >
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: `var(--primary)`,
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="btn-icon-filled shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <div
          className="flex-shrink-0 flex items-center gap-1.5 font-mono text-sm tabular-nums"
          style={{ color: `var(--text)` }}
        >
          <span>{formatTime(currentTime)}</span>
          <span style={{ color: `var(--textSecondary)` }}>/</span>
          <span style={{ color: `var(--textSecondary)` }}>{formatTime(duration)}</span>
        </div>

        <div className="flex-1" />

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={onFullscreen}
          className="btn-icon shrink-0"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export interface VideoProps {
  id: string;
  title: string;
}

export default function Video({ id, title }: VideoProps) {
  const editorArticle = useEditorArticle();
  const articleContent = useArticleContent();

  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const revokeRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [videoAreaSize, setVideoAreaSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoAreaRef = useRef<HTMLDivElement>(null);
  const accordionId = useId();
  const contentId = `${accordionId}-content`;

  const fileName = idToFileName(id);
  const meta = editorArticle?.getArticleVideoMeta?.(id) ?? null;
  const readerMeta = articleContent?.attachmentsMetadata?.[fileName];
  const durationSeconds = meta?.durationSeconds ?? (typeof readerMeta?.durationSeconds === 'number' ? readerMeta.durationSeconds : 0);
  const { showControls: showFullscreenControls, setShowControls: setShowFullscreenControls } =
    useFullscreenAutoHideControls({
      enabled: isFullscreen,
      containerRef,
    });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadError(null);
    const resolveUrl = async () => {
      const editor = editorArticle;
      if (editor) {
        const url = editor.getFileUrl(fileName);
        if (url) {
          if (!cancelled) { revokeRef.current = url; setVideoUrl(url); }
          return;
        }
        if (!cancelled) setLoadError('Video not found in article assets.');
        return;
      }
      if (articleContent) {
        if (!cancelled) {
          setLoadError('Video not available in editor preview');
        }
        return;
      }
      if (!cancelled) setLoadError('No article context.');
    };
    resolveUrl();
    return () => {
      cancelled = true;
      const revoke = revokeRef.current;
      if (revoke) { URL.revokeObjectURL(revoke); revokeRef.current = null; }
      setVideoUrl(null);
    };
  }, [isOpen, fileName, editorArticle, articleContent?.articleId]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      if (Number.isFinite(v.duration)) setDuration(v.duration);
      if (v.videoWidth > 0 && v.videoHeight > 0) { setVideoWidth(v.videoWidth); setVideoHeight(v.videoHeight); }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  }, []);

  const handlePlay  = useCallback(() => { videoRef.current?.play();  setIsPlaying(true);  }, []);
  const handlePause = useCallback(() => { videoRef.current?.pause(); setIsPlaying(false); }, []);
  const handleSeek  = useCallback((time: number) => {
    const v = videoRef.current;
    if (v) { v.currentTime = time; setCurrentTime(time); }
  }, []);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isElementInFullscreen(container)) exitDocumentFullscreen();
    else requestElementFullscreen(container);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = isElementInFullscreen(containerRef.current);
      setIsFullscreen(active);
      if (active) setShowFullscreenControls(true);
    };
    return subscribeToFullscreenChanges(onFullscreenChange);
  }, [setShowFullscreenControls]);

  useEffect(() => {
    if (!isFullscreen || !videoAreaRef.current) return;
    const el = videoAreaRef.current;
    const updateSize = () => setVideoAreaSize({ width: el.clientWidth, height: el.clientHeight });
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen]);

  const { displayWidth, displayHeight, offsetX, offsetY } = getFullscreenVideoLayout({
    containerWidth: videoAreaSize.width,
    containerHeight: videoAreaSize.height,
    videoWidth,
    videoHeight,
    isFullscreen,
  });

  const displayDuration = duration > 0 ? duration : durationSeconds;
  const displayDurationStr = formatDuration(displayDuration);

  return (
    <div className="my-6 overflow-hidden rounded-xl surface-container-high">
      {/* Header / toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="focus-ring flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span
          className="flex-shrink-0 flex items-center justify-center"
          style={{ color: `var(--primary)` }}
          aria-hidden
        >
          <VideoIcon className="w-5 h-5" strokeWidth={2} />
        </span>

        <span
          className="flex-1 font-medium text-[0.9375rem] leading-snug min-w-0 truncate"
          style={{ color: `var(--text)` }}
        >
          {title}
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

      {/* Expandable content */}
      <div
        id={contentId}
        role="region"
        className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 pb-5 pt-4">
          <div
            className={isFullscreen ? `relative w-full ${!showFullscreenControls ? 'cursor-none' : ''}` : 'pt-4 space-y-3'}
            ref={containerRef}
            style={isFullscreen ? { height: '100vh', backgroundColor: `var(--bg)` } : undefined}
          >
            {/* Video area */}
            <div
              ref={isFullscreen ? videoAreaRef : undefined}
              className={isFullscreen ? 'absolute inset-0 overflow-hidden' : 'relative w-full overflow-hidden rounded-lg'}
              style={
                isFullscreen
                  ? { backgroundColor: `var(--bg)` }
                  : { aspectRatio: '16/9', backgroundColor: `var(--bg)` }
              }
            >
              {loadError && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-sm p-4"
                  style={{
                    backgroundColor: `var(--errorSubtle)`,
                    color: `var(--error)`,
                  }}
                >
                  {loadError}
                </div>
              )}

              {!videoUrl && !loadError && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: `var(--surfaceHigh)` }}
                >
                  <Film
                    className="w-12 h-12 opacity-30"
                    style={{ color: `var(--textSecondary)` }}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
              )}

              {videoUrl && (
                <div
                  className={isFullscreen ? 'absolute overflow-hidden' : 'absolute inset-0'}
                  style={
                    isFullscreen
                      ? { left: offsetX, top: offsetY, width: displayWidth, height: displayHeight }
                      : undefined
                  }
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    playsInline
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}

            </div>

            {/* Controls */}
            {videoUrl && !loadError && (
              <div
                className={
                  isFullscreen
                    ? `absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showFullscreenControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
                    : undefined
                }
              >
                <VideoControlsBar
                  duration={duration > 0 ? duration : displayDuration}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onFullscreen={handleFullscreen}
                  isFullscreen={isFullscreen}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFullscreenVideoLayout({
  containerWidth,
  containerHeight,
  videoWidth,
  videoHeight,
  isFullscreen,
}: {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  isFullscreen: boolean;
}) {
  const aspectRatio = (videoWidth || 16) / (videoHeight || 9);
  let displayWidth = containerWidth;
  let displayHeight = containerHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (containerWidth > 0 && containerHeight > 0 && isFullscreen) {
    if (containerWidth / containerHeight > aspectRatio) {
      displayHeight = containerHeight;
      displayWidth = containerHeight * aspectRatio;
      offsetX = (containerWidth - displayWidth) / 2;
    } else {
      displayWidth = containerWidth;
      displayHeight = containerWidth / aspectRatio;
      offsetY = (containerHeight - displayHeight) / 2;
    }
  }

  return { displayWidth, displayHeight, offsetX, offsetY };
}
