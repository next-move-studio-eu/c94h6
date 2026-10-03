import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ImageTimestamp, SlideshowImage } from '../types/slideshow';
import DownloadSuccessToast from '../components/DownloadSuccessToast';
import { useFullscreenAutoHideControls } from '../hooks/useFullscreenAutoHideControls';
import SlideshowRecorderFullscreen from '../components/slideshow-recorder/SlideshowRecorderFullscreen';
import SlideshowRecorderImageSelector from '../components/slideshow-recorder/SlideshowRecorderImageSelector';
import SlideshowRecorderPreviewPlayer from '../components/slideshow-recorder/SlideshowRecorderPreviewPlayer';
import SlideshowRecorderRecordingControls from '../components/slideshow-recorder/SlideshowRecorderRecordingControls';
import SlideshowRecorderStage from '../components/slideshow-recorder/SlideshowRecorderStage';
import type { AppMode, RecordingState } from '../components/slideshow-recorder/types';
import {
  buildSlideshowPreviewTexts,
  findNextTimestamp as findNextPreviewTimestamp,
  findPreviousTimestamp as findPreviousPreviewTimestamp,
  getDisplayImage,
} from '../components/slideshow-recorder/utils';
import {
  exitDocumentFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
  subscribeToFullscreenChanges,
} from '../utils/fullscreen';
import { saveBlobWithResolver } from '../utils/savePathResolver';
import JSZip from 'jszip';

