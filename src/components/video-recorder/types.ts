import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { PgnViewerSelection, PositionChangeEvent } from '../../components/PgnViewer';
import type { ChessPositionTag } from '../../types/video';

export type RecordingState = 'idle' | 'recording' | 'paused';
export type AppMode = 'recording' | 'preview';
export type BoardMode =
  | 'play'
  | 'arrow-G'
  | 'arrow-R'
  | 'arrow-Y'
  | 'arrow-B'
  | 'arrow-O'
  | 'arrow-P'
  | 'square-G'
  | 'square-R'
  | 'square-Y'
  | 'square-B'
  | 'square-O'
  | 'square-P';
export type HighlightColor = 'G' | 'R' | 'Y' | 'B' | 'O' | 'P';

export interface VideoPlayerTextsConfig {
  info: string;
  skipBackward: string;
  skipForward: string;
  enterFullscreen: string;
  exitFullscreen: string;
  infoTooltip: string;
}

export interface PgnViewerTexts {
  vs: string;
  study: string;
  fenPosition: string;
  game: string;
  selectMove: string;
  main: string;
  comment: string;
  previousGame: string;
  nextGame: string;
  loadPgn: string;
  loadPgnError: string;
  loadPgnNoGames: string;
}

export interface RecorderBoardSharedProps {
  fen: string;
  highlights: string;
  lookingOnWhite: boolean;
  boardMode: BoardMode;
  appMode: AppMode;
  isFullscreen: boolean;
  boardScale?: number;
  handleMove: (move: { from: string; to: string; promotion?: string }) => void;
  handleSquareClick: (square: string) => void;
}

export interface RecorderControlActions {
  handleNewGame: () => void;
  handleFullscreen: () => void;
  handleReplayAction: (action: 'back' | 'forward-main' | 'forward-select') => void;
  setLookingOnWhite: Dispatch<SetStateAction<boolean>>;
  setIsCopyPopupOpen: Dispatch<SetStateAction<boolean>>;
}

export interface RecorderRecordingActions {
  handleStartRecording: () => void | Promise<void>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleStopRecording: () => void | Promise<void>;
}

export interface RecorderPreviewProps {
  previewAudioUrl: string | null;
  previewDuration: number;
  previewCurrentTime: number;
  previewIsPlaying: boolean;
  isFullscreen: boolean;
  videoPlayerTexts: VideoPlayerTextsConfig;
  skipBackwardTooltip: string;
  skipForwardTooltip: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onFullscreen: () => void;
}

export interface RecorderSessionState {
  fen: string;
  pgn: string;
  pgnSelection: PgnViewerSelection | null;
  recordedZipBlob: Blob | null;
  boardColumnHeight: number;
  isWebMSupported: boolean;
  showUciButton: boolean;
  uciEngineReady: boolean;
  loadUciPending: boolean;
  analysisLoading: boolean;
  analysisConnectionReady: boolean;
  recordingState: RecordingState;
  elapsedTime: number;
}

export interface RecorderCopyPopupActions {
  isCopyPopupOpen: boolean;
  onClose: () => void;
  onCopyDiagramJson: () => void | Promise<void>;
  onCopyPlayEngineJson: (playWithWhite: boolean) => void | Promise<void>;
  onCopyFenOnly: () => void | Promise<void>;
}

export interface RecorderFullscreenShellProps extends RecorderBoardSharedProps, RecorderPreviewProps {
  mode: 'light' | 'dark';
  fullscreenRef: RefObject<HTMLDivElement | null>;
  fullscreenControlsRef: RefObject<HTMLDivElement | null>;
  showFullscreenControls: boolean;
  videoPlayerHeight: number;
  appMode: AppMode;
  isFullscreen: boolean;
  boardScale: number;
  showDownloadSuccessToast: boolean;
  onDismissDownloadToast: () => void;
  recordingSidebar: ReactNode;
}

export interface RecorderPageTexts {
  t: TFunction<['videoRecorderPage', 'common'], undefined>;
  colorNames: Record<HighlightColor, string>;
  colorValues: Record<HighlightColor, string>;
  pgnViewerTexts: PgnViewerTexts;
  videoPlayerTexts: VideoPlayerTextsConfig;
}

export interface RecorderPageActions extends RecorderControlActions, RecorderRecordingActions {
  handleHighlightClick: (mode: BoardMode) => void;
  handleRemoveAllHighlights: () => void;
  setClearHighlightsOnMove: Dispatch<SetStateAction<boolean>>;
  handleLoadUci: () => void | Promise<void>;
  handlePositionChange: (event: PositionChangeEvent) => void;
  handlePgnLoad: (loadedPgn: string) => void;
  setPgnSelection: Dispatch<SetStateAction<PgnViewerSelection | null>>;
}

export interface RecorderPreviewState {
  positions: ChessPositionTag[];
  previewCurrentTime: number;
  previewDuration: number;
  previewIsPlaying: boolean;
}
