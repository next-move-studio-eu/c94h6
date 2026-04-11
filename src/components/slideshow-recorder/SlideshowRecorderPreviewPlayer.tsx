import VideoPlayer from '../VideoPlayer';
import type { SlideshowPreviewPlayerProps } from './types';

export default function SlideshowRecorderPreviewPlayer({
  previewAudioUrl,
  previewDuration,
  previewCurrentTime,
  previewIsPlaying,
  isFullscreen,
  texts,
  skipBackwardTooltip,
  skipForwardTooltip,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
  onSkipBackward,
  onSkipForward,
  onFullscreen,
  hideStatus = false,
}: SlideshowPreviewPlayerProps) {
  if (!previewAudioUrl) {
    return null;
  }

  return (
    <VideoPlayer
      audioUrl={previewAudioUrl}
      duration={previewDuration}
      isPlaying={previewIsPlaying}
      currentTime={previewCurrentTime}
      onPlay={onPlay}
      onPause={onPause}
      onSeek={onSeek}
      onTimeUpdate={onTimeUpdate}
      onSkipBackward={onSkipBackward}
      onSkipForward={onSkipForward}
      onFullscreen={onFullscreen}
      isFullscreen={isFullscreen}
      skipBackwardTooltip={skipBackwardTooltip}
      skipForwardTooltip={skipForwardTooltip}
      hideStatus={hideStatus}
      hideInfoButton
      texts={texts}
    />
  );
}
