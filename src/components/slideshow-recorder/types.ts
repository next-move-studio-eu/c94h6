import type { ChangeEvent, ReactNode, RefObject } from 'react';
import type { ImageTimestamp, SlideshowImage } from '../../types/slideshow';

export type RecordingState = 'idle' | 'recording' | 'paused';
export type AppMode = 'recording' | 'preview';

export interface SlideshowPreviewTexts {
  info: string;
  skipBackward: string;
  skipForward: string;
  enterFullscreen: string;
  exitFullscreen: string;
  status: {
    playing: string;
    paused: string;
    analyzing: string;
  };
}

export interface SlideshowPreviewPlayerProps {
  previewAudioUrl: string | null;
  previewDuration: number;
  previewCurrentTime: number;
  previewIsPlaying: boolean;
  isFullscreen: boolean;
  texts: SlideshowPreviewTexts;
  skipBackwardTooltip: string;
  skipForwardTooltip: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onFullscreen: () => void;
  hideStatus?: boolean;
}

export interface SlideshowRecorderImageSelectorProps {
  images: SlideshowImage[];
  selectedImageNumber: number | null;
  previewColumnHeight: number;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectImage: (imageNumber: number) => void;
  title: string;
  selectFilesLabel: string;
  filePickerButtonText: string;
  imageAlt: (number: number) => string;
}

export interface SlideshowRecorderStageProps {
  displayImage: SlideshowImage | null;
  appMode: AppMode;
  selectedImageNumber: number | null;
  previewAudioUrl: string | null;
  previewPlayer: ReactNode;
  title?: string;
  noImageLabel: string;
  selectedImageLabel: (number: number) => string;
  imageAlt: (number: number) => string;
  stageRef?: RefObject<HTMLDivElement>;
}

export interface SlideshowRecorderControlsProps {
  recordingState: RecordingState;
  elapsedTime: number;
  isWebMSupported: boolean;
  previewColumnHeight: number;
  onStartRecording: () => void | Promise<void>;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void | Promise<void>;
  recordingTitle: string;
  recordButtonLabel: string;
  pauseButtonLabel: string;
  resumeButtonLabel: string;
  stopButtonLabel: string;
  recordingStatusLabel: string;
  pausedStatusLabel: string;
  idleStatusLabel: string;
  unsupportedBrowserLabel: string;
  webmNotSupportedLabel: string;
  webmNotSupportedTitle: string;
}

export interface SlideshowRecorderFullscreenProps {
  fullscreenRef: RefObject<HTMLDivElement>;
  fullscreenControlsRef: RefObject<HTMLDivElement>;
  isFullscreen: boolean;
  showFullscreenControls: boolean;
  videoPlayerHeight: number;
  displayImage: SlideshowImage | null;
  previewPlayer: React.ReactNode;
  showDownloadSuccessToast: boolean;
  onDismissDownloadToast: () => void;
  noImageLabel: string;
  imageAlt: (number: number) => string;
}

export type SlideshowTimestampNavigation = {
  previewTimestamps: ImageTimestamp[];
  previewCurrentTime: number;
  previewDuration: number;
  previewIsPlaying: boolean;
  onPausePreview: () => void;
  onSeekPreview: (time: number) => void;
};
