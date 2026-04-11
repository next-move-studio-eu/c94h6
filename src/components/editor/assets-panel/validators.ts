const ALLOWED_VIDEO_HEIGHTS = [540, 720] as const;

export function validateArticleVideoFile(file: File): Promise<{ blob: Blob; durationSeconds: number }> {
  return new Promise((resolve, reject) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.webm')) {
      reject(new Error('Only .webm is allowed'));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const height = video.videoHeight;
      if (!ALLOWED_VIDEO_HEIGHTS.includes(height as 540 | 720)) {
        reject(new Error(`Height must be 540 or 720 px, got ${height}`));
        return;
      }

      const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;
      resolve({ blob: file, durationSeconds });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid or unsupported video format'));
    };

    video.src = url;
  });
}

export function validateArticleAudioFile(file: File): Promise<{ blob: Blob; durationSeconds: number }> {
  return new Promise((resolve, reject) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.webm')) {
      reject(new Error('Only .webm is allowed'));
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
      audio.src = '';
    };

    const onLoaded = () => {
      cleanup();
      const durationSeconds = Number.isFinite(audio.duration) ? audio.duration : 0;
      resolve({ blob: file, durationSeconds });
    };

    const onError = () => {
      cleanup();
      reject(new Error('Invalid or unsupported audio format'));
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;
  });
}