export default function SlideshowRecorderPage() {
  const { t } = useTranslation(['slideshowRecorderPage', 'filePicker', 'videoRecorderPage']);
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [selectedImageNumber, setSelectedImageNumber] = useState<number | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [timestamps, setTimestamps] = useState<ImageTimestamp[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const [totalPausedDuration, setTotalPausedDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [appMode, setAppMode] = useState<AppMode>('recording');
  const [previewTimestamps, setPreviewTimestamps] = useState<ImageTimestamp[]>([]);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);
  const [previewIsPlaying, setPreviewIsPlaying] = useState<boolean>(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewCurrentImage, setPreviewCurrentImage] = useState<number | null>(null);
  const [previewDuration, setPreviewDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDownloadSuccessToast, setShowDownloadSuccessToast] = useState<boolean>(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [videoPlayerHeight, setVideoPlayerHeight] = useState<number>(0);
  const fullscreenControlsRef = useRef<HTMLDivElement>(null);
  const previewColumnRef = useRef<HTMLDivElement>(null);
  const [previewColumnHeight, setPreviewColumnHeight] = useState<number>(0);
  const { showControls: showFullscreenControls, setShowControls: setShowFullscreenControls } =
    useFullscreenAutoHideControls({
      enabled: isFullscreen,
      containerRef: fullscreenRef,
      pauseRef: fullscreenControlsRef,
      hideDelayMs: 2000,
    });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm; codecs=opus');
  const [isWebMSupported, setIsWebMSupported] = useState<boolean>(true);

  useEffect(() => {
    const checkWebMSupport = () => {
      const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
      setIsWebMSupported(webmMimeTypes.some(type => MediaRecorder.isTypeSupported(type)));
    };
    checkWebMSupport();
  }, []);

  const saveTimestamp = useCallback(() => {
    if (recordingState === 'recording' && selectedImageNumber !== null) {
      const currentTime = Date.now();
      const elapsed = currentTime - recordingStartTime - totalPausedDuration;
      const lastTimestamp = timestamps[timestamps.length - 1];
      if (lastTimestamp && lastTimestamp.image === selectedImageNumber) return;
      const timestamp: ImageTimestamp = { timestamp: elapsed, image: selectedImageNumber };
      setTimestamps(prev => [...prev, timestamp]);
    }
  }, [recordingState, selectedImageNumber, recordingStartTime, totalPausedDuration, timestamps]);

  useEffect(() => {
    if (recordingState === 'recording') saveTimestamp();
  }, [selectedImageNumber, recordingState, saveTimestamp]);

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
    return () => { if (interval !== null) clearInterval(interval); };
  }, [recordingState, recordingStartTime, totalPausedDuration, pausedTime]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newImages: SlideshowImage[] = [];
    const processedNumbers = new Set<number>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      if (file.type !== 'image/avif' && !fileName.toLowerCase().endsWith('.avif')) {
        alert(t('slideshowRecorderPage.fileNotAvif', { fileName }));
        event.target.value = '';
        return;
      }
      const match = fileName.match(/^(\d+)\.avif$/i);
      if (!match) {
        alert(t('slideshowRecorderPage.invalidFileName', { fileName }));
        event.target.value = '';
        return;
      }
      const imageNumber = parseInt(match[1], 10);
      if (imageNumber <= 0) {
        alert(t('slideshowRecorderPage.invalidFileNumber', { fileName }));
        event.target.value = '';
        return;
      }
      if (processedNumbers.has(imageNumber)) {
        alert(t('slideshowRecorderPage.duplicateFileNumber', { number: imageNumber }));
        event.target.value = '';
        return;
      }
      processedNumbers.add(imageNumber);
      const preview = URL.createObjectURL(file);
      const imageData: SlideshowImage = { number: imageNumber, file, preview };
      newImages.push(imageData);
    }
    const allImages = [...images, ...newImages].sort((a, b) => a.number - b.number);
    setImages(allImages);
    if (selectedImageNumber === null && allImages.length > 0) {
      setSelectedImageNumber(allImages[0].number);
    }
    event.target.value = '';
  };

  const handleStartRecording = async () => {
    if (images.length === 0) {
      alert(t('slideshowRecorderPage.mustUploadImagesFirst'));
      return;
    }
    if (selectedImageNumber === null) {
      alert(t('slideshowRecorderPage.mustSelectImageFirst'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
      const webmMimeTypes = ['audio/webm; codecs=opus', 'audio/webm', 'audio/webm;codecs=opus'];
      let mimeType: string | null = null;
      for (const type of webmMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) { mimeType = type; break; }
      }
      if (!mimeType) {
        stream.getTracks().forEach(track => track.stop());
        alert(t('slideshowRecorderPage.webmNotSupported'));
        return;
      }
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48000 });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = async () => { if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop()); };
      recorder.start();
      setRecordingState('recording');
      setRecordingStartTime(Date.now());
      setTotalPausedDuration(0);
      setPausedTime(0);
      setTimestamps([]);
      const initialTimestamp: ImageTimestamp = { timestamp: 0, image: selectedImageNumber };
      setTimestamps([initialTimestamp]);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(t('slideshowRecorderPage.failedToStartRecording'));
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
      setTotalPausedDuration(prev => prev + pauseDuration);
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      setPausedTime(0);
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState('idle');
      await new Promise(resolve => setTimeout(resolve, 500));
      const mimeType = mimeTypeRef.current;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm; codecs=opus' });
      try {
        if (timestamps.length === 0) throw new Error(t('slideshowRecorderPage.noTimestampsRecorded'));
        const zip = new JSZip();
        zip.file('audio.webm', audioBlob);
        zip.file('timestamps.json', JSON.stringify(timestamps, null, 2));
        for (const image of images) {
          zip.file(`${image.number}.avif`, image.file);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setPreviewTimestamps(timestamps);
        const audioUrl = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl(audioUrl);

        const audio = new Audio(audioUrl);
        const handleLoadedMetadata = () => {
          if (audio.duration && isFinite(audio.duration)) {
            setPreviewDuration(audio.duration);
          } else {
            const lastTimestamp = timestamps[timestamps.length - 1];
            setPreviewDuration(Math.ceil(lastTimestamp.timestamp / 1000));
          }
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        const lastTimestamp = timestamps[timestamps.length - 1];
        setPreviewDuration(Math.ceil(lastTimestamp.timestamp / 1000));

        setAppMode('preview');
        setPreviewCurrentTime(0);
        setPreviewIsPlaying(false);
        if (timestamps.length > 0) {
          setPreviewCurrentImage(timestamps[0].image);
        }

        const { saved } = await saveBlobWithResolver(
          'slideshow',
          `slideshow-${Date.now()}.zip`,
          zipBlob,
          [{ name: 'Slideshow ZIP', extensions: ['zip'] }]
        );
        if (saved) setShowDownloadSuccessToast(true);
      } catch (error) {
        console.error('Failed to create zip:', error);
        alert(t('slideshowRecorderPage.failedToSaveRecording', { error: error instanceof Error ? error.message : t('slideshowRecorderPage.unknownError') }));
      }
      audioChunksRef.current = [];
    }
  };

  useEffect(() => {
    if (appMode !== 'preview' || previewTimestamps.length === 0) return;
    const currentTimeMs = previewCurrentTime * 1000;
    let activeTimestamp: ImageTimestamp | null = null;
    for (let i = previewTimestamps.length - 1; i >= 0; i--) {
      if (previewTimestamps[i].timestamp <= currentTimeMs) {
        activeTimestamp = previewTimestamps[i];
        break;
      }
    }
    if (activeTimestamp) {
      setPreviewCurrentImage(activeTimestamp.image);
    }
  }, [previewCurrentTime, previewTimestamps, appMode]);

  const handlePreviewPlay = useCallback(() => {
    setPreviewIsPlaying(true);
  }, []);

  const handlePreviewPause = useCallback(() => {
    setPreviewIsPlaying(false);
  }, []);

  const handlePreviewSeek = useCallback((time: number) => {
    setPreviewCurrentTime(time);
  }, []);

  const handlePreviewTimeUpdate = useCallback((time: number) => {
    setPreviewCurrentTime(time);
  }, []);

  const findPreviousTimestamp = useCallback(() => {
    findPreviousPreviewTimestamp({
      previewTimestamps,
      previewCurrentTime,
      previewDuration,
      previewIsPlaying,
      onPausePreview: handlePreviewPause,
      onSeekPreview: handlePreviewSeek,
    });
  }, [
    previewTimestamps,
    previewCurrentTime,
    previewDuration,
    previewIsPlaying,
    handlePreviewPause,
    handlePreviewSeek,
  ]);

  const findNextTimestamp = useCallback(() => {
    findNextPreviewTimestamp({
      previewTimestamps,
      previewCurrentTime,
      previewDuration,
      previewIsPlaying,
      onPausePreview: handlePreviewPause,
      onSeekPreview: handlePreviewSeek,
    });
  }, [previewTimestamps, previewCurrentTime, previewIsPlaying, previewDuration, handlePreviewPause, handlePreviewSeek]);

  const displayImage = useMemo(
    () => getDisplayImage(images, appMode, selectedImageNumber, previewCurrentImage),
    [images, appMode, selectedImageNumber, previewCurrentImage]
  );

  const isFullscreenActive = useCallback(() => {
    const el = fullscreenRef.current;
    // Fullscreen overlay mounts only in preview mode; both sides are null while recording
    // and `null === getFullscreenElement()` would wrongly treat that as fullscreen active,
    // which unmounts SlideshowRecorderStage (`{!isFullscreen ? ...}`).
    if (!el) return false;
    return getFullscreenElement() === el;
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!fullscreenRef.current) return;
    if (isFullscreenActive()) {
      exitDocumentFullscreen();
    } else {
      setIsFullscreen(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (fullscreenRef.current) {
            requestElementFullscreen(fullscreenRef.current);
          }
        });
      });
    }
  }, [isFullscreenActive]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isActive = isFullscreenActive();
      setIsFullscreen(isActive);
      if (isActive) {
        setShowFullscreenControls(true);
      }
    };

    setIsFullscreen(isFullscreenActive());

    return subscribeToFullscreenChanges(handleFullscreenChange);
  }, [isFullscreenActive]);

  useEffect(() => {
    if (!isFullscreen || !showFullscreenControls || !fullscreenControlsRef.current) {
      setVideoPlayerHeight(0);
      return;
    }
    const measureHeight = () => {
      if (fullscreenControlsRef.current) {
        setVideoPlayerHeight(fullscreenControlsRef.current.offsetHeight);
      }
    };
    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    if (fullscreenControlsRef.current) {
      resizeObserver.observe(fullscreenControlsRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [isFullscreen, showFullscreenControls]);

  useLayoutEffect(() => {
    if (isFullscreen || !previewColumnRef.current) {
      setPreviewColumnHeight(0);
      return;
    }
    const el = previewColumnRef.current;
    const measure = () => {
      if (el) setPreviewColumnHeight(el.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen, appMode]);

  const videoPlayerTexts = useMemo(() => buildSlideshowPreviewTexts(t), [t]);

  const previewPlayer = (
    <SlideshowRecorderPreviewPlayer
      previewAudioUrl={previewAudioUrl}
      previewDuration={previewDuration}
      previewCurrentTime={previewCurrentTime}
      previewIsPlaying={previewIsPlaying}
      isFullscreen={isFullscreen}
      texts={videoPlayerTexts}
      skipBackwardTooltip={t('videoRecorderPage.videoPlayerSkipBackward')}
      skipForwardTooltip={t('videoRecorderPage.videoPlayerSkipForward')}
      onPlay={handlePreviewPlay}
      onPause={handlePreviewPause}
      onSeek={handlePreviewSeek}
      onTimeUpdate={handlePreviewTimeUpdate}
      onSkipBackward={findPreviousTimestamp}
      onSkipForward={findNextTimestamp}
      onFullscreen={handleFullscreen}
      hideStatus
    />
  );

  return (
    <div
      className="flex flex-col overflow-hidden surface"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      <motion.div
        className="flex flex-1 min-h-0 min-w-0 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-1 min-h-0 min-w-0 gap-4 p-4 rounded-xl surface-container-low">
            {appMode === 'recording' ? (
              <SlideshowRecorderImageSelector
                images={images}
                selectedImageNumber={selectedImageNumber}
                previewColumnHeight={previewColumnHeight}
                onImageUpload={handleImageUpload}
                onSelectImage={setSelectedImageNumber}
                title={t('slideshowRecorderPage.imagesTitle')}
                selectFilesLabel={t('slideshowRecorderPage.selectFilesLabel')}
                filePickerButtonText={t('selectFiles', { ns: 'filePicker' })}
                imageAlt={(number) => t('slideshowRecorderPage.imageAlt', { number })}
              />
            ) : null}

            {!isFullscreen ? (
              <SlideshowRecorderStage
                stageRef={previewColumnRef}
                displayImage={displayImage}
                appMode={appMode}
                selectedImageNumber={selectedImageNumber}
                previewAudioUrl={previewAudioUrl}
                previewPlayer={previewPlayer}
                title={appMode === 'recording' ? t('slideshowRecorderPage.imagePreviewTitle') : undefined}
                noImageLabel={t('slideshowRecorderPage.noImage')}
                selectedImageLabel={(number) => t('slideshowRecorderPage.selectedImage', { number })}
                imageAlt={(number) => t('slideshowRecorderPage.imageAlt', { number })}
              />
            ) : null}

            {appMode === 'recording' ? (
              <SlideshowRecorderRecordingControls
                recordingState={recordingState}
                elapsedTime={elapsedTime}
                isWebMSupported={isWebMSupported}
                previewColumnHeight={previewColumnHeight}
                onStartRecording={handleStartRecording}
                onPauseRecording={handlePauseRecording}
                onResumeRecording={handleResumeRecording}
                onStopRecording={handleStopRecording}
                recordingTitle={t('slideshowRecorderPage.recordingTitle')}
                recordButtonLabel={t('slideshowRecorderPage.recordButton')}
                pauseButtonLabel={t('slideshowRecorderPage.pauseButton')}
                resumeButtonLabel={t('slideshowRecorderPage.resumeButton')}
                stopButtonLabel={t('slideshowRecorderPage.stopButton')}
                recordingStatusLabel={t('slideshowRecorderPage.recordingStatus')}
                pausedStatusLabel={t('slideshowRecorderPage.pausedStatus')}
                idleStatusLabel={t('slideshowRecorderPage.idleStatus')}
                unsupportedBrowserLabel={t('slideshowRecorderPage.unsupportedBrowser')}
                webmNotSupportedLabel={t('slideshowRecorderPage.webmNotSupported')}
                webmNotSupportedTitle={t('slideshowRecorderPage.webmNotSupportedTitle')}
              />
            ) : null}
        </div>
      </motion.div>

      {appMode === 'preview' ? (
        <SlideshowRecorderFullscreen
          fullscreenRef={fullscreenRef}
          fullscreenControlsRef={fullscreenControlsRef}
          isFullscreen={isFullscreen}
          showFullscreenControls={showFullscreenControls}
          videoPlayerHeight={videoPlayerHeight}
          displayImage={displayImage}
          previewPlayer={
            <SlideshowRecorderPreviewPlayer
              previewAudioUrl={previewAudioUrl}
              previewDuration={previewDuration}
              previewCurrentTime={previewCurrentTime}
              previewIsPlaying={previewIsPlaying}
              isFullscreen={isFullscreen}
              texts={videoPlayerTexts}
              skipBackwardTooltip={t('videoRecorderPage.videoPlayerSkipBackward')}
              skipForwardTooltip={t('videoRecorderPage.videoPlayerSkipForward')}
              onPlay={handlePreviewPlay}
              onPause={handlePreviewPause}
              onSeek={handlePreviewSeek}
              onTimeUpdate={handlePreviewTimeUpdate}
              onSkipBackward={findPreviousTimestamp}
              onSkipForward={findNextTimestamp}
              onFullscreen={handleFullscreen}
              hideStatus
            />
          }
          showDownloadSuccessToast={showDownloadSuccessToast && isFullscreen}
          onDismissDownloadToast={() => setShowDownloadSuccessToast(false)}
          noImageLabel={t('slideshowRecorderPage.noImage')}
          imageAlt={(number) => t('slideshowRecorderPage.imageAlt', { number })}
        />
      ) : null}

      {showDownloadSuccessToast && !isFullscreen && (
        <DownloadSuccessToast
          isVisible={showDownloadSuccessToast}
          type="slideshow"
          onDismiss={() => setShowDownloadSuccessToast(false)}
        />
      )}
    </div>
  );
}
