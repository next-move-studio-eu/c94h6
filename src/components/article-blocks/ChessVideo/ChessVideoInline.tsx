import { Film } from 'lucide-react';
import VideoPlayer from '../../VideoPlayer';
import ChessBoard from '../../ChessBoard';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import type { ChessVideoViewProps } from './types';

export default function ChessVideoInline({
  mode,
  loadError,
  audioUrl,
  isLoading,
  currentFen,
  currentHighlights,
  currentLookingOnWhite,
  isPlaying,
  currentTime,
  durationSeconds,
  isFullscreen,
  handleMove,
  handleSquareClick,
  handlePlay,
  handlePause,
  handleSeek,
  handleTimeUpdate,
  findPreviousFen,
  findNextFen,
  handleFullscreen,
  videoPlayerTexts,
}: ChessVideoViewProps) {
  return (
    <div className="pt-4 flex flex-col items-center gap-2">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg flex items-center justify-center aspect-square">
        {loadError && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm p-4"
            style={{
              backgroundColor: `var(--errorSubtle)`,
              color: `var(--error)`,
            }}
          >
            {loadError}
          </div>
        )}
        {!audioUrl && !loadError && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `var(--surfaceHigh)` }}
          >
            <Film
              className="w-12 h-12 opacity-30"
              style={{ color: `var(--textSecondary)` }}
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
        )}
        {audioUrl && !loadError && (
          <div className="w-full h-full flex items-center justify-center min-w-0 min-h-0 relative">
            <div className="h-full max-w-full aspect-square min-w-0 min-h-0">
              <ThemeProvider mode={mode}>
                <ChessBoard
                  fen={currentFen}
                  highlights={currentHighlights}
                  lookingOnWhite={currentLookingOnWhite}
                  disabled={isPlaying}
                  allowInput={!isPlaying}
                  onMove={handleMove}
                  onSquareClick={handleSquareClick}
                />
              </ThemeProvider>
            </div>
          </div>
        )}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `var(--surface)` }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: `var(--primaryBorder)`,
                borderTopColor: `var(--primary)`,
              }}
              aria-hidden
            />
          </div>
        )}
      </div>
      {audioUrl && !loadError && (
        <div className="w-full">
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
            onSkipBackward={findPreviousFen}
            onSkipForward={findNextFen}
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            hideStatus
            texts={videoPlayerTexts}
          />
        </div>
      )}
    </div>
  );
}
