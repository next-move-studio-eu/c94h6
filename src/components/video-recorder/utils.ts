import type { HighlightColor, VideoPlayerTextsConfig } from './types';

export const HIGHLIGHT_COLORS: HighlightColor[] = ['G', 'R', 'Y', 'B', 'O', 'P'];

export function translateSanMove(san: string): string {
  return san.replace(/Q/g, 'D').replace(/R/g, 'V').replace(/B/g, 'S').replace(/N/g, 'J');
}

export function formatRecordingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function buildVideoPlayerTexts(t: (key: string) => string): VideoPlayerTextsConfig {
  return {
    info: t('videoRecorderPage.videoPlayerInfo'),
    skipBackward: t('videoRecorderPage.videoPlayerSkipBackward'),
    skipForward: t('videoRecorderPage.videoPlayerSkipForward'),
    enterFullscreen: t('videoRecorderPage.videoPlayerEnterFullscreen'),
    exitFullscreen: t('videoRecorderPage.videoPlayerExitFullscreen'),
    infoTooltip: t('videoRecorderPage.videoPlayerTooltip'),
  };
}
