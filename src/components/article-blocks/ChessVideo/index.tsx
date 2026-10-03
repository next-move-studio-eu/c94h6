import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { SquarePlay, ChevronDown } from 'lucide-react';
import { Chess } from 'chess.js';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useArticleContent } from '../../../contexts/ArticleContentContext';
import { useEditorArticle } from '../../../contexts/EditorArticleContext';
import { useTranslation } from 'react-i18next';
import type { ChessPositionTag } from '../../../types/video';
import JSZip from 'jszip';
import { useFullscreenAutoHideControls } from '../../../hooks/useFullscreenAutoHideControls';
import {
  exitDocumentFullscreen,
  isElementInFullscreen,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../../../utils/fullscreen';
import ChessVideoFullscreen from './ChessVideoFullscreen';
import ChessVideoInline from './ChessVideoInline';
import type { ChessVideoProps } from './types';
import { DEFAULT_FEN, formatDuration, toVideoZipName } from './utils';

export default function ChessVideo({ videoIdentifier, title: titleProp }: ChessVideoProps) {
  const { mode } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation('articleBlocks');
  const articleContent = useArticleContent();
  const editorArticle = useEditorArticle();
  const zipName = toVideoZipName(videoIdentifier);
  const isEditorPreview = !articleContent?.articleId && editorArticle != null;
  const editorZipUrl = isEditorPreview ? editorArticle?.getFileUrl(zipName) ?? null : null;
  const entry = articleContent?.attachmentsMetadata?.[zipName];
  const accessLevel =
    typeof entry === 'object' && entry !== null && 'accessLevel' in entry
      ? (entry as { accessLevel?: string }).accessLevel
      : undefined;
  const isPaid = accessLevel === 'paid';
  const hasAccess = !isPaid || (user?.roles ?? []).includes('CHESSVIDEO');
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
  const [chessMetadata, setChessMetadata] = useState<ChessPositionTag[] | null>(null);
  const [currentFen, setCurrentFen] = useState(DEFAULT_FEN);
  const [currentHighlights, setCurrentHighlights] = useState('');
  const [currentLookingOnWhite, setCurrentLookingOnWhite] = useState(true);
  const [game, setGame] = useState<Chess>(() => new Chess(DEFAULT_FEN));
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenControlsRef = useRef<HTMLDivElement>(null);
  const [fullscreenControlsHeight, setFullscreenControlsHeight] = useState(0);
  const [boardScale, setBoardScale] = useState(1);
  const revokeRefs = useRef<{ urls: string[] }>({ urls: [] });
  const accordionId = useId();
  const contentId = `${accordionId}-content`;

  const displayTitle = titleProp?.trim() || t('videoPlayer.playVideo');
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
            setLoadError(t('chessVideo.notAvailablePreview'));
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
          setLoadError(t('chessVideo.missingAudio'));
          return;
        }
        const audioBlob = await audioEntry.async('blob');
        const audioBlobUrl = URL.createObjectURL(audioBlob);
        revokeRefs.current.urls.push(audioBlobUrl);
        setAudioUrl(audioBlobUrl);

        const metaEntry = zip.file('metadata.json');
        if (metaEntry) {
          const metaJson = await metaEntry.async('string');
          const meta: ChessPositionTag[] = JSON.parse(metaJson);
          if (!cancelled) {
            setChessMetadata(meta);
            if (meta.length > 0) {
              const first = meta[0];
              setCurrentFen(first.fen);
              setCurrentHighlights(first.highlight ?? '');
              if (first.lookingOnWhite !== undefined) setCurrentLookingOnWhite(first.lookingOnWhite);
              setGame(new Chess(first.fen));
              if (first.timestamp > 0) setCurrentTime(first.timestamp / 1000);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('chessVideo.loadFailed'));
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
      setChessMetadata(null);
      setCurrentFen(DEFAULT_FEN);
      setCurrentHighlights('');
      setCurrentLookingOnWhite(true);
      setGame(new Chess(DEFAULT_FEN));
    };
  }, [isOpen, articleContent?.articleId, zipName, showGetAccess, editorZipUrl, t]);

  useEffect(() => {
    if (!chessMetadata?.length) return;

    const currentTimeMs = currentTime * 1000;
    let active: ChessPositionTag | null = null;
    for (let i = chessMetadata.length - 1; i >= 0; i--) {
      if (chessMetadata[i].timestamp <= currentTimeMs) {
        active = chessMetadata[i];
        break;
      }
    }
    if (active) {
      setCurrentFen(active.fen);
      setCurrentHighlights(active.highlight ?? '');
      if (active.lookingOnWhite !== undefined) setCurrentLookingOnWhite(active.lookingOnWhite);
      try {
        setGame(new Chess(active.fen));
      } catch {
        // ignore invalid FEN
      }
    }
  }, [currentTime, chessMetadata]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleSeek = useCallback((time: number) => setCurrentTime(time), []);
  const handleTimeUpdate = useCallback((time: number) => setCurrentTime(time), []);

  const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    if (isPlaying) return;
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move({
        from: move.from as 'a1',
        to: move.to as 'h8',
        promotion: move.promotion as 'q',
      });
      if (result) {
        setGame(newGame);
        setCurrentFen(newGame.fen());
        setCurrentHighlights('');
      }
    } catch {
      // ignore
    }
  }, [game, isPlaying]);

  const handleSquareClick = useCallback((_s: string) => {
    if (isPlaying) handlePause();
  }, [isPlaying, handlePause]);

  const findPreviousFen = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
    if (!chessMetadata?.length) {
      handleSeek(Math.max(0, currentTime - 10));
      return;
    }

    const currentTimeMs = currentTime * 1000;
    let i = -1;
    for (let j = chessMetadata.length - 1; j >= 0; j--) {
      if (chessMetadata[j].timestamp <= currentTimeMs) {
        i = j;
        break;
      }
    }
    if (i <= 0) {
      handleSeek(0);
      return;
    }
    handleSeek(chessMetadata[i - 1].timestamp / 1000);
  }, [chessMetadata, currentTime, handleSeek, isPlaying]);

  const findNextFen = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
    if (!chessMetadata?.length) return;

    const currentTimeMs = currentTime * 1000;
    let i = -1;
    for (let j = chessMetadata.length - 1; j >= 0; j--) {
      if (chessMetadata[j].timestamp <= currentTimeMs) {
        i = j;
        break;
      }
    }
    if (i + 1 < chessMetadata.length) {
      handleSeek(chessMetadata[i + 1].timestamp / 1000);
    } else {
      handleSeek(durationSeconds || 0);
    }
  }, [chessMetadata, currentTime, isPlaying, durationSeconds, handleSeek]);

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

  useEffect(() => {
    if (!isFullscreen) return;
    const boardBaseSize = 450;
    const calculateScale = () => {
      const availableWidth = window.innerWidth * 0.95;
      const controlsHeight = showFullscreenControls ? fullscreenControlsHeight : 0;
      const availableHeight = (window.innerHeight - controlsHeight) * 0.95;
      const scale = Math.min(availableWidth / boardBaseSize, availableHeight / boardBaseSize);
      setBoardScale(Math.max(0.5, Math.min(scale, 3)));
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [isFullscreen, showFullscreenControls, fullscreenControlsHeight]);

  const viewProps = {
    mode,
    fullscreenControlsRef,
    loadError,
    audioUrl,
    isLoading,
    currentFen,
    currentHighlights,
    currentLookingOnWhite,
    isPlaying,
    currentTime,
    handleMove,
    handleSquareClick,
    boardScale,
    showFullscreenControls,
    fullscreenControlsHeight,
    durationSeconds,
    isFullscreen,
    handlePlay,
    handlePause,
    handleSeek,
    handleTimeUpdate,
    findPreviousFen,
    findNextFen,
    handleFullscreen,
    videoPlayerTexts: {
      enterFullscreen: t('videoPlayer.enterFullscreen'),
      exitFullscreen: t('videoPlayer.exitFullscreen'),
      skipBackward: t('videoPlayer.skipBackward'),
      skipForward: t('videoPlayer.skipForward'),
    },
  };

  if (showGetAccess) {
    return (
      <div className="my-6 rounded-xl p-6 text-center surface-container-high">
        <p style={{ color: `var(--textSecondary)` }}>{t('articleCard.getAccess')}</p>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl surface-container-high">
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
          <SquarePlay className="w-5 h-5" strokeWidth={2} />
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
        <div className="px-5 pb-5 pt-4">
          <div
            ref={containerRef}
            className={isFullscreen ? 'relative w-full h-[100vh] min-h-0' : 'w-full'}
            style={isFullscreen ? { height: '100vh', backgroundColor: `var(--bg)` } : undefined}
          >
            {isFullscreen ? <ChessVideoFullscreen {...viewProps} /> : <ChessVideoInline {...viewProps} />}
          </div>
        </div>
      </div>
    </div>
  );
}
