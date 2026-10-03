import type { SlideshowRecorderStageProps } from './types';

/**
 * Selected-image preview. Uses explicit pixel sizes so nested flex cannot collapse it to 0×0.
 */
export default function SlideshowRecorderStage({
  displayImage,
  appMode,
  selectedImageNumber,
  previewAudioUrl,
  previewPlayer,
  title,
  noImageLabel,
  selectedImageLabel,
  imageAlt,
  stageRef,
}: SlideshowRecorderStageProps) {
  return (
    <div
      ref={stageRef}
      className="flex flex-col gap-3 min-h-0 self-stretch"
      style={{ flex: '1 1 0%', minWidth: 320 }}
    >
      {title ? (
        <h3 className="text-lg font-semibold mb-0 flex items-center gap-2 flex-shrink-0">
          <span className="w-1 h-5 rounded-full bg-primary" />
          {title}
        </h3>
      ) : null}

      <div
        className="surface-container-highest rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          width: '100%',
          flex: '1 1 0%',
          minHeight: 360,
        }}
      >
        {displayImage ? (
          <img
            src={displayImage.preview}
            alt={imageAlt(displayImage.number)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <span className="text-on-surface-variant">{noImageLabel}</span>
        )}
      </div>

      {appMode === 'recording' && selectedImageNumber ? (
        <div className="text-sm text-text text-center flex-shrink-0">
          {selectedImageLabel(selectedImageNumber)}
        </div>
      ) : null}

      {appMode === 'preview' && previewAudioUrl ? previewPlayer : null}
    </div>
  );
}
