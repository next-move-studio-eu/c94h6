import type { PhotoArticleViewProps } from './types';

export default function PhotoArticleFullscreen({
  caption,
  imageUrl,
  showFullscreenIcon,
  fullscreenRef,
  onFullscreenToggle,
  t,
}: PhotoArticleViewProps) {
  return (
    <div
      ref={fullscreenRef}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        !showFullscreenIcon ? 'cursor-none' : 'cursor-default'
      }`}
      style={{ backgroundColor: `var(--bg)` }}
    >
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', transform: 'scale(1.1)', filter: 'blur(40px)', opacity: 0.6 }}
            aria-hidden="true"
          />
          <img
            src={imageUrl}
            alt={caption || ''}
            className="relative max-w-full max-h-full w-auto h-auto"
            style={{ objectFit: 'contain' }}
          />
          {showFullscreenIcon && (
            <div
              className="absolute top-4 right-4 z-10 transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onFullscreenToggle();
              }}
            >
              <button
                className="backdrop-blur-sm rounded-lg p-2.5 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.65)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.45)';
                }}
                title={t('videoPlayer.exitFullscreen')}
                aria-label={t('videoPlayer.exitFullscreen')}
              >
                <svg className={`w-6 h-6 text-[var(--onPrimary)]`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
