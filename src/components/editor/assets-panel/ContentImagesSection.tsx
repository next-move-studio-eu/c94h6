import React from 'react';
import { Image } from 'lucide-react';
import { ImagePreviewRow } from './ImagePreviewRow';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface ContentImagesSectionProps {
  numberedIds: number[];
  numberedImages: Record<number, Blob>;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  t: AssetsTranslation;
}

export function ContentImagesSection({
  numberedIds,
  numberedImages,
  inputRef,
  onOpenPicker,
  onUpload,
  onRemove,
  t,
}: ContentImagesSectionProps) {
  return (
    <div>
      <SectionHeader
        icon={Image}
        title={t('articleEditor.contentImagesTitle')}
        description={t('articleEditor.contentImagesFormatRequired')}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".avif,image/avif"
        multiple
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={t('articleEditor.addImage')}
        onClick={onOpenPicker}
        className="mb-3"
      />
      {numberedIds.length > 0 && (
        <ul className="space-y-1 text-xs text-[var(--textSecondary)]">
          {numberedIds.map((id) => (
            <ImagePreviewRow
              key={id}
              label={`${id}.avif`}
              blob={numberedImages[id]}
              onRemove={() => onRemove(id)}
              removeLabel={t('articleEditor.remove')}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
