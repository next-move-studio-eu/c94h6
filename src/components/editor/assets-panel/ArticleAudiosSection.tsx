import React from 'react';
import { Mic } from 'lucide-react';
import { AssetSlotList } from './AssetSlotList';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface ArticleAudiosSectionProps {
  ids: number[];
  articleAudios: Record<number, { blob: Blob; durationSeconds?: number }>;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplace: (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  t: AssetsTranslation;
}

export function ArticleAudiosSection({
  ids,
  articleAudios,
  inputRef,
  onOpenPicker,
  onUpload,
  onReplace,
  onRemove,
  t,
}: ArticleAudiosSectionProps) {
  return (
    <div>
      <SectionHeader
        icon={Mic}
        title={t('articleEditor.articleAudiosTitle')}
        description={t('articleEditor.articleAudiosFormatRequired')}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".webm,audio/webm"
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={t('articleEditor.addArticleAudio')}
        onClick={onOpenPicker}
        className="mb-3"
      />
      <AssetSlotList
        ids={ids}
        inputPrefix="article-audio"
        accept=".webm,audio/webm"
        onReplace={onReplace}
        onRemove={onRemove}
        removeLabel={t('articleEditor.remove')}
        getLabel={(id) =>
          articleAudios[id]
            ? t('articleEditor.articleAudioUploaded', { N: id })
            : t('articleEditor.uploadArticleAudio', { N: id })
        }
      />
    </div>
  );
}
