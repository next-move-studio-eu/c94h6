import { useRef } from 'react';
import { createContentImageAvif, createThumbnailAvif } from '../../../utils/imageExport';
import { useTranslation } from 'react-i18next';
import { ArticleAudiosSection } from './ArticleAudiosSection';
import { ArticleVideosSection } from './ArticleVideosSection';
import { ChessVideosSection } from './ChessVideosSection';
import { ContentImagesSection } from './ContentImagesSection';
import { SlideshowsSection } from './SlideshowsSection';
import { ThumbnailSection } from './ThumbnailSection';
import type { AssetsPanelProps } from './types';
import {
  getNextNumericId,
  getSortedNumericKeys,
  removeArticleAudioFromState,
  removeArticleVideoFromState,
  removeChessVideoFromState,
  removeNumberedImageFromState,
  removeSlideshowFromState,
} from './utils';
import { validateArticleAudioFile, validateArticleVideoFile } from './validators';

export default function AssetsPanelController({ state, setState }: AssetsPanelProps) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const articleVideoInputRef = useRef<HTMLInputElement>(null);
  const articleAudioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const slideshowInputRef = useRef<HTMLInputElement>(null);

  const numberedIds = getSortedNumericKeys(state.assets.numberedImages);
  const articleVideoIds = getSortedNumericKeys(state.assets.articleVideos);
  const articleAudioIds = getSortedNumericKeys(state.assets.articleAudios);
  const videoIds = getSortedNumericKeys(state.assets.chessVideos);
  const slideshowIds = getSortedNumericKeys(state.assets.slideshows);

  const updateAssets = (patch: Partial<typeof state.assets>) => {
    setState((current) => ({ ...current, assets: { ...current.assets, ...patch } }));
  };

  const handleThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const blob = await createThumbnailAvif(file);
      updateAssets({ thumbnail: blob });
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.thumbnailFailed'));
    }
  };

  const handleContentImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    const fileList = Array.from(files);
    event.target.value = '';

    try {
      const blobs = await Promise.all(fileList.map((file) => createContentImageAvif(file)));
      const nextNumberedImages = { ...state.assets.numberedImages };
      const startId = getNextNumericId(numberedIds);

      blobs.forEach((blob, index) => {
        nextNumberedImages[startId + index] = blob;
      });

      updateAssets({ numberedImages: nextNumberedImages });
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.imageFailed'));
    }
  };

  const handleArticleVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const { blob, durationSeconds } = await validateArticleVideoFile(file);
      const nextId = getNextNumericId(articleVideoIds);
      const attachmentKey = `video${nextId}.webm`;

      setState((current) => ({
        ...current,
        assets: {
          ...current.assets,
          articleVideos: {
            ...current.assets.articleVideos,
            [nextId]: { blob, durationSeconds },
          },
        },
        attachments: {
          ...current.attachments,
          [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.articleVideoInvalidFormat'));
    }
  };

  const handleArticleVideoForSlot = (id: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const { blob, durationSeconds } = await validateArticleVideoFile(file);
      const attachmentKey = `video${id}.webm`;

      setState((current) => ({
        ...current,
        assets: {
          ...current.assets,
          articleVideos: {
            ...current.assets.articleVideos,
            [id]: { blob, durationSeconds },
          },
        },
        attachments: {
          ...current.attachments,
          [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.articleVideoInvalidFormat'));
    }
  };

  const handleArticleAudio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const { blob, durationSeconds } = await validateArticleAudioFile(file);
      const nextId = getNextNumericId(articleAudioIds);
      const attachmentKey = `audio${nextId}.webm`;

      setState((current) => ({
        ...current,
        assets: {
          ...current.assets,
          articleAudios: {
            ...current.assets.articleAudios,
            [nextId]: { blob, durationSeconds },
          },
        },
        attachments: {
          ...current.attachments,
          [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.articleAudioInvalidFormat'));
    }
  };

  const handleArticleAudioForSlot = (id: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const { blob, durationSeconds } = await validateArticleAudioFile(file);
      const attachmentKey = `audio${id}.webm`;

      setState((current) => ({
        ...current,
        assets: {
          ...current.assets,
          articleAudios: {
            ...current.assets.articleAudios,
            [id]: { blob, durationSeconds },
          },
        },
        attachments: {
          ...current.attachments,
          [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : t('assetsValidation.articleAudioInvalidFormat'));
    }
  };

  const handleVideoZip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      return;
    }

    const blob = await file.arrayBuffer().then((arrayBuffer) => new Blob([arrayBuffer]));
    const nextId = getNextNumericId(videoIds);
    const attachmentKey = `chessvideo${nextId}.zip`;

    setState((current) => ({
      ...current,
      assets: {
        ...current.assets,
        chessVideos: { ...current.assets.chessVideos, [nextId]: blob },
      },
      attachments: {
        ...current.attachments,
        [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
      },
    }));
  };

  const handleSlideshowZip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      return;
    }

    const blob = await file.arrayBuffer().then((arrayBuffer) => new Blob([arrayBuffer]));
    const nextId = getNextNumericId(slideshowIds);
    const attachmentKey = `slideshow${nextId}.zip`;

    setState((current) => ({
      ...current,
      assets: {
        ...current.assets,
        slideshows: { ...current.assets.slideshows, [nextId]: blob },
      },
      attachments: {
        ...current.attachments,
        [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
      },
    }));
  };

  const handleVideoZipForSlot = (id: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      return;
    }

    const blob = await file.arrayBuffer().then((arrayBuffer) => new Blob([arrayBuffer]));
    const attachmentKey = `chessvideo${id}.zip`;

    setState((current) => ({
      ...current,
      assets: {
        ...current.assets,
        chessVideos: { ...current.assets.chessVideos, [id]: blob },
      },
      attachments: {
        ...current.attachments,
        [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
      },
    }));
  };

  const handleSlideshowZipForSlot = (id: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      return;
    }

    const blob = await file.arrayBuffer().then((arrayBuffer) => new Blob([arrayBuffer]));
    const attachmentKey = `slideshow${id}.zip`;

    setState((current) => ({
      ...current,
      assets: {
        ...current.assets,
        slideshows: { ...current.assets.slideshows, [id]: blob },
      },
      attachments: {
        ...current.attachments,
        [attachmentKey]: current.attachments[attachmentKey] ?? { accessLevel: 'free' as const },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <ThumbnailSection
        thumbnail={state.assets.thumbnail}
        inputRef={thumbInputRef}
        onOpenPicker={() => thumbInputRef.current?.click()}
        onUpload={handleThumbnail}
        t={t}
      />
      <ContentImagesSection
        numberedIds={numberedIds}
        numberedImages={state.assets.numberedImages}
        inputRef={contentInputRef}
        onOpenPicker={() => contentInputRef.current?.click()}
        onUpload={handleContentImage}
        onRemove={(id) => setState((current) => removeNumberedImageFromState(current, id))}
        t={t}
      />
      <SlideshowsSection
        ids={slideshowIds}
        slideshows={state.assets.slideshows}
        inputRef={slideshowInputRef}
        onOpenPicker={() => slideshowInputRef.current?.click()}
        onUpload={handleSlideshowZip}
        onReplace={handleSlideshowZipForSlot}
        onRemove={(id) => setState((current) => removeSlideshowFromState(current, id))}
        t={t}
      />
      <ArticleAudiosSection
        ids={articleAudioIds}
        articleAudios={state.assets.articleAudios}
        inputRef={articleAudioInputRef}
        onOpenPicker={() => articleAudioInputRef.current?.click()}
        onUpload={handleArticleAudio}
        onReplace={handleArticleAudioForSlot}
        onRemove={(id) => setState((current) => removeArticleAudioFromState(current, id))}
        t={t}
      />
      <ArticleVideosSection
        ids={articleVideoIds}
        articleVideos={state.assets.articleVideos}
        inputRef={articleVideoInputRef}
        onOpenPicker={() => articleVideoInputRef.current?.click()}
        onUpload={handleArticleVideo}
        onReplace={handleArticleVideoForSlot}
        onRemove={(id) => setState((current) => removeArticleVideoFromState(current, id))}
        t={t}
      />
      <ChessVideosSection
        ids={videoIds}
        chessVideos={state.assets.chessVideos}
        inputRef={videoInputRef}
        onOpenPicker={() => videoInputRef.current?.click()}
        onUpload={handleVideoZip}
        onReplace={handleVideoZipForSlot}
        onRemove={(id) => setState((current) => removeChessVideoFromState(current, id))}
        t={t}
      />
    </div>
  );
}
