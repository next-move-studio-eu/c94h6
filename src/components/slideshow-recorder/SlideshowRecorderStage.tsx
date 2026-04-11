import type { SlideshowRecorderStageProps } from './types';

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
    <div ref={stageRef} className="flex flex-col flex-shrink-0 gap-4 pt-0 items-center w-fit">
      <div
        className="relative rounded-2xl pt-3 px-4 pb-4 transition-colors duration-150"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        {title ? (
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
            {title}
          </h3>
        ) : null}
        <div
          className="flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0 w-[560px] aspect-video"
          style={{ backgroundColor: 'var(--surfaceHigh)' }}
        >
          {displayImage ? (
            <img
              src={displayImage.preview}
              alt={imageAlt(displayImage.number)}
              className="w-full h-full object-contain"
            />
          ) : (
            <span style={{ color: 'var(--textDisabled)' }}>{noImageLabel}</span>
          )}
        </div>
        {appMode === 'recording' && selectedImageNumber ? (
          <div className="text-sm text-text text-center mt-2">
            {selectedImageLabel(selectedImageNumber)}
          </div>
        ) : null}
      </div>
      {appMode === 'preview' && previewAudioUrl ? previewPlayer : null}
    </div>
  );
}
