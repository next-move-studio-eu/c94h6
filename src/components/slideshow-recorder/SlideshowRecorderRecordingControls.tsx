import { motion } from 'framer-motion';
import type { SlideshowRecorderControlsProps } from './types';
import { formatRecordingTime } from './utils';

export default function SlideshowRecorderRecordingControls({
  recordingState,
  elapsedTime,
  isWebMSupported,
  previewColumnHeight,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  recordingTitle,
  recordButtonLabel,
  pauseButtonLabel,
  resumeButtonLabel,
  stopButtonLabel,
  recordingStatusLabel,
  pausedStatusLabel,
  idleStatusLabel,
  unsupportedBrowserLabel,
  webmNotSupportedLabel,
  webmNotSupportedTitle,
}: SlideshowRecorderControlsProps) {
  return (
    <div
      className="flex-shrink-0 w-[22rem] flex flex-col gap-4 overflow-y-auto min-h-0 scrollbar-theme"
      style={previewColumnHeight ? { maxHeight: previewColumnHeight } : undefined}
    >
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex-shrink-0 w-full space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <span className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
              {recordingTitle}
            </h2>
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="text-2xl font-mono font-bold" style={{ color: 'var(--primary)' }}>
                {formatRecordingTime(elapsedTime)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {recordingState === 'idle' ? (
              <motion.button
                onClick={onStartRecording}
                disabled={!isWebMSupported}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
                style={
                  isWebMSupported
                    ? { backgroundColor: 'var(--primary)', color: 'var(--onPrimary)' }
                    : {
                        backgroundColor: 'var(--surfaceHigh)',
                        color: 'var(--textDisabled)',
                        cursor: 'not-allowed',
                      }
                }
                onMouseEnter={(event) => {
                  if (isWebMSupported) {
                    (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primaryHover)';
                  }
                }}
                onMouseLeave={(event) => {
                  if (isWebMSupported) {
                    (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)';
                  }
                }}
                title={!isWebMSupported ? webmNotSupportedTitle : ''}
                whileTap={isWebMSupported ? { scale: 0.98 } : {}}
              >
                {recordButtonLabel}
              </motion.button>
            ) : null}

            {recordingState === 'recording' ? (
              <>
                <ActionButton label={pauseButtonLabel} onClick={onPauseRecording} />
                <ActionButton label={stopButtonLabel} onClick={onStopRecording} danger />
              </>
            ) : null}

            {recordingState === 'paused' ? (
              <>
                <ActionButton label={resumeButtonLabel} onClick={onResumeRecording} primary />
                <ActionButton label={stopButtonLabel} onClick={onStopRecording} danger />
              </>
            ) : null}

            <div className="ml-auto text-sm font-medium">
              {recordingState === 'recording' ? (
                <span className="animate-pulse" style={{ color: 'var(--error)' }}>
                  {recordingStatusLabel}
                </span>
              ) : null}
              {recordingState === 'paused' ? (
                <span style={{ color: 'var(--warning)' }}>{pausedStatusLabel}</span>
              ) : null}
              {recordingState === 'idle' ? (
                <span style={{ color: 'var(--textSecondary)' }}>{idleStatusLabel}</span>
              ) : null}
            </div>
          </div>
        </div>
        {!isWebMSupported ? (
          <div className="flex-shrink-0 mt-4 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--error)', color: 'var(--onError)' }}>
              <div className="font-bold text-lg mb-2">{unsupportedBrowserLabel}</div>
              <div className="text-sm opacity-95">{webmNotSupportedLabel}</div>
            </div>
          </div>
        ) : null}
        <div className="flex-1 min-h-4" />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary = false,
  danger = false,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  primary?: boolean;
  danger?: boolean;
}) {
  const style = danger
    ? { backgroundColor: 'var(--error)', color: 'var(--onError)' }
    : primary
      ? { backgroundColor: 'var(--primary)', color: 'var(--onPrimary)' }
      : {
          borderColor: 'var(--border)',
          color: 'var(--text)',
          backgroundColor: 'var(--surfaceHigh)',
        };

  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm ${primary || danger ? 'font-semibold' : 'font-medium'} transition-colors duration-150 ${primary || danger ? '' : 'border'}`}
      style={style}
      onMouseEnter={(event) => {
        if (primary) {
          (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primaryHover)';
        } else if (danger) {
          (event.currentTarget as HTMLElement).style.opacity = '0.9';
        } else {
          (event.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
          (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primarySubtle)';
        }
      }}
      onMouseLeave={(event) => {
        if (primary) {
          (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)';
        } else if (danger) {
          (event.currentTarget as HTMLElement).style.opacity = '1';
        } else {
          (event.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--surfaceHigh)';
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}
