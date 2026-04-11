import { Film } from 'lucide-react';
import VideoPlayer from '../../VideoPlayer';
import ChessBoard from '../../ChessBoard';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import type { ChessVideoViewProps } from './types';

export default function ChessVideoFullscreen({
  mode,
  fullscreenControlsRef,
  loadError,
  audioUrl,
  isLoading,
  currentFen,
  currentHighlights,
  currentLookingOnWhite,
  isPlaying,
  currentTime,
  boardScale,
  showFullscreenControls,
  fullscreenControlsHeight,
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
    <div
      className={`relative w-full h-[100vh] min-h-0 ${!showFullscreenControls ? 'cursor-none' : 'cursor-default'}`}
      style={{ height: '100vh', backgroundColor: `var(--bg)` }}
    >
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden"
        style={{ bottom: showFullscreenControls ? fullscreenControlsHeight : 0 }}
      >
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
            <div
              className="flex items-center justify-center"
              style={{
                width: '450px',
                height: '450px',
                transform: `scale(${boardScale})`,
                transformOrigin: 'center center',
              }}
            >
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
        <div
          ref={fullscreenControlsRef}
          className={`absolute bottom-0 left-0 right-0 w-full transition-opacity duration-300 ${
            showFullscreenControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
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
