import type { TFunction } from 'i18next';
import type { SlideshowImage } from '../../types/slideshow';
import type {
  SlideshowPreviewTexts,
  SlideshowTimestampNavigation,
} from './types';

export function formatRecordingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function buildSlideshowPreviewTexts(
  t: TFunction<['slideshowRecorderPage', 'filePicker', 'videoRecorderPage'], undefined>
): SlideshowPreviewTexts {
  return {
    info: t('videoRecorderPage.videoPlayerInfo'),
    skipBackward: t('videoRecorderPage.videoPlayerSkipBackward'),
    skipForward: t('videoRecorderPage.videoPlayerSkipForward'),
    enterFullscreen: t('videoRecorderPage.videoPlayerEnterFullscreen'),
    exitFullscreen: t('videoRecorderPage.videoPlayerExitFullscreen'),
    status: {
      playing: t('videoRecorderPage.videoPlayerPlaying'),
      paused: t('videoRecorderPage.videoPlayerPaused'),
      analyzing: t('videoRecorderPage.videoPlayerAnalyzing'),
    },
  };
}

export function getDisplayImage(
  images: SlideshowImage[],
  appMode: 'recording' | 'preview',
  selectedImageNumber: number | null,
  previewCurrentImage: number | null
): SlideshowImage | null {
  const activeImageNumber = appMode === 'preview' ? previewCurrentImage : selectedImageNumber;
  return images.find((image) => image.number === activeImageNumber) ?? images[0] ?? null;
}

export function findPreviousTimestamp({
  previewTimestamps,
  previewCurrentTime,
  previewIsPlaying,
  onPausePreview,
  onSeekPreview,
}: SlideshowTimestampNavigation) {
  if (previewIsPlaying) {
    onPausePreview();
  }

  if (previewTimestamps.length === 0) {
    onSeekPreview(Math.max(0, previewCurrentTime - 10));
    return;
  }

  const currentTimeMs = previewCurrentTime * 1000;
  let currentIndex = -1;
  for (let index = previewTimestamps.length - 1; index >= 0; index -= 1) {
    if (previewTimestamps[index].timestamp <= currentTimeMs) {
      currentIndex = index;
      break;
    }
  }

  if (currentIndex <= 0) {
    onSeekPreview(0);
    return;
  }

  onSeekPreview(previewTimestamps[currentIndex - 1].timestamp / 1000);
}

export function findNextTimestamp({
  previewTimestamps,
  previewCurrentTime,
  previewDuration,
  previewIsPlaying,
  onPausePreview,
  onSeekPreview,
}: SlideshowTimestampNavigation) {
  if (previewIsPlaying) {
    onPausePreview();
  }

  if (previewTimestamps.length === 0) {
    return;
  }

  const currentTimeMs = previewCurrentTime * 1000;
  let currentIndex = -1;
  for (let index = previewTimestamps.length - 1; index >= 0; index -= 1) {
    if (previewTimestamps[index].timestamp <= currentTimeMs) {
      currentIndex = index;
      break;
    }
  }

  if (currentIndex < previewTimestamps.length - 1) {
    onSeekPreview(previewTimestamps[currentIndex + 1].timestamp / 1000);
  } else {
    onSeekPreview(previewDuration || 0);
  }
}
