import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TOAST_DURATION_MS = 5000;

interface DownloadSuccessToastProps {
  isVisible: boolean;
  type: 'video' | 'slideshow' | 'audio';
  onDismiss: () => void;
}

/**
 * Toast shown after recording is saved. Render once in normal layout and once
 * inside the fullscreen overlay so it is visible in both normal and native fullscreen.
 */
export default function DownloadSuccessToast({
  isVisible,
  type,
  onDismiss,
}: DownloadSuccessToastProps) {
  const { t } = useTranslation('appShell');

  useEffect(() => {
    if (!isVisible) return;
    const id = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  const messageKey =
    type === 'video' ? 'downloadSuccessModal.videoDownloaded' : type === 'audio' ? 'downloadSuccessModal.audioDownloaded' : 'downloadSuccessModal.slideshowDownloaded';
  const message = t(messageKey);

  return (
    <div
      className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 pointer-events-none flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 rounded-xl border-2 shadow-lg px-5 py-3 min-w-[280px] max-w-[90vw]"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--primary)',
          boxShadow: 'var(--shadowMd)',
        }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--primarySubtle)' }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--primary)' }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-semibold text-[var(--text)]">
          {message}
        </p>
      </div>
    </div>
  );
}
