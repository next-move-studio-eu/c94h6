import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Music } from 'lucide-react';
import { useEditorArticle } from '../../contexts/EditorArticleContext';
import { useArticleContent } from '../../contexts/ArticleContentContext';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function idToFileName(id: string): string {
  const n = String(id).replace(/\D/g, '');
  return n ? `audio${n}.webm` : 'audio1.webm';
}

export interface ArticleAudioProps {
  id: string;
  title?: string;
}

export default function ArticleAudio({
  id,
  title = '',
}: ArticleAudioProps) {
  const editorArticle = useEditorArticle();
  const articleContent = useArticleContent();

  const [isOpen, setIsOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const revokeRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileName = idToFileName(id);
  const meta = editorArticle?.getArticleAudioMeta?.(id) ?? null;
  const readerMeta = articleContent?.attachmentsMetadata?.[fileName];
  const durationSeconds = meta?.durationSeconds ?? (typeof readerMeta?.durationSeconds === 'number' ? readerMeta.durationSeconds : 0);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadError(null);
    const resolveUrl = () => {
      const editor = editorArticle;
      if (editor) {
        const url = editor.getFileUrl(fileName);
        if (url) {
          if (!cancelled) {
            revokeRef.current = url;
            setAudioUrl(url);
          }
          return;
        }
        if (!cancelled) setLoadError('Audio not found in article assets.');
        return;
      }
      if (articleContent) {
        if (!cancelled) setLoadError('Audio not available in editor preview');
        return;
      }
      if (!cancelled) setLoadError('No article context.');
    };
    resolveUrl();
    return () => {
      cancelled = true;
      const revoke = revokeRef.current;
      if (revoke) {
        URL.revokeObjectURL(revoke);
        revokeRef.current = null;
      }
      setAudioUrl(null);
    };
  }, [isOpen, fileName, editorArticle, articleContent?.articleId]);

  const handleLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) setDuration(a.duration);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a) setCurrentTime(a.currentTime);
  }, []);

  const handlePlay = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const a = audioRef.current;
    if (!el || !a || !(duration > 0)) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
    setCurrentTime(a.currentTime);
  }, [duration]);

  const displayDuration = duration > 0 ? duration : durationSeconds;
  const progress = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl surface-container-high">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="focus-ring flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]"
      >
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <Music className="w-4 h-4 shrink-0" style={{ color: `var(--primary)` }} />
        <span className="font-medium truncate">{title || `Audio ${id}`}</span>
        {displayDuration > 0 && (
          <span className="ml-auto text-sm opacity-80">{formatTime(displayDuration)}</span>
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-3">
          {loadError && (
            <p className="text-sm py-2" style={{ color: `var(--error)` }}>
              {loadError}
            </p>
          )}
          {audioUrl && !loadError && (
            <>
              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                preload="metadata"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="btn-icon-filled shrink-0"
                >
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div
                    role="progressbar"
                    tabIndex={0}
                    onClick={handleSeek}
                    className="h-2 w-full cursor-pointer rounded-full bg-[var(--md-sys-color-surface-container-highest)]"
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: `var(--primary)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: `var(--textSecondary)` }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(displayDuration)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
