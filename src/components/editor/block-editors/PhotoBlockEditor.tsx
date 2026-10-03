import { useState, useEffect } from 'react';
import BlockWrapper from '../BlockWrapper';
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
        <div className="surface-container-high row-span-2 flex min-h-[7rem] items-center justify-center overflow-hidden rounded-xl">
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full min-h-[7rem] object-cover"
            />
          )}
        </div>
        <select
          value={String(block.imageId)}
          onChange={(e) => onUpdate({ ...block, imageId: parseInt(e.target.value, 10) })}
          className="field-filled focus-ring min-w-0"
        >
          {numberedImageIds.length === 0 ? (
            <option value="0">{t('articleEditor.noImagesInAssets')}</option>
          ) : (
            numberedImageIds.map((n) => (
              <option key={n} value={String(n)}>
                {t('articleEditor.imageNumber', { n })}
              </option>
            ))
          )}
        </select>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
          placeholder={t('articleEditor.captionOptional')}
          className="field-filled focus-ring"
        />
      </div>
    </BlockWrapper>
  );
}
