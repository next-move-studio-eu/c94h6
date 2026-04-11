import VideoPlayer from '../../VideoPlayer';
import type { SlideshowControlsProps } from './types';

export default function SlideshowControls({
  variant,
  controlsRef,
  showFullscreenControls,
  audioUrl,
  durationSeconds,
  isPlaying,
  currentTime,
  isFullscreen,
  handlePlay,
  handlePause,
  handleSeek,
  handleTimeUpdate,
  findPreviousTimestamp,
  findNextTimestamp,
  handleFullscreen,
  texts,
}: SlideshowControlsProps) {
  const player = (
    <VideoPlayer
      hideInfoButton
      audioUrl={audioUrl}
      duration={durationSeconds}
      isPlaying={isPlaying}
      currentTime={currentTime}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeek={handleSeek}
      onTimeUpdate={handleTimeUpdate}
      onSkipBackward={findPreviousTimestamp}
      onSkipForward={findNextTimestamp}
      onFullscreen={handleFullscreen}
      isFullscreen={isFullscreen}
      hideStatus
      texts={texts}
    />
  );

  if (variant === 'inline') {
    return player;
  }

  return (
    <div
      ref={controlsRef}
      className={`absolute bottom-0 left-0 right-0 w-full transition-opacity duration-300 ${
        showFullscreenControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {player}
    </div>
  );
}
