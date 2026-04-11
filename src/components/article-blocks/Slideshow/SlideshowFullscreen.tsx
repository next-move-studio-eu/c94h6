import { Film } from 'lucide-react';
import SlideshowControls from './SlideshowControls';
import type { SlideshowViewProps } from './types';

export default function SlideshowFullscreen({
  fullscreenControlsRef,
  loadError,
  audioUrl,
  isLoading,
  currentImageUrl,
  showFullscreenControls,
  fullscreenControlsHeight,
  controlsPropsBase,
}: SlideshowViewProps) {
  return (
    <div
      className={`relative w-full h-[100vh] min-h-0 ${!showFullscreenControls ? 'cursor-none' : 'cursor-default'}`}
      style={{ height: '100vh', backgroundColor: `var(--bg)` }}
    >
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center overflow-hidden"
        style={{ bottom: showFullscreenControls ? fullscreenControlsHeight : 0 }}
      >
        {currentImageUrl && !loadError && (
          <img
            src={currentImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', transform: 'scale(1.1)', filter: 'blur(40px)', opacity: 0.6 }}
            aria-hidden
          />
        )}
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
        {currentImageUrl && !loadError && (
          <img
            src={currentImageUrl}
            alt=""
            className="relative w-full h-full object-contain max-w-full max-h-full"
          />
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
        <SlideshowControls
          variant="fullscreen"
          controlsRef={fullscreenControlsRef}
          showFullscreenControls={showFullscreenControls}
          {...controlsPropsBase}
          audioUrl={audioUrl}
        />
      )}
    </div>
  );
}
