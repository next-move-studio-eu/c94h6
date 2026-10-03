import React from 'react';
import { Image } from 'lucide-react';
import { ImagePreviewRow } from './ImagePreviewRow';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface ThumbnailSectionProps {
  thumbnail: Blob | null;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  t: AssetsTranslation;
}

export function ThumbnailSection({
  thumbnail,
  inputRef,
  onOpenPicker,
  onUpload,
  t,
}: ThumbnailSectionProps) {
  return (
    <div>
      <SectionHeader icon={Image} title={t('articleEditor.thumbnailTitle')} />
      <input
        ref={inputRef}
        type="file"
        accept=".avif,image/avif"
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={thumbnail ? t('articleEditor.replaceThumbnail') : t('articleEditor.uploadThumbnail')}
        onClick={onOpenPicker}
      />
      {thumbnail && (
        <ul className="mt-3 space-y-1 text-xs text-[var(--textSecondary)]">
          <ImagePreviewRow label="Thumbnail.avif" blob={thumbnail} />
        </ul>
      )}
    </div>
  );
}
