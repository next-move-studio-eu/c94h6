import type { Ref } from 'react';
import type { VideoPlayerTexts } from '../../VideoPlayer';

export interface SlideshowProps {
  slideshowIdentifier: string;
  title?: string;
}

export interface ImageTimestamp {
  timestamp: number;
  image: number;
}

export type SlideshowControlsVariant = 'inline' | 'fullscreen';

export interface SlideshowControlsProps {
  variant: SlideshowControlsVariant;
  controlsRef?: Ref<HTMLDivElement>;
  showFullscreenControls: boolean;
  audioUrl: string;
  durationSeconds: number;
  isPlaying: boolean;
  currentTime: number;
  isFullscreen: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handleSeek: (time: number) => void;
  handleTimeUpdate: (time: number) => void;
  findPreviousTimestamp: () => void;
  findNextTimestamp: () => void;
  handleFullscreen: () => void;
  texts: NonNullable<VideoPlayerTexts> & {
    enterFullscreen: string;
    exitFullscreen: string;
    skipBackward: string;
    skipForward: string;
  };
}

export interface SlideshowViewProps {
  fullscreenControlsRef: Ref<HTMLDivElement>;
  loadError: string | null;
  audioUrl: string | null;
  isLoading: boolean;
  currentImageUrl: string | null;
  showFullscreenControls: boolean;
  fullscreenControlsHeight: number;
  controlsPropsBase: Omit<SlideshowControlsProps, 'variant' | 'controlsRef' | 'showFullscreenControls'>;
}
