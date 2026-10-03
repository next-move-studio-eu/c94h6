import DownloadSuccessToast from '../DownloadSuccessToast';
import type { SlideshowRecorderFullscreenProps } from './types';

export default function SlideshowRecorderFullscreen({
  fullscreenRef,
  fullscreenControlsRef,
  isFullscreen,
  showFullscreenControls,
  videoPlayerHeight,
  displayImage,
  previewPlayer,
  showDownloadSuccessToast,
  onDismissDownloadToast,
  noImageLabel,
  imageAlt,
}: SlideshowRecorderFullscreenProps) {
  return (
    <div
      ref={fullscreenRef}
      className="fixed inset-0 z-50 overflow-hidden flex flex-col surface"
      style={{
        visibility: isFullscreen ? 'visible' : 'hidden',
        pointerEvents: isFullscreen ? 'auto' : 'none',
        opacity: isFullscreen ? 1 : 0,
      }}
    >
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{
          width: '100vw',
          height:
            showFullscreenControls && videoPlayerHeight > 0
              ? `calc(100vh - ${videoPlayerHeight}px)`
              : '100vh',
          cursor: !showFullscreenControls ? 'none' : 'default',
        }}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage.preview}
              alt=""
              className="absolute inset-0 w-full h-full scale-110 blur-[40px] opacity-60 object-cover"
              aria-hidden="true"
            />
            <img
              src={displayImage.preview}
              alt={imageAlt(displayImage.number)}
              className="relative max-w-full max-h-full w-auto h-auto object-contain"
            />
          </>
        ) : (
          <div className="text-on-surface-variant">{noImageLabel}</div>
        )}
      </div>

      <div
        ref={fullscreenControlsRef}
        className="absolute bottom-0 left-0 right-0 w-full pb-4 px-4 transition-opacity duration-300 surface-container-high"
        style={{
          opacity: showFullscreenControls ? 1 : 0,
          pointerEvents: showFullscreenControls ? 'auto' : 'none',
        }}
      >
        {previewPlayer}
      </div>

      {showDownloadSuccessToast ? (
        <DownloadSuccessToast
          isVisible={showDownloadSuccessToast}
          type="slideshow"
          onDismiss={onDismissDownloadToast}
        />
      ) : null}
    </div>
  );
}
