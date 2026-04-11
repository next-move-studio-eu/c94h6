import VideoPlayer from '../../components/VideoPlayer';
import type { RecorderPreviewProps } from './types';

export default function RecorderPreviewPlayer({
  previewAudioUrl,
  previewDuration,
  previewCurrentTime,
  previewIsPlaying,
  isFullscreen,
  videoPlayerTexts,
  skipBackwardTooltip,
  skipForwardTooltip,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
  onSkipBackward,
  onSkipForward,
  onFullscreen,
}: RecorderPreviewProps) {
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
      hideStatus={true}
      hideInfoButton
      texts={videoPlayerTexts}
    />
  );
}
