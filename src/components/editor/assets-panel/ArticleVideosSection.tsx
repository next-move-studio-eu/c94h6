import React from 'react';
import { Video } from 'lucide-react';
import { AssetSlotList } from './AssetSlotList';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface ArticleVideosSectionProps {
  ids: number[];
  articleVideos: Record<number, { blob: Blob; durationSeconds: number }>;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplace: (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  t: AssetsTranslation;
}

export function ArticleVideosSection({
  ids,
  articleVideos,
  inputRef,
  onOpenPicker,
  onUpload,
  onReplace,
  onRemove,
  t,
}: ArticleVideosSectionProps) {
  return (
    <div>
      <SectionHeader icon={Video} title={t('articleEditor.articleVideosTitle')} />
      <input
        ref={inputRef}
        type="file"
        accept=".webm,video/webm"
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={t('articleEditor.addArticleVideo')}
        onClick={onOpenPicker}
        className="mb-3"
      />
      <AssetSlotList
        ids={ids}
        inputPrefix="video-webm"
        accept=".webm,video/webm"
        onReplace={onReplace}
        onRemove={onRemove}
        removeLabel={t('articleEditor.remove')}
        getLabel={(id) =>
          articleVideos[id]
            ? t('articleEditor.articleVideoUploaded', { N: id })
            : t('articleEditor.uploadArticleVideo', { N: id })
        }
      />
    </div>
  );
}
