import React from 'react';
import { FileArchive } from 'lucide-react';
import { AssetSlotList } from './AssetSlotList';
import { SectionHeader } from './SectionHeader';
import { UploadButton } from './UploadButton';
import type { AssetsTranslation } from './types';

interface ChessVideosSectionProps {
  ids: number[];
  chessVideos: Record<number, Blob>;
  inputRef: React.Ref<HTMLInputElement>;
  onOpenPicker: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplace: (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  t: AssetsTranslation;
}

export function ChessVideosSection({
  ids,
  chessVideos,
  inputRef,
  onOpenPicker,
  onUpload,
  onReplace,
  onRemove,
  t,
}: ChessVideosSectionProps) {
  return (
    <div>
      <SectionHeader icon={FileArchive} title={t('articleEditor.chessVideoZips')} />
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={onUpload}
        className="hidden"
      />
      <UploadButton
        label={t('articleEditor.addVideoZip')}
        onClick={onOpenPicker}
        className="mb-3"
      />
      <AssetSlotList
        ids={ids}
        inputPrefix="chess-video-zip"
        accept=".zip"
        onReplace={onReplace}
        onRemove={onRemove}
        removeLabel={t('articleEditor.remove')}
        getLabel={(id) =>
          chessVideos[id]
            ? t('articleEditor.videoUploaded', { N: id })
            : t('articleEditor.uploadChessVideo', { N: id })
        }
      />
    </div>
  );
}
