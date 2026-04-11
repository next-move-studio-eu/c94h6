/**
 * Validate article image assets. No conversion — editor must supply correct format.
 * Thumbnail: AVIF, longest side 640px. Content images: AVIF, width 1920px.
 */

export const THUMBNAIL_LONG_EDGE = 640;
export const CONTENT_IMAGE_WIDTH = 1920;

function isAvifFile(file: File): boolean {
  return file.type === 'image/avif' || file.name.toLowerCase().endsWith('.avif');
}

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

function fileToBlob(file: File): Promise<Blob> {
  return file.arrayBuffer().then((buf) => new Blob([buf], { type: 'image/avif' }));
}

/**
 * Validates thumbnail: AVIF, longest side 640px. Returns file as Blob or throws.
 */
export async function createThumbnailAvif(file: File): Promise<Blob> {
  if (!isAvifFile(file)) {
    throw new Error(
      `Thumbnail must be AVIF. Your file: ${file.name} (${file.type || 'unknown type'}).`
    );
  }
  const { width, height } = await loadImageDimensions(file);
  const max = Math.max(width, height);
  if (max !== THUMBNAIL_LONG_EDGE) {
    throw new Error(
      `Thumbnail must have longest side ${THUMBNAIL_LONG_EDGE}px. Your image: ${width}×${height}.`
    );
  }
  return fileToBlob(file);
}

/**
 * Validates content image: AVIF, width 1920px. Returns file as Blob or throws.
 */
export async function createContentImageAvif(file: File): Promise<Blob> {
  if (!isAvifFile(file)) {
    throw new Error(
      `Content image must be AVIF. Your file: ${file.name} (${file.type || 'unknown type'}).`
    );
  }
  const { width, height } = await loadImageDimensions(file);
  if (width !== CONTENT_IMAGE_WIDTH) {
    throw new Error(
      `Content image must be ${CONTENT_IMAGE_WIDTH}px width. Your image: ${width}×${height}.`
    );
  }
  return fileToBlob(file);
}
