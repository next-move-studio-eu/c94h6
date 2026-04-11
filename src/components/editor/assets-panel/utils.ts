import type { EditorAttachments, EditorBlock, EditorState } from '../../../types/articleEditor';

type AssetMetaWithDuration = { blob: Blob; durationSeconds?: number };

export function getSortedNumericKeys<T>(record: Record<number, T> | Record<string, T>): number[] {
  return Object.keys(record)
    .map(Number)
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);
}

export function getNextNumericId(ids: number[]): number {
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

function reindexBlobRecord(record: Record<number, Blob>, remainingIds: number[]): Record<number, Blob> {
  return remainingIds.reduce<Record<number, Blob>>((acc, oldId, index) => {
    const entry = record[oldId];
    if (entry) {
      acc[index + 1] = entry;
    }
    return acc;
  }, {});
}

function reindexAssetMetaRecord<T extends AssetMetaWithDuration>(
  record: Record<number, T>,
  remainingIds: number[],
): Record<number, T> {
  return remainingIds.reduce<Record<number, T>>((acc, oldId, index) => {
    const entry = record[oldId];
    if (entry) {
      acc[index + 1] = entry;
    }
    return acc;
  }, {});
}

function remapAttachmentKeys(
  attachments: EditorAttachments,
  removedId: number,
  remainingIds: number[],
  createKey: (id: number) => string,
): EditorAttachments {
  const nextAttachments = { ...attachments };
  delete nextAttachments[createKey(removedId)];

  remainingIds.forEach((oldId, index) => {
    const newId = index + 1;
    const oldKey = createKey(oldId);
    const meta = nextAttachments[oldKey] ?? { accessLevel: 'free' as const };

    if (oldId !== newId) {
      delete nextAttachments[oldKey];
    }

    nextAttachments[createKey(newId)] = meta;
  });

  return nextAttachments;
}

function createIdRemap(remainingIds: number[]): Record<number, number> {
  return remainingIds.reduce<Record<number, number>>((acc, oldId, index) => {
    acc[oldId] = index + 1;
    return acc;
  }, {});
}

function remapBlocks(
  blocks: EditorBlock[],
  removedId: number,
  nextIdByOldId: Record<number, number>,
  mapBlock: (block: EditorBlock, removedId: number, nextIdByOldId: Record<number, number>) => EditorBlock,
): EditorBlock[] {
  return blocks.map((block) => mapBlock(block, removedId, nextIdByOldId));
}

export function removeNumberedImageFromState(state: EditorState, removedId: number): EditorState {
  const remainingIds = getSortedNumericKeys(state.assets.numberedImages).filter((id) => id !== removedId);
  const numberedImages = reindexBlobRecord(state.assets.numberedImages, remainingIds);

  return {
    ...state,
    assets: { ...state.assets, numberedImages },
    blocks: state.blocks.map((block) => {
      if (block.type !== 'photo') {
        return block;
      }

      if (block.imageId === removedId) {
        return { ...block, imageId: 1 };
      }

      return { ...block, imageId: block.imageId > removedId ? block.imageId - 1 : block.imageId };
    }),
  };
}

export function removeArticleVideoFromState(state: EditorState, removedId: number): EditorState {
  const remainingIds = getSortedNumericKeys(state.assets.articleVideos).filter((id) => id !== removedId);
  const articleVideos = reindexAssetMetaRecord(state.assets.articleVideos, remainingIds);
  const attachments = remapAttachmentKeys(state.attachments, removedId, remainingIds, (id) => `video${id}.webm`);
  const nextIdByOldId = createIdRemap(remainingIds);

  return {
    ...state,
    assets: { ...state.assets, articleVideos },
    attachments,
    blocks: remapBlocks(state.blocks, removedId, nextIdByOldId, (block, id, remap) => {
      if (block.type !== 'articleVideo') {
        return block;
      }

      if (block.videoId === String(id)) {
        return { ...block, videoId: '1' };
      }

      return { ...block, videoId: String(remap[Number(block.videoId)] ?? block.videoId) };
    }),
  };
}

export function removeArticleAudioFromState(state: EditorState, removedId: number): EditorState {
  const remainingIds = getSortedNumericKeys(state.assets.articleAudios).filter((id) => id !== removedId);
  const articleAudios = reindexAssetMetaRecord(state.assets.articleAudios, remainingIds);
  const attachments = remapAttachmentKeys(state.attachments, removedId, remainingIds, (id) => `audio${id}.webm`);
  const nextIdByOldId = createIdRemap(remainingIds);

  return {
    ...state,
    assets: { ...state.assets, articleAudios },
    attachments,
    blocks: remapBlocks(state.blocks, removedId, nextIdByOldId, (block, id, remap) => {
      if (block.type !== 'articleAudio') {
        return block;
      }

      if (block.audioId === String(id)) {
        return { ...block, audioId: '1' };
      }

      return { ...block, audioId: String(remap[Number(block.audioId)] ?? block.audioId) };
    }),
  };
}

export function removeChessVideoFromState(state: EditorState, removedId: number): EditorState {
  const remainingIds = getSortedNumericKeys(state.assets.chessVideos).filter((id) => id !== removedId);
  const chessVideos = reindexBlobRecord(state.assets.chessVideos, remainingIds);
  const attachments = remapAttachmentKeys(state.attachments, removedId, remainingIds, (id) => `chessvideo${id}.zip`);
  const nextIdByOldId = createIdRemap(remainingIds);

  return {
    ...state,
    assets: { ...state.assets, chessVideos },
    attachments,
    blocks: remapBlocks(state.blocks, removedId, nextIdByOldId, (block, id, remap) => {
      if (block.type !== 'video') {
        return block;
      }

      if (block.videoNumber === id) {
        return { ...block, videoNumber: 1 };
      }

      return { ...block, videoNumber: remap[block.videoNumber] ?? block.videoNumber };
    }),
  };
}

export function removeSlideshowFromState(state: EditorState, removedId: number): EditorState {
  const remainingIds = getSortedNumericKeys(state.assets.slideshows).filter((id) => id !== removedId);
  const slideshows = reindexBlobRecord(state.assets.slideshows, remainingIds);
  const attachments = remapAttachmentKeys(state.attachments, removedId, remainingIds, (id) => `slideshow${id}.zip`);
  const nextIdByOldId = createIdRemap(remainingIds);

  return {
    ...state,
    assets: { ...state.assets, slideshows },
    attachments,
    blocks: remapBlocks(state.blocks, removedId, nextIdByOldId, (block, id, remap) => {
      if (block.type !== 'slideshow') {
        return block;
      }

      if (block.slideshowNumber === id) {
        return { ...block, slideshowNumber: 1 };
      }

      return { ...block, slideshowNumber: remap[block.slideshowNumber] ?? block.slideshowNumber };
    }),
  };
}
