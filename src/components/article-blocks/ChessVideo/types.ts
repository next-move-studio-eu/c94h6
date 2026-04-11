import type { Ref } from 'react';
import type { ThemeMode } from '../../../config/colors';
import type { VideoPlayerTexts } from '../../VideoPlayer';

export interface ChessVideoProps {
  videoIdentifier: string;
  title?: string;
}

export interface ChessVideoViewProps {
  mode: ThemeMode;
  fullscreenControlsRef: Ref<HTMLDivElement>;
  loadError: string | null;
  audioUrl: string | null;
  isLoading: boolean;
  currentFen: string;
  currentHighlights: string;
  currentLookingOnWhite: boolean;
  isPlaying: boolean;
  currentTime: number;
  handleMove: (move: { from: string; to: string; promotion?: string }) => void;
  handleSquareClick: (square: string) => void;
  boardScale: number;
  showFullscreenControls: boolean;
  fullscreenControlsHeight: number;
  durationSeconds: number;
  isFullscreen: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handleSeek: (time: number) => void;
  handleTimeUpdate: (time: number) => void;
  findPreviousFen: () => void;
  findNextFen: () => void;
  handleFullscreen: () => void;
  videoPlayerTexts: NonNullable<VideoPlayerTexts> & {
    enterFullscreen: string;
    exitFullscreen: string;
    skipBackward: string;
    skipForward: string;
  };
}
