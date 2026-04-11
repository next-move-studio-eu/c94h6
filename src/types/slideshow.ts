export interface ImageTimestamp {
  timestamp: number; // Time in milliseconds from recording start
  image: number; // Image number (1, 2, 3, etc.)
}

export interface SlideshowImage {
  number: number; // Image number (1, 2, 3, etc.)
  file: File;
  preview: string; // Object URL for preview
}
