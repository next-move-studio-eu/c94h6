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
      className="flex-shrink-0 w-[22rem] flex flex-col gap-4 overflow-y-auto min-h-0 self-stretch scrollbar-theme"
      style={previewColumnHeight ? { maxHeight: previewColumnHeight } : undefined}
    >
      <div className="flex flex-col rounded-xl p-4 surface-container-high">
        <div className="flex-shrink-0 w-full space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-primary" />
              {recordingTitle}
            </h2>
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="text-2xl font-mono font-bold text-primary">
                {formatRecordingTime(elapsedTime)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {recordingState === 'idle' ? (
              <motion.button
                onClick={onStartRecording}
                disabled={!isWebMSupported}
                className="btn-filled"
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
                <span className="animate-pulse text-error">{recordingStatusLabel}</span>
              ) : null}
              {recordingState === 'paused' ? (
                <span className="text-warning">{pausedStatusLabel}</span>
              ) : null}
              {recordingState === 'idle' ? (
                <span className="text-on-surface-variant">{idleStatusLabel}</span>
              ) : null}
            </div>
          </div>
        </div>
        {!isWebMSupported ? (
          <div className="mt-4 p-4 rounded-xl bg-error-container text-on-error-container">
            <div className="font-bold text-lg mb-2">{unsupportedBrowserLabel}</div>
            <div className="text-sm">{webmNotSupportedLabel}</div>
          </div>
        ) : null}
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
  const className = danger ? 'btn-filled !bg-error !text-on-error' : primary ? 'btn-filled' : 'btn-tonal';

  return (
    <motion.button onClick={onClick} className={className} whileTap={{ scale: 0.98 }}>
      {label}
    </motion.button>
  );
}
