import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import DownloadSuccessToast from '../components/DownloadSuccessToast';
import { saveBlobWithResolver } from '../utils/savePathResolver';

type RecordingState = 'idle' | 'recording' | 'paused';

export default function AudioRecorderPage() {
  const { t } = useTranslation('audioRecorderPage');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const [totalPausedDuration, setTotalPausedDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showDownloadSuccessToast, setShowDownloadSuccessToast] = useState<boolean>(false);
  const [isWebMSupported, setIsWebMSupported] = useState<boolean>(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm; codecs=opus');

  useEffect(() => {
    const checkWebMSupport = () => {
      const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
      setIsWebMSupported(webmMimeTypes.some((type) => MediaRecorder.isTypeSupported(type)));
    };
    checkWebMSupport();
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (recordingState === 'recording') {
      interval = window.setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - recordingStartTime - totalPausedDuration;
        setElapsedTime(Math.floor(elapsed / 1000));
      }, 1000);
    } else if (recordingState === 'paused') {
      const elapsed = pausedTime - recordingStartTime - totalPausedDuration;
      setElapsedTime(Math.floor(elapsed / 1000));
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [recordingState, recordingStartTime, totalPausedDuration, pausedTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
      let mimeType: string | null = null;
      for (const type of webmMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      if (!mimeType) {
        stream.getTracks().forEach((track) => track.stop());
        alert(t('audioRecorderPage.webmNotSupported'));
        return;
      }
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48000 });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecordingState('recording');
      setRecordingStartTime(Date.now());
      setTotalPausedDuration(0);
      setPausedTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(t('audioRecorderPage.failedToStartRecording'));
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      setPausedTime(Date.now());
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      const pauseDuration = Date.now() - pausedTime;
      setTotalPausedDuration((prev) => prev + pauseDuration);
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      setPausedTime(0);
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState('idle');
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mimeType = mimeTypeRef.current;
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mimeType || 'audio/webm; codecs=opus',
      });
      try {
        const { saved } = await saveBlobWithResolver(
          'audio',
          `audio-${Date.now()}.webm`,
          audioBlob,
          [{ name: 'WebM Audio', extensions: ['webm'] }]
        );
        if (saved) setShowDownloadSuccessToast(true);
      } catch (error) {
        console.error('Failed to save recording:', error);
        alert(
          t('audioRecorderPage.failedToSaveRecording', {
            error: error instanceof Error ? error.message : t('audioRecorderPage.unknownError'),
          })
        );
      }
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col surface">
      <motion.div
        className="flex gap-4 p-4 flex-1 min-h-0 items-start justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0 w-full max-w-md rounded-xl overflow-hidden p-4 surface-container">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <span className="w-1 h-6 rounded-full bg-primary" />
            {t('audioRecorderPage.recordingTitle')}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">
                {t('audioRecorderPage.description')}
              </span>
              {(recordingState === 'recording' || recordingState === 'paused') && (
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {recordingState === 'idle' && (
                <motion.button
                  onClick={handleStartRecording}
                  disabled={!isWebMSupported}
                  className="btn-filled"
                  title={!isWebMSupported ? t('audioRecorderPage.webmNotSupportedTitle') : ''}
                  whileTap={isWebMSupported ? { scale: 0.98 } : {}}
                >
                  {t('audioRecorderPage.recordButton')}
                </motion.button>
              )}
              {recordingState === 'recording' && (
                <>
                  <motion.button
                    onClick={handlePauseRecording}
                    className="btn-tonal"
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('audioRecorderPage.pauseButton')}
                  </motion.button>
                  <motion.button
                    onClick={handleStopRecording}
                    className="btn-filled !bg-error !text-on-error"
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('audioRecorderPage.stopButton')}
                  </motion.button>
                </>
              )}
              {recordingState === 'paused' && (
                <>
                  <motion.button
                    onClick={handleResumeRecording}
                    className="btn-filled"
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('audioRecorderPage.resumeButton')}
                  </motion.button>
                  <motion.button
                    onClick={handleStopRecording}
                    className="btn-filled !bg-error !text-on-error"
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('audioRecorderPage.stopButton')}
                  </motion.button>
                </>
              )}
              <div className="ml-auto text-sm font-medium">
                {recordingState === 'recording' && (
                  <span className="animate-pulse text-error">
                    {t('audioRecorderPage.recordingStatus')}
                  </span>
                )}
                {recordingState === 'paused' && (
                  <span className="text-warning">
                    {t('audioRecorderPage.pausedStatus')}
                  </span>
                )}
                {recordingState === 'idle' && (
                  <span className="text-on-surface-variant">
                    {t('audioRecorderPage.idleStatus')}
                  </span>
                )}
              </div>
            </div>
            {!isWebMSupported && (
              <div className="mt-4 p-4 rounded-xl bg-error-container text-on-error-container">
                <div className="font-bold text-lg mb-2">
                  {t('audioRecorderPage.unsupportedBrowser')}
                </div>
                <div className="text-sm">{t('audioRecorderPage.webmNotSupported')}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {showDownloadSuccessToast && (
        <DownloadSuccessToast
          isVisible={showDownloadSuccessToast}
          type="audio"
          onDismiss={() => setShowDownloadSuccessToast(false)}
        />
      )}
    </div>
  );
}
