import { motion } from 'framer-motion';
import FilePicker from '../FilePicker';
import type { SlideshowRecorderImageSelectorProps } from './types';

export default function SlideshowRecorderImageSelector({
  images,
  selectedImageNumber,
  previewColumnHeight,
  onImageUpload,
  onSelectImage,
  title,
  selectFilesLabel,
  filePickerButtonText,
  imageAlt,
}: SlideshowRecorderImageSelectorProps) {
  return (
    <div
      className="flex-shrink-0 w-80 flex flex-col min-h-0 self-stretch rounded-lg p-3"
      style={{
        backgroundColor: 'var(--bg)',
        ...(previewColumnHeight ? { maxHeight: previewColumnHeight } : {}),
      }}
    >
      <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2 flex-shrink-0">
        <span className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
        {title}
      </h3>
      <label className="block text-sm font-medium text-text mb-2 flex-shrink-0">
        {selectFilesLabel}
      </label>
      <div className="mb-3 flex-shrink-0">
        <FilePicker
          accept=".avif,image/avif"
          multiple
          onChange={onImageUpload}
          buttonText={filePickerButtonText}
          buttonClassName="block text-sm py-2 px-4 rounded-lg border-2 border-[var(--primary)] text-text bg-transparent font-semibold transition-colors duration-150"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 scrollbar-theme">
        {images.map((image) => (
          <motion.button
            key={image.number}
            onClick={() => onSelectImage(image.number)}
            className="w-full p-2 rounded-xl border-2 transition-colors duration-150"
            style={
              selectedImageNumber === image.number
                ? {
                    borderColor: 'var(--primary)',
                    backgroundColor: 'var(--primarySubtle)',
                    boxShadow: 'var(--shadowSm)',
                  }
                : { borderColor: 'var(--border)', backgroundColor: 'transparent' }
            }
            onMouseEnter={(event) => {
              if (selectedImageNumber !== image.number) {
                (event.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
              }
            }}
            onMouseLeave={(event) => {
              if (selectedImageNumber !== image.number) {
                (event.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={image.preview}
              alt={imageAlt(image.number)}
              className="w-full h-24 object-cover rounded-lg mb-1"
            />
            <div className="text-xs text-text text-center">{image.number}.avif</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
