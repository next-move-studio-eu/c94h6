
import type { RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Chess } from 'chess.js';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EngineAnalysisOutputRef } from '../components/EngineAnalysisOutput';
import type { PositionChangeEvent, PgnViewerRef } from '../components/PgnViewer';
import ReplayMoves from '../components/ReplayMoves';
import type { ReplayMovesAction, ReplayMovesRef } from '../components/ReplayMoves';
import ChessBoard from '../components/ChessBoard';
import DownloadSuccessToast from '../components/DownloadSuccessToast';
import { useFullscreenAutoHideControls } from '../hooks/useFullscreenAutoHideControls';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useRecorderSession } from '../contexts/RecorderSessionContext';
import {
  initTauriUciEngine,
  isTauri,
  tauriUciEngineStatus,
} from '../engine/tauriUciAdapter';
import RecorderBoardColumn from '../components/video-recorder/RecorderBoardColumn';
import RecorderCopyPopup from '../components/video-recorder/RecorderCopyPopup';
import RecorderHighlightPanel from '../components/video-recorder/RecorderHighlightPanel';
import RecorderPreviewPlayer from '../components/video-recorder/RecorderPreviewPlayer';
import RecorderSidebar from '../components/video-recorder/RecorderSidebar';
import type {
  AppMode,
  BoardMode,
  HighlightColor,
  RecorderPageTexts,
  RecorderSessionState,
  RecordingState,
} from '../components/video-recorder/types';
import { buildVideoPlayerTexts } from '../components/video-recorder/utils';
import { createBlockId } from '../types/articleEditor';
import type { ChessPositionTag } from '../types/video';
import {
  exitDocumentFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../utils/fullscreen';
import { saveBlobWithResolver } from '../utils/savePathResolver';
import JSZip from 'jszip';

export default function VideoRecorderPage() {
  const { mode } = useTheme();
  const { t } = useTranslation(['videoRecorderPage', 'common']);
  const {
    pgn,
    setPgn,
    fen,
    setFen,
    highlights,
    setHighlights,
    lookingOnWhite,
    setLookingOnWhite,
    pgnSelection,
    setPgnSelection,
  } = useRecorderSession();

  const colorNames = useMemo<Record<HighlightColor, string>>(
    () => ({
      G: t('videoRecorderPage.colorNames.G'),
      R: t('videoRecorderPage.colorNames.R'),
      Y: t('videoRecorderPage.colorNames.Y'),
      B: t('videoRecorderPage.colorNames.B'),
      O: t('videoRecorderPage.colorNames.O'),
      P: t('videoRecorderPage.colorNames.P'),
    }),
    [t]
  );

  const colorValues: Record<HighlightColor, string> = {
    G: 'var(--highlightGreenArrow)',
    R: 'var(--highlightRedArrow)',
    Y: 'var(--highlightYellowArrow)',
    B: 'var(--highlightBlueArrow)',
    O: 'var(--highlightOrangeArrow)',
    P: 'var(--highlightPurpleArrow)',
  };

  const pgnViewerTexts = useMemo(
    () => ({
      vs: t('videoRecorderPage.pgnVs'),
      study: t('videoRecorderPage.pgnStudyPrefix'),
      fenPosition: t('videoRecorderPage.pgnFenPosition'),
      game: t('videoRecorderPage.pgnGame'),
      selectMove: t('videoRecorderPage.pgnSelectMove'),
      main: t('videoRecorderPage.pgnMainLine'),
      comment: t('videoRecorderPage.pgnCommentAria'),
      previousGame: t('videoRecorderPage.pgnPreviousGameAria'),
      nextGame: t('videoRecorderPage.pgnNextGameAria'),
      loadPgn: t('videoRecorderPage.loadPgnButton'),
      loadPgnError: t('videoRecorderPage.loadPgnError'),
      loadPgnNoGames: t('videoRecorderPage.loadPgnNoGames'),
    }),
    [t]
  );

  const videoPlayerTexts = useMemo(() => buildVideoPlayerTexts(t), [t]);
  const texts = useMemo<RecorderPageTexts>(
    () => ({
      t,
      colorNames,
      colorValues,
      pgnViewerTexts,
      videoPlayerTexts,
    }),
    [t, colorNames, pgnViewerTexts, videoPlayerTexts]
  );

  const [game, setGame] = useState<Chess>(() => new Chess(fen));
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [positions, setPositions] = useState<ChessPositionTag[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0);
  const [boardMode, setBoardMode] = useState<BoardMode>('play');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [clearHighlightsOnMove, setClearHighlightsOnMove] = useState(true);
  const [isWebMSupported, setIsWebMSupported] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [appMode, setAppMode] = useState<AppMode>('recording');
  const [recordedZipBlob, setRecordedZipBlob] = useState<Blob | null>(null);
  const [previewPositions, setPreviewPositions] = useState<ChessPositionTag[]>([]);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloadSuccessToast, setShowDownloadSuccessToast] = useState(false);
  const [fenCopiedFeedback, setFenCopiedFeedback] = useState(false);
  const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [videoPlayerHeight, setVideoPlayerHeight] = useState(0);
  const [boardColumnHeight, setBoardColumnHeight] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<1 | 5 | null>(null);
  const [analysisConnectionReady, setAnalysisConnectionReady] = useState(false);
  const [loadUciPending, setLoadUciPending] = useState(false);
  const [uciReadyOptimistic, setUciReadyOptimistic] = useState(false);

  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenControlsRef = useRef<HTMLDivElement>(null);
  const boardColumnRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm; codecs=opus');
  const analysisOutputRef = useRef<EngineAnalysisOutputRef>(null);
  const pgnViewerRef = useRef<PgnViewerRef>(null);
  const replayMovesRef = useRef<ReplayMovesRef>(null);
  const prevAnalysisConnectionReadyRef = useRef(false);
  const { showControls: showFullscreenControls, setShowControls: setShowFullscreenControls } =
    useFullscreenAutoHideControls({
      enabled: isFullscreen && appMode === 'preview',
      containerRef: fullscreenRef,
      pauseRef: fullscreenControlsRef,
      hideDelayMs: 2000,
    });

  useEffect(() => {
    if (analysisConnectionReady || prevAnalysisConnectionReadyRef.current) {
      setUciReadyOptimistic(false);
    }
    prevAnalysisConnectionReadyRef.current = analysisConnectionReady;
  }, [analysisConnectionReady]);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    void tauriUciEngineStatus().then((ready) => {
      if (!cancelled && ready) setUciReadyOptimistic(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const uciEngineReady = analysisConnectionReady || uciReadyOptimistic;

  const handleLoadUci = useCallback(async () => {
    if (!isTauri()) return;
    setLoadUciPending(true);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const path = await open({
        title: t('videoRecorderPage.loadUciTitle'),
        multiple: false,
        directory: false,
      });
      const pathStr = typeof path === 'string' ? path : null;
      if (pathStr) {
        const result = await initTauriUciEngine(pathStr);
        if (!result.ok) {
          alert(result.reason ?? t('videoRecorderPage.loadEngineFailed'));
        } else {
          setUciReadyOptimistic(true);
        }
      }
    } catch (error) {
      console.error('Load UCI error:', error);
      alert(error instanceof Error ? error.message : t('videoRecorderPage.loadUciFailed'));
    } finally {
      setLoadUciPending(false);
    }
  }, [t]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const api = analysisOutputRef.current;
      if (!api) return;
      setAnalysisLoading((prev) => (prev === api.isLoading ? prev : api.isLoading));
      setAnalysisMode((prev) => (prev === api.analysisMode ? prev : api.analysisMode));
      setAnalysisConnectionReady((prev) =>
        prev === api.isConnectionReady ? prev : api.isConnectionReady
      );
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
    setIsWebMSupported(webmMimeTypes.some((type) => MediaRecorder.isTypeSupported(type)));
  }, []);

  const savePosition = useCallback(() => {
    if (recordingState !== 'recording') return;
    const elapsed = Date.now() - recordingStartTime - totalPausedDuration;
    const position: ChessPositionTag = {
      timestamp: elapsed,
      fen: game.fen(),
      highlight: highlights,
      lookingOnWhite,
    };
    setPositions((prev) => [...prev, position]);
  }, [recordingState, recordingStartTime, totalPausedDuration, game, highlights, lookingOnWhite]);

  useEffect(() => {
    if (recordingState === 'recording') savePosition();
  }, [fen, highlights, recordingState, savePosition]);

  useEffect(() => {
    let interval: number | null = null;
    if (recordingState === 'recording') {
      interval = window.setInterval(() => {
        const elapsed = Date.now() - recordingStartTime - totalPausedDuration;
        setElapsedTime(Math.floor(elapsed / 1000));
      }, 1000);
    } else if (recordingState === 'paused') {
      setElapsedTime(Math.floor((pausedTime - recordingStartTime - totalPausedDuration) / 1000));
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
  }, [recordingState, recordingStartTime, totalPausedDuration, pausedTime]);

  const handleMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      try {
        const newGame = new Chess(game.fen());
        const result = newGame.move({
          from: move.from as never,
          to: move.to as never,
          promotion: move.promotion as never,
        });
        if (!result) return;
        setGame(newGame);
        setFen(newGame.fen());
        if (clearHighlightsOnMove) {
          setHighlights('');
          setSelectedSquare(null);
        }
        analysisOutputRef.current?.clear();
      } catch (error) {
        console.error('Invalid move:', error);
      }
    },
    [game, clearHighlightsOnMove, setFen, setHighlights]
  );

  const handleNewGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHighlights('');
    setSelectedSquare(null);
    setBoardMode('play');
    analysisOutputRef.current?.clear();
  }, [setFen, setHighlights]);

  const copyTextToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setFenCopiedFeedback(true);
      window.setTimeout(() => setFenCopiedFeedback(false), 2000);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  }, []);

  const handleCopyDiagramJson = useCallback(async () => {
    await copyTextToClipboard(
      JSON.stringify(
        {
          id: createBlockId(),
          type: 'chess-diagram',
          fen,
          highlights,
          lookingOnWhite,
        },
        null,
        2
      )
    );
    setIsCopyPopupOpen(false);
  }, [copyTextToClipboard, fen, highlights, lookingOnWhite]);

  const handleCopyPlayEngineJson = useCallback(
    async (playWithWhite: boolean) => {
      await copyTextToClipboard(
        JSON.stringify(
          {
            id: createBlockId(),
            type: 'play-engine',
            fen,
            playWithWhite,
          },
          null,
          2
        )
      );
      setIsCopyPopupOpen(false);
    },
    [copyTextToClipboard, fen]
  );

  const handleCopyFenOnly = useCallback(async () => {
    await copyTextToClipboard(fen);
    setIsCopyPopupOpen(false);
  }, [copyTextToClipboard, fen]);

  useEffect(() => {
    if (!isCopyPopupOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCopyPopupOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCopyPopupOpen]);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
      const mimeType = webmMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
      if (!mimeType) {
        stream.getTracks().forEach((track) => track.stop());
        alert(t('videoRecorderPage.webmNotSupported'));
        return;
      }
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48000 });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecordingState('recording');
      setRecordingStartTime(Date.now());
      setTotalPausedDuration(0);
      setPausedTime(0);
      const initialPosition: ChessPositionTag = {
        timestamp: 0,
        fen: game.fen(),
        highlight: highlights,
        lookingOnWhite,
      };
      setPositions([initialPosition]);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(t('videoRecorderPage.failedToStartRecording'));
    }
  }, [game, highlights, lookingOnWhite, t]);

  const handlePauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      setPausedTime(Date.now());
    }
  }, [recordingState]);

  const handleResumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      setTotalPausedDuration((prev) => prev + (Date.now() - pausedTime));
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      setPausedTime(0);
    }
  }, [recordingState, pausedTime]);

  const handleStopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecordingState('idle');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const audioBlob = new Blob(audioChunksRef.current, {
      type: mimeTypeRef.current || 'audio/webm; codecs=opus',
    });

    try {
      if (positions.length === 0) throw new Error(t('videoRecorderPage.noPositionsRecorded'));

      const zip = new JSZip();
      zip.file('audio.webm', audioBlob);
      zip.file('metadata.json', JSON.stringify(positions, null, 2));
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      setRecordedZipBlob(zipBlob);
      setPreviewPositions(positions);

      const audioUrl = URL.createObjectURL(audioBlob);
      setPreviewAudioUrl(audioUrl);

      const audio = new Audio(audioUrl);
      const lastPosition = positions[positions.length - 1];
      const fallbackDuration = Math.ceil(lastPosition.timestamp / 1000);

      const handleLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setPreviewDuration(audio.duration);
        } else {
          setPreviewDuration(fallbackDuration);
        }
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      setPreviewDuration(fallbackDuration);
      setAppMode('preview');
      setPreviewCurrentTime(0);
      setPreviewIsPlaying(false);
      setSelectedSquare(null);

      if (positions.length > 0) {
        try {
          const initialGame = new Chess(positions[0].fen);
          setGame(initialGame);
          setFen(positions[0].fen);
          setHighlights(positions[0].highlight || '');
          if (positions[0].lookingOnWhite !== undefined) {
            setLookingOnWhite(positions[0].lookingOnWhite);
          }
        } catch (error) {
          console.error('Invalid initial FEN:', error);
        }
      }

      const { saved } = await saveBlobWithResolver(
        'chess-video',
        `chess-recording-${Date.now()}.zip`,
        zipBlob,
        [{ name: 'Chess recording ZIP', extensions: ['zip'] }]
      );
      if (saved) setShowDownloadSuccessToast(true);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      alert(
        t('videoRecorderPage.failedToSaveRecording', {
          error: error instanceof Error ? error.message : t('videoRecorderPage.unknownError'),
        })
      );
    }

    audioChunksRef.current = [];
  }, [positions, setFen, setHighlights, setLookingOnWhite, t]);

  const handleHighlightClick = useCallback((mode: BoardMode) => {
    setBoardMode((prev) => (prev === mode ? 'play' : mode));
  }, []);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (boardMode === 'play') return;
      const modeType = boardMode.startsWith('square') ? 'square' : 'arrow';
      const color = boardMode.split('-')[1] as HighlightColor;

      if (modeType === 'square') {
        const parts = highlights.split(',').filter((part) => part.trim());
        const existingIndex = parts.findIndex((part) => part.startsWith(square) && part.length === 3);
        if (existingIndex >= 0) parts.splice(existingIndex, 1);
        else parts.push(`${square}${color}`);
        setHighlights(parts.join(','));
        setSelectedSquare(null);
        return;
      }

      if (!selectedSquare) {
        setSelectedSquare(square);
      } else if (selectedSquare === square) {
        setSelectedSquare(null);
      } else {
        const parts = highlights.split(',').filter((part) => part.trim());
        const arrowString = `${selectedSquare}${square}${color}`;
        const existingIndex = parts.findIndex((part) => part === arrowString);
        if (existingIndex >= 0) parts.splice(existingIndex, 1);
        else parts.push(arrowString);
        setHighlights(parts.join(','));
        setSelectedSquare(null);
      }
    },
    [boardMode, highlights, selectedSquare, setHighlights]
  );

  const handleRemoveAllHighlights = useCallback(() => {
    setHighlights('');
    setSelectedSquare(null);
  }, [setHighlights]);

  const handlePositionChange = useCallback(
    (event: PositionChangeEvent) => {
      try {
        const newGame = new Chess(event.fen);
        setGame(newGame);
        setFen(event.fen);
        setHighlights('');
        setSelectedSquare(null);
        setPgnSelection({
          gameIndex: event.gameIndex,
          moveIndex: event.moveIndex,
          fen: event.fen,
          isInitialPosition: event.isInitialPosition,
        });
        analysisOutputRef.current?.clear();
      } catch (error) {
        console.error('Error updating position from PGN viewer:', error);
      }
    },
    [setFen, setHighlights, setPgnSelection]
  );

  const handlePgnLoad = useCallback((loadedPgn: string) => {
    setPgn(loadedPgn);
  }, [setPgn]);

  const handleReplayAction = useCallback((action: ReplayMovesAction) => {
    if (!pgnViewerRef.current) return;
    switch (action) {
      case 'back':
        pgnViewerRef.current.handleBack();
        break;
      case 'forward-main':
        pgnViewerRef.current.handleForwardMain();
        break;
      case 'forward-select':
        pgnViewerRef.current.handleForwardSelect();
        break;
    }
  }, []);

  const forwardSelectButtonRef = useMemo(
    () => ({
      get current() {
        return replayMovesRef.current?.getForwardSelectButton() || null;
      },
    }),
    []
  );

  useEffect(() => {
    if (appMode !== 'preview' || previewPositions.length === 0) return;
    const currentTimeMs = previewCurrentTime * 1000;
    const activeTag = [...previewPositions].reverse().find((position) => position.timestamp <= currentTimeMs) ?? null;
    if (!activeTag) return;
    try {
      const newGame = new Chess(activeTag.fen);
      setGame(newGame);
      setFen(activeTag.fen);
      setHighlights(activeTag.highlight || '');
      if (activeTag.lookingOnWhite !== undefined) {
        setLookingOnWhite(activeTag.lookingOnWhite);
      }
    } catch (error) {
      console.error('Invalid FEN from preview:', error);
    }
  }, [appMode, previewCurrentTime, previewPositions, setFen, setHighlights, setLookingOnWhite]);

  const handlePreviewPlay = useCallback(() => setPreviewIsPlaying(true), []);
  const handlePreviewPause = useCallback(() => setPreviewIsPlaying(false), []);
  const handlePreviewSeek = useCallback((time: number) => setPreviewCurrentTime(time), []);
  const handlePreviewTimeUpdate = useCallback((time: number) => setPreviewCurrentTime(time), []);

  const findPreviousFen = useCallback(() => {
    if (previewIsPlaying) setPreviewIsPlaying(false);
    if (previewPositions.length === 0) {
      handlePreviewSeek(Math.max(0, previewCurrentTime - 10));
      return;
    }
    const currentTimeMs = previewCurrentTime * 1000;
    let activeIndex = -1;
    for (let index = previewPositions.length - 1; index >= 0; index -= 1) {
      if (previewPositions[index].timestamp <= currentTimeMs) {
        activeIndex = index;
        break;
      }
    }
    handlePreviewSeek(activeIndex <= 0 ? 0 : previewPositions[activeIndex - 1].timestamp / 1000);
  }, [previewIsPlaying, previewPositions, previewCurrentTime, handlePreviewSeek]);

  const findNextFen = useCallback(() => {
    if (previewIsPlaying) setPreviewIsPlaying(false);
    if (previewPositions.length === 0) return;
    const currentTimeMs = previewCurrentTime * 1000;
    let activeIndex = -1;
    for (let index = previewPositions.length - 1; index >= 0; index -= 1) {
      if (previewPositions[index].timestamp <= currentTimeMs) {
        activeIndex = index;
        break;
      }
    }
    if (activeIndex + 1 < previewPositions.length) {
      handlePreviewSeek(previewPositions[activeIndex + 1].timestamp / 1000);
    } else {
      handlePreviewSeek(previewDuration || 0);
    }
  }, [previewIsPlaying, previewPositions, previewCurrentTime, previewDuration, handlePreviewSeek]);

  const isFullscreenActive = useCallback(
    () => getFullscreenElement() === fullscreenRef.current,
    []
  );

  const handleFullscreen = useCallback(() => {
    if (!fullscreenRef.current) return;
    if (isFullscreenActive()) {
      exitDocumentFullscreen();
      return;
    }
    setIsFullscreen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (fullscreenRef.current) requestElementFullscreen(fullscreenRef.current);
      });
    });
  }, [isFullscreenActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = isFullscreenActive();
      setIsFullscreen(active);
      if (active && appMode === 'preview') {
        setShowFullscreenControls(true);
      }
    };

    setIsFullscreen(isFullscreenActive());
    return subscribeToFullscreenChanges(handleFullscreenChange);
  }, [appMode, isFullscreenActive]);

  useLayoutEffect(() => {
    if (!isFullscreen || appMode !== 'preview' || !fullscreenControlsRef.current) {
      setVideoPlayerHeight(0);
      return;
    }
    const element = fullscreenControlsRef.current;
    const measure = () => setVideoPlayerHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isFullscreen, appMode]);

  useLayoutEffect(() => {
    if (isFullscreen || appMode !== 'recording' || !boardColumnRef.current) {
      setBoardColumnHeight(0);
      return;
    }
    const element = boardColumnRef.current;
    const measure = () => setBoardColumnHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isFullscreen, appMode]);

  useEffect(() => {
    if (!isFullscreen) return;
    const calculateScale = () => {
      const boardBaseSize = 450;
      const availableWidth =
        appMode === 'recording' ? (window.innerWidth - 384) * 0.95 : window.innerWidth * 0.95;
      const availableHeight =
        appMode === 'recording'
          ? window.innerHeight * 0.95
          : (window.innerHeight - (showFullscreenControls ? videoPlayerHeight : 0)) * 0.95;
      const scale = Math.min(availableWidth / boardBaseSize, availableHeight / boardBaseSize);
      setBoardScale(Math.max(0.5, Math.min(scale, 3)));
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [isFullscreen, appMode, showFullscreenControls, videoPlayerHeight]);

  const previewProps = {
    previewAudioUrl,
    previewDuration,
    previewCurrentTime,
    previewIsPlaying,
    isFullscreen,
    videoPlayerTexts,
    skipBackwardTooltip: t('videoRecorderPage.videoPlayerSkipBackward'),
    skipForwardTooltip: t('videoRecorderPage.videoPlayerSkipForward'),
    onPlay: handlePreviewPlay,
    onPause: handlePreviewPause,
    onSeek: handlePreviewSeek,
    onTimeUpdate: handlePreviewTimeUpdate,
    onSkipBackward: findPreviousFen,
    onSkipForward: findNextFen,
    onFullscreen: handleFullscreen,
  };

  const sessionState: RecorderSessionState = {
    fen,
    pgn,
    pgnSelection,
    recordedZipBlob,
    boardColumnHeight,
    isWebMSupported,
    showUciButton: isTauri(),
    uciEngineReady,
    loadUciPending,
    analysisLoading,
    analysisMode,
    analysisConnectionReady,
    recordingState,
    elapsedTime,
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col surface">
      <motion.div
        className={`flex gap-4 p-4 ${!isFullscreen ? 'flex-1 min-h-0 items-start justify-center' : 'flex-1 min-h-0'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`flex gap-0 rounded-xl overflow-hidden surface-container ${isFullscreen ? 'flex-1 min-h-0' : appMode === 'recording' ? 'flex-1 min-w-0' : 'flex-shrink-0 w-fit max-w-full'}`}
        >
          <div className={`flex gap-4 p-4 ${isFullscreen || appMode === 'recording' ? 'flex-1 min-h-0 min-w-0' : ''}`}>
            {appMode === 'recording' && !isFullscreen && (
              <RecorderHighlightPanel
                layout="sidebar"
                boardMode={boardMode}
                clearHighlightsOnMove={clearHighlightsOnMove}
                colorNames={texts.colorNames}
                colorValues={texts.colorValues}
                onHighlightClick={handleHighlightClick}
                onClearHighlightsOnMoveChange={setClearHighlightsOnMove}
                onRemoveAllHighlights={handleRemoveAllHighlights}
                clearHighlightsLabel={t('videoRecorderPage.clearHighlightsOnMove')}
                removeAllLabel={t('videoRecorderPage.removeAllButton')}
              />
            )}

            <RecorderBoardColumn
              mode={mode}
              boardColumnRef={boardColumnRef}
              replayMovesRef={replayMovesRef}
              controls={{
                handleNewGame,
                handleFullscreen,
                handleReplayAction,
                setLookingOnWhite,
                setIsCopyPopupOpen,
              }}
              preview={previewProps}
              rotateBoardLabel={t('videoRecorderPage.rotateBoard')}
              newGameLabel={t('videoRecorderPage.newGameButton')}
              copyButtonLabel={
                fenCopiedFeedback
                  ? t('videoRecorderPage.copyDiagramJsonCopied')
                  : t('videoRecorderPage.copyDiagramJsonButton')
              }
              fen={fen}
              highlights={highlights}
              lookingOnWhite={lookingOnWhite}
              boardMode={boardMode}
              appMode={appMode}
              isFullscreen={isFullscreen}
              handleMove={handleMove}
              handleSquareClick={handleSquareClick}
            />

            {appMode === 'recording' && !isFullscreen && (
              <RecorderSidebar
                mode={mode}
                layout="normal"
                state={sessionState}
                texts={texts}
                actions={{
                  handleLoadUci,
                  handlePositionChange,
                  handlePgnLoad,
                  setPgnSelection,
                  handleStartRecording,
                  handlePauseRecording,
                  handleResumeRecording,
                  handleStopRecording,
                }}
                analysisOutputRef={analysisOutputRef}
                pgnViewerRef={pgnViewerRef}
                forwardSelectButtonRef={forwardSelectButtonRef}
                recordingTitle={t('videoRecorderPage.recordingTitle')}
                analysisButtonLabel={t('videoRecorderPage.analysisButton')}
                contextButtonLabel={t('videoRecorderPage.contextButton')}
                analysisOffButtonLabel={t('videoRecorderPage.analysisOffButton')}
                loadUciLabel={t('videoRecorderPage.loadUciButton')}
                replaceUciLabel={t('videoRecorderPage.replaceUciButton')}
                recordButtonLabel={t('videoRecorderPage.recordButton')}
                pauseButtonLabel={t('videoRecorderPage.pauseButton')}
                resumeButtonLabel={t('videoRecorderPage.resumeButton')}
                stopButtonLabel={t('videoRecorderPage.stopButton')}
                recordingStatusLabel={t('videoRecorderPage.recordingStatus')}
                pausedStatusLabel={t('videoRecorderPage.pausedStatus')}
                idleStatusLabel={t('videoRecorderPage.idleStatus')}
                unsupportedBrowserLabel={t('videoRecorderPage.unsupportedBrowser')}
                webmNotSupportedLabel={t('videoRecorderPage.webmNotSupported')}
              />
            )}
          </div>
        </div>
      </motion.div>

      <div
        ref={fullscreenRef}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          background: 'var(--overlay)',
          visibility: isFullscreen ? 'visible' : 'hidden',
          pointerEvents: isFullscreen ? 'auto' : 'none',
          opacity: isFullscreen ? 1 : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isFullscreen && appMode === 'preview' && (
          <>
            <div
              className="flex-1 flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out"
              style={{
                paddingBottom: showFullscreenControls ? `${videoPlayerHeight}px` : '0px',
                cursor: !showFullscreenControls ? 'none' : 'default',
              }}
            >
              <div className="flex items-center justify-center w-full h-full">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '450px',
                    height: '450px',
                    transform: `scale(${boardScale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <ThemeProvider mode={mode}>
                    <ChessBoard
                      fen={fen}
                      highlights={highlights}
                      lookingOnWhite={lookingOnWhite}
                      disabled={true}
                      allowInput={false}
                    />
                  </ThemeProvider>
                </div>
              </div>
            </div>

            {previewAudioUrl && (
              <div
                ref={fullscreenControlsRef}
                className="absolute bottom-0 left-0 right-0 w-full pb-4 px-4 transition-opacity duration-300 surface-container-high"
                style={{
                  opacity: showFullscreenControls ? 1 : 0,
                  pointerEvents: showFullscreenControls ? 'auto' : 'none',
                }}
              >
                <RecorderPreviewPlayer {...previewProps} />
              </div>
            )}

            {showDownloadSuccessToast && (
              <DownloadSuccessToast
                isVisible={showDownloadSuccessToast}
                type="video"
                onDismiss={() => setShowDownloadSuccessToast(false)}
              />
            )}
          </>
        )}

        {isFullscreen && appMode === 'recording' && (
          <div className="flex-1 flex min-h-0 w-full">
            <div className="flex items-center justify-center flex-1 min-w-0 pl-4" style={{ paddingRight: 0 }}>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '450px',
                    height: '450px',
                    transform: `scale(${boardScale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <ThemeProvider mode={mode}>
                    <ChessBoard
                      fen={fen}
                      highlights={highlights}
                      lookingOnWhite={lookingOnWhite}
                      onMove={boardMode === 'play' ? handleMove : undefined}
                      onSquareClick={handleSquareClick}
                      disabled={false}
                      allowInput={boardMode === 'play'}
                    />
                  </ThemeProvider>
                </div>
              </div>
            </div>

            <div className="w-96 flex-shrink-0 flex flex-col gap-3 overflow-y-auto surface-container-high p-4">
              <RecorderHighlightPanel
                layout="fullscreen"
                boardMode={boardMode}
                clearHighlightsOnMove={clearHighlightsOnMove}
                colorNames={texts.colorNames}
                colorValues={texts.colorValues}
                onHighlightClick={handleHighlightClick}
                onClearHighlightsOnMoveChange={setClearHighlightsOnMove}
                onRemoveAllHighlights={handleRemoveAllHighlights}
                clearHighlightsLabel={t('videoRecorderPage.clearHighlightsOnMove')}
                removeAllLabel={t('videoRecorderPage.removeAllButton')}
              />

              <RecorderSidebar
                mode={mode}
                layout="fullscreen"
                state={sessionState}
                texts={texts}
                actions={{
                  handleLoadUci,
                  handlePositionChange,
                  handlePgnLoad,
                  setPgnSelection,
                  handleStartRecording,
                  handlePauseRecording,
                  handleResumeRecording,
                  handleStopRecording,
                }}
                analysisOutputRef={analysisOutputRef}
                pgnViewerRef={pgnViewerRef}
                forwardSelectButtonRef={forwardSelectButtonRef}
                recordingTitle={t('videoRecorderPage.recordingTitle')}
                analysisButtonLabel={t('videoRecorderPage.analysisButton')}
                contextButtonLabel={t('videoRecorderPage.contextButton')}
                analysisOffButtonLabel={t('videoRecorderPage.analysisOffButton')}
                loadUciLabel={t('videoRecorderPage.loadUciButton')}
                replaceUciLabel={t('videoRecorderPage.replaceUciButton')}
                recordButtonLabel={t('videoRecorderPage.recordButton')}
                pauseButtonLabel={t('videoRecorderPage.pauseButton')}
                resumeButtonLabel={t('videoRecorderPage.resumeButton')}
                stopButtonLabel={t('videoRecorderPage.stopButton')}
                recordingStatusLabel={t('videoRecorderPage.recordingStatus')}
                pausedStatusLabel={t('videoRecorderPage.pausedStatus')}
                idleStatusLabel={t('videoRecorderPage.idleStatus')}
                unsupportedBrowserLabel={t('videoRecorderPage.unsupportedBrowser')}
                webmNotSupportedLabel={t('videoRecorderPage.webmNotSupported')}
              />

              <div className="flex-shrink-0 flex flex-col gap-2 rounded-xl p-3 surface-container-highest">
                <div className="flex items-center gap-1 w-full">
                  <motion.button
                    type="button"
                    onClick={() => setLookingOnWhite((prev) => !prev)}
                    className="btn-icon flex-shrink-0"
                    title={t('videoRecorderPage.rotateBoard')}
                    aria-label={t('videoRecorderPage.rotateBoard')}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="w-4 h-4" strokeWidth={2} />
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <RecorderBoardActions replayMovesRef={replayMovesRef} onReplayAction={handleReplayAction} />
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleFullscreen}
                    className="btn-icon flex-shrink-0"
                    title={t('videoRecorderPage.videoPlayerExitFullscreen')}
                    aria-label={t('videoRecorderPage.videoPlayerExitFullscreen')}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  </motion.button>
                </div>

                <motion.button
                  onClick={handleNewGame}
                  className="btn-tonal w-full"
                  whileTap={{ scale: 0.99 }}
                >
                  {t('videoRecorderPage.newGameButton')}
                </motion.button>

                <motion.button
                  onClick={() => setIsCopyPopupOpen(true)}
                  className="btn-tonal w-full"
                  whileTap={{ scale: 0.99 }}
                >
                  {fenCopiedFeedback
                    ? t('videoRecorderPage.copyDiagramJsonCopied')
                    : t('videoRecorderPage.copyDiagramJsonButton')}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDownloadSuccessToast && !isFullscreen && (
        <DownloadSuccessToast
          isVisible={showDownloadSuccessToast}
          type="video"
          onDismiss={() => setShowDownloadSuccessToast(false)}
        />
      )}

      <RecorderCopyPopup
        isCopyPopupOpen={isCopyPopupOpen}
        onClose={() => setIsCopyPopupOpen(false)}
        onCopyDiagramJson={handleCopyDiagramJson}
        onCopyPlayEngineJson={handleCopyPlayEngineJson}
        onCopyFenOnly={handleCopyFenOnly}
        diagramJsonLabel={t('videoRecorderPage.copyPopupDiagramJson')}
        playAsWhiteLabel={t('videoRecorderPage.copyPopupPlayAsWhiteJson')}
        playAsBlackLabel={t('videoRecorderPage.copyPopupPlayAsBlackJson')}
        fenOnlyLabel={t('videoRecorderPage.copyPopupFenOnly')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}

function RecorderBoardActions({
  replayMovesRef,
  onReplayAction,
}: {
  replayMovesRef: RefObject<ReplayMovesRef | null>;
  onReplayAction: (action: ReplayMovesAction) => void;
}) {
  return <ReplayMoves ref={replayMovesRef as RefObject<ReplayMovesRef>} onAction={onReplayAction} compact />;
}
