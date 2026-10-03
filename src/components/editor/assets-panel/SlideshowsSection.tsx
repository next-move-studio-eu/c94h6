import React from 'react';
import { FileArchive } from 'lucide-react';
import { AssetSlotList } from './AssetSlotList';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface SlideshowsSectionProps {
  ids: number[];
  slideshows: Record<number, Blob>;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplace: (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  t: AssetsTranslation;
}

export function SlideshowsSection({
  ids,
  slideshows,
  inputRef,
  onOpenPicker,
  onUpload,
  onReplace,
  onRemove,
  t,
}: SlideshowsSectionProps) {
  return (
    <div>
      <SectionHeader icon={FileArchive} title={t('articleEditor.slideshowZips')} />
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={t('articleEditor.addSlideshowZip')}
        onClick={onOpenPicker}
        className="mb-3"
      />
      <AssetSlotList
        ids={ids}
        inputPrefix="slideshow-zip"
        accept=".zip"
        onReplace={onReplace}
        onRemove={onRemove}
        removeLabel={t('articleEditor.remove')}
        getLabel={(id) =>
          slideshows[id]
            ? t('articleEditor.slideshowUploaded', { N: id })
            : t('articleEditor.uploadSlideshow', { N: id })
        }
      />
    </div>
  );
}
