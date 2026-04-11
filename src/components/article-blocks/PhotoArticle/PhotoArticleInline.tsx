import type { PhotoArticleViewProps } from './types';

export default function PhotoArticleInline({
  caption,
  imageUrl,
  loading,
  error,
  imageLoaded,
  showFullscreenIcon,
  imageContainerRef,
  onInlineMouseEnter,
  onInlineMouseLeave,
  onFullscreenToggle,
  onImageLoad,
  onImageError,
  t,
}: PhotoArticleViewProps) {
  return (
    <figure className="my-12">
      <div
        ref={imageContainerRef}
        className="relative w-[80%] min-w-0 mx-auto rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          boxShadow: `var(--shadowSm)`,
          aspectRatio: '16/9',
          minHeight: '200px',
        }}
        onMouseEnter={onInlineMouseEnter}
        onMouseLeave={onInlineMouseLeave}
        onClick={onFullscreenToggle}
      >
        {loading && !imageLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `var(--surface)` }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 border-4 rounded-full animate-spin"
                style={{
                  borderColor: `var(--border)`,
                  borderTopColor: `var(--primary)`,
                }}
              />
              <div
                style={{ color: `var(--textSecondary)` }}
                className="text-sm font-medium"
              >
                {t('slideshowPlayer.loadingImage')}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `var(--surface)` }}
          >
            <div className={`text-center px-4 text-[var(--error)]`}>
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt={caption || ''}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={onImageLoad}
            onError={onImageError}
          />
        )}

        {imageUrl && imageLoaded && !error && (
          <div
            className={`absolute top-4 right-4 z-10 transition-all duration-300 ${
              showFullscreenIcon ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
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
              title={t('videoPlayer.enterFullscreen')}
              aria-label={t('videoPlayer.enterFullscreen')}
            >
              <svg className={`w-6 h-6 text-[var(--onPrimary)]`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {caption && (
        <figcaption
          className="mt-4 text-sm text-center px-4 font-medium"
          style={{ color: `var(--textSecondary)` }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
