import { useState, useEffect } from 'react';
import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
import type { PhotoBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import { PREVIEW_WIDTH, type BlockEditorProps } from './blockEditorShared';

export function PhotoBlockEditor({
  block,
  index,
  totalBlocks,
  numberedImageIds,
  numberedImages = {},
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<PhotoBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const selectedBlob = block.imageId ? numberedImages[block.imageId] : undefined;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedBlob]);

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockImage')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div
        className="grid gap-x-3 gap-y-3 items-start"
        style={{ gridTemplateColumns: `${PREVIEW_WIDTH} 1fr` }}
      >
        <div className="row-span-2 min-h-[7rem] rounded border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex items-center justify-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full min-h-[7rem] object-cover"
            />
          )}
        </div>
        <Select
          value={String(block.imageId)}
          onChange={(v) => onUpdate({ ...block, imageId: parseInt(v, 10) })}
          options={
            numberedImageIds.length === 0
              ? [{ value: '0', label: t('articleEditor.noImagesInAssets') }]
              : numberedImageIds.map((n) => ({ value: String(n), label: t('articleEditor.imageNumber', { n }) }))
          }
          variant="editor"
          className="min-w-0"
        />
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
          placeholder={t('articleEditor.captionOptional')}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>
    </BlockWrapper>
  );
}
