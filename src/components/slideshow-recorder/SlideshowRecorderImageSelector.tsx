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
      className="flex-shrink-0 w-80 flex flex-col min-h-0 self-stretch rounded-xl p-3 surface-container"
      style={previewColumnHeight ? { maxHeight: previewColumnHeight } : undefined}
    >
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
        <span className="w-1 h-5 rounded-full bg-primary" />
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
          buttonClassName="btn-tonal"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 scrollbar-theme">
        {images.map((image) => (
          <motion.button
            key={image.number}
            onClick={() => onSelectImage(image.number)}
            className={`focus-ring w-full p-2 rounded-xl ${
              selectedImageNumber === image.number
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-highest'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={image.preview}
              alt={imageAlt(image.number)}
              className="w-full h-24 object-cover rounded-lg mb-1"
            />
            <div className="text-xs text-center">{image.number}.avif</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
