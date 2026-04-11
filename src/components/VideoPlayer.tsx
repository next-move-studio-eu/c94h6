import { useState, useRef, useEffect, useCallback } from 'react';
import { getColorWithOpacity } from '../utils/colorUtils';
interface InfoTooltipProps {
  content: string;
  children: React.ReactNode;
}

function InfoTooltip({ content, children }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getSurfaceColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  };

  const getPrimaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  };

  const getTextColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  };

  const getBorderColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-w-[calc(100vw-2rem)] border rounded-lg p-4 shadow-xl z-[100] pointer-events-auto"
          style={{
            backgroundColor: getSurfaceColor(),
            borderColor: getBorderColor(),
            color: getTextColor()
          }}
        >
          <div className="text-sm whitespace-pre-line leading-relaxed">
            {content}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div
              className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent"
              style={{ borderTopColor: getPrimaryColor() }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent"
              style={{ borderTopColor: getSurfaceColor() }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export interface VideoPlayerTexts {
  info?: string;
  skipBackward?: string;
  skipForward?: string;
  enterFullscreen?: string;
  exitFullscreen?: string;
  status?: {
    playing?: string;
    paused?: string;
    analyzing?: string;
  };
  infoTooltip?: string;
}

export interface VideoPlayerProps {
  audioUrl: string;
  duration: number;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  disabled?: boolean;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  infoTooltipText?: string;
  skipBackwardTooltip?: string;
  skipForwardTooltip?: string;
  analysisLoading?: boolean;
  hideStatus?: boolean;
  /** When true, the info (i) tooltip control is not shown (e.g. article preview players). */
  hideInfoButton?: boolean;
  texts?: VideoPlayerTexts;
}

export default function VideoPlayer({
  audioUrl,
  duration,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
  disabled = false,
  onSkipBackward,
  onSkipForward,
  onFullscreen,
  isFullscreen = false,
  infoTooltipText,
  skipBackwardTooltip,
  skipForwardTooltip,
  analysisLoading = false,
  hideStatus = false,
  hideInfoButton = false,
  texts = {}
}: VideoPlayerProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const modeAttr = document.documentElement.getAttribute('data-mode');
    return (modeAttr === 'dark' ? 'dark' : 'light');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const modeAttr = document.documentElement.getAttribute('data-mode');
      setMode(modeAttr === 'dark' ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode']
    });

    return () => observer.disconnect();
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const forceMediaReset = useCallback((targetTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = targetTime;
    setHasEnded(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;

    if (isPlaying) {
      if (hasEnded || audio.ended) {
        setHasEnded(false);
        if (audio.currentTime >= duration - 0.1) {
          audio.currentTime = 0;
        }
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => onPause());
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, hasEnded, duration, onPause, isDragging]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;

    const timeDiff = Math.abs(audio.currentTime - currentTime);
    if (timeDiff > 0.1) {
      if (hasEnded || audio.ended) {
        forceMediaReset(currentTime);
      } else {
        audio.currentTime = currentTime;
      }
    }
  }, [currentTime, isDragging, hasEnded, forceMediaReset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;

    if (isPlaying) {
      if (hasEnded || audio.ended) {
        forceMediaReset(currentTime);
      }
      audio.play().catch(() => onPause());
    } else {
      audio.pause();
    }
  }, [isPlaying, hasEnded, forceMediaReset, onPause, currentTime, isDragging]);

  const handleSeek = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!progressBarRef.current || !audioRef.current || disabled) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = 'clientX' in e ? (e as React.MouseEvent).clientX : (e as MouseEvent).clientX;
    const percentage = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    const newTime = percentage * duration;

    if (hasEnded || audioRef.current.ended) {
      forceMediaReset(newTime);
    } else {
      audioRef.current.currentTime = newTime;
    }

    onSeek(newTime);
  }, [duration, onSeek, hasEnded, forceMediaReset, disabled]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    handleSeek(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    handleSeek(e);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) onTimeUpdate(audio.currentTime);
    };

    const handleEnded = () => {
      setHasEnded(true);
      onPause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onPause, isDragging]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleSeek(e);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleSeek]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getInfoColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--info').trim();
  };

  const getSuccessColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--success').trim();
  };

  const getProgressBarBackground = () => {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    const opacity = mode === 'light' ? 0.15 : 0.25;
    return getColorWithOpacity(textColor, opacity);
  };

  const getProgressBarBorder = () => {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    const opacity = mode === 'light' ? 0.25 : 0.35;
    return getColorWithOpacity(textColor, opacity);
  };

  const getSurfaceColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  };

  const getPrimaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  };

  const getOnPrimaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--onPrimary').trim();
  };

  const getTextColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  };

  const getSecondaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--textSecondary').trim();
  };

  const getStatusMessage = () => {
    if (analysisLoading) {
      return texts.status?.analyzing || 'Analyzing...';
    }
    if (isPlaying) {
      return texts.status?.playing || 'Playing';
    }
    return texts.status?.paused || 'Paused';
  };

  return (
    <div
      className="rounded-lg p-4 shadow-lg"
      style={{ backgroundColor: getSurfaceColor() }}
    >
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      <div
        ref={progressBarRef}
        onMouseDown={handleMouseDown}
        onClick={handleProgressClick}
        className="w-full h-2 rounded-full cursor-pointer mb-4 relative group"
        style={{
          backgroundColor: getProgressBarBackground(),
          border: `1px solid ${getProgressBarBorder()}`
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
            backgroundColor: getPrimaryColor()
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            left: `calc(${Math.min(100, Math.max(0, progressPercentage))}% - 8px)`,
            backgroundColor: getPrimaryColor()
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled}
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: getPrimaryColor(),
            color: getOnPrimaryColor()
          }}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <div
          className="flex-shrink-0 flex items-center gap-2 font-mono text-sm"
          style={{ color: getTextColor() }}
        >
          <span>{formatTime(currentTime)}</span>
          <span style={{ color: getSecondaryColor() }}>/</span>
          <span style={{ color: getSecondaryColor() }}>{formatTime(duration)}</span>
        </div>

        {!hideStatus && (
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap"
              style={{
                background: analysisLoading
                  ? getColorWithOpacity(getInfoColor(), 0.1)
                  : getColorWithOpacity(getSuccessColor(), 0.1),
                color: analysisLoading ? getInfoColor() : getSuccessColor(),
                border: `1px solid ${analysisLoading ? getColorWithOpacity(getInfoColor(), 0.3) : getColorWithOpacity(getSuccessColor(), 0.3)}`,
                width: '288px',
                maxWidth: '288px'
              }}
            >
              {analysisLoading && (
                <svg
                  className="animate-spin h-4 w-4 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{getStatusMessage()}</span>
            </div>
          </div>
        )}

        {hideStatus && <div className="flex-1" />}

        <div className="flex-shrink-0 flex gap-2">
          {!hideInfoButton && (
            <InfoTooltip
              content={infoTooltipText || texts.infoTooltip || 'Video Player Information'}
            >
              <button
                disabled={disabled}
                className="px-3 py-2 disabled:opacity-50 relative"
                style={{ color: getTextColor() }}
                onMouseEnter={(e) => { e.currentTarget.style.color = getPrimaryColor(); }}
                onMouseLeave={(e) => { e.currentTarget.style.color = getTextColor(); }}
                title={texts.info || 'Info'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </button>
            </InfoTooltip>
          )}
          <button
            onClick={() => {
              if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                onPause();
              }
              if (onSkipBackward) {
                onSkipBackward();
              } else {
                onSeek(Math.max(0, currentTime - 10));
              }
            }}
            disabled={disabled}
            className="px-3 py-2 disabled:opacity-50"
            style={{ color: getTextColor() }}
            onMouseEnter={(e) => { e.currentTarget.style.color = getPrimaryColor(); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = getTextColor(); }}
            title={skipBackwardTooltip || texts.skipBackward || 'Skip backward'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
          </button>
          <button
            onClick={() => {
              if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                onPause();
              }
              if (onSkipForward) {
                onSkipForward();
              } else {
                onSeek(Math.min(duration, currentTime + 10));
              }
            }}
            disabled={disabled}
            className="px-3 py-2 disabled:opacity-50"
            style={{ color: getTextColor() }}
            onMouseEnter={(e) => { e.currentTarget.style.color = getPrimaryColor(); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = getTextColor(); }}
            title={skipForwardTooltip || texts.skipForward || 'Skip forward'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              disabled={disabled}
              className="px-3 py-2 disabled:opacity-50"
              style={{ color: getTextColor() }}
              onMouseEnter={(e) => { e.currentTarget.style.color = getPrimaryColor(); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = getTextColor(); }}
              title={isFullscreen ? (texts.exitFullscreen || 'Exit fullscreen') : (texts.enterFullscreen || 'Enter fullscreen')}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
