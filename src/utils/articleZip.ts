/**
 * Build and parse article ZIP (backend-independent). Root container uses Store (no compression).
 */
import JSZip from 'jszip';
import type { EditorState } from '../types/articleEditor';
import { createEmptyEditorState, createBlockId } from '../types/articleEditor';
import { contentToBlocks, contentToPayload, payloadToContentAndIds } from './articleContentJson';
import { validateArticle } from './articleValidation';
import { validateContentPayload } from './articleContentSchema';

const INFO_JSON_NAME = 'info.json';
const CONTENT_JSON_NAME = 'content.json';
const THUMBNAIL_NAME = 'thumbnail.avif';
const CONTENT_ZIP_NAME = 'content.zip';

const ZIP_OPTS = { compression: 'STORE' as const, compressionOptions: { level: 0 } };

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = reject;
    r.readAsArrayBuffer(blob);
  });
}

/**
 * Get duration in seconds from a WebM blob (e.g. video N.webm or audio.webm). Uses a video element.
 * Returns 0 on failure or if not WebM.
 */
export function getWebMDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const onLoaded = () => {
      const d = video.duration;
      cleanup();
      resolve(Number.isFinite(d) && d >= 0 ? Math.round(d) : 0);
    };
    const onError = () => {
      cleanup();
      resolve(0);
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
      video.src = '';
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.src = url;
  });
}

/**
 * Get duration in seconds from a zip that contains audio.webm (slideshow zip or chess video zip).
 */
export async function getDurationFromZipWithAudioWebm(zipBlob: Blob): Promise<number> {
  try {
    const arrayBuffer = await blobToArrayBuffer(zipBlob);
    const zip = await JSZip.loadAsync(arrayBuffer);
    const audioBlob = await zip.file('audio.webm')?.async('blob');
    if (!audioBlob) return 0;
    return getWebMDuration(audioBlob);
  } catch {
    return 0;
  }
}

/**
 * Build article ZIP from current editor state. Outer ZIP contains a single entry content.zip;
 * inner content.zip has content.json, thumbnail, N.avif, video/slideshow zips (no info.json). Uses Store (no compression).
 */
export async function buildArticleZip(state: EditorState): Promise<Blob> {
  const contentZip = new JSZip();

  const payload = contentToPayload(state.content);
  contentZip.file(CONTENT_JSON_NAME, JSON.stringify(payload, null, 2), ZIP_OPTS);

  if (state.assets.thumbnail) {
    contentZip.file(THUMBNAIL_NAME, state.assets.thumbnail, ZIP_OPTS);
  }

  const numbered = Object.keys(state.assets.numberedImages)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const n of numbered) {
    const blob = state.assets.numberedImages[n];
    if (blob) contentZip.file(`${n}.avif`, blob, ZIP_OPTS);
  }

  const videoNumbers = Object.keys(state.assets.chessVideos)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const n of videoNumbers) {
    const blob = state.assets.chessVideos[n];
    if (blob) contentZip.file(`chessvideo${n}.zip`, blob, ZIP_OPTS);
  }

  const slideshowNumbers = Object.keys(state.assets.slideshows)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const n of slideshowNumbers) {
    const blob = state.assets.slideshows[n];
    if (blob) contentZip.file(`slideshow${n}.zip`, blob, ZIP_OPTS);
  }

  const articleVideoNumbers = Object.keys(state.assets.articleVideos)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const n of articleVideoNumbers) {
    const entry = state.assets.articleVideos[n];
    if (entry?.blob) contentZip.file(`video${n}.webm`, entry.blob, ZIP_OPTS);
  }

  const articleAudioNumbers = Object.keys(state.assets.articleAudios)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const n of articleAudioNumbers) {
    const entry = state.assets.articleAudios[n];
    if (entry?.blob) contentZip.file(`audio${n}.webm`, entry.blob, ZIP_OPTS);
  }

  const contentZipBlob = await contentZip.generateAsync({
    type: 'blob',
    compression: 'STORE',
    compressionOptions: { level: 0 },
  });

  const outerZip = new JSZip();
  outerZip.file(CONTENT_ZIP_NAME, contentZipBlob, ZIP_OPTS);

  return outerZip.generateAsync({
    type: 'blob',
    compression: 'STORE',
    compressionOptions: { level: 0 },
  });
}

export interface ParseArticleZipResult {
  state: EditorState;
  errors: string[];
}

/**
 * Parse an article ZIP into editor state. Expects outer ZIP with content.zip; parses from inner content.zip.
 * Rebuilds block structure from content.json (round-trip with blocksToContentJson).
 */
export async function parseArticleZip(zipBlob: Blob): Promise<ParseArticleZipResult> {
  const errors: string[] = [];
  const state = createEmptyEditorState();

  const arrayBuffer = await blobToArrayBuffer(zipBlob);
  const outerZip = await JSZip.loadAsync(arrayBuffer);

  const contentZipEntry = outerZip.file(CONTENT_ZIP_NAME);
  if (!contentZipEntry) {
    errors.push('ZIP must contain content.zip');
    return { state, errors };
  }

  const contentZipBlob = await contentZipEntry.async('blob');
  const contentZipBuffer = await blobToArrayBuffer(contentZipBlob);
  const zip = await JSZip.loadAsync(contentZipBuffer);

  const names = Object.keys(zip.files).filter((n) => !n.includes('/') && !n.includes('\\'));

  if (!names.includes(CONTENT_JSON_NAME)) {
    errors.push('content.zip must contain content.json');
    return { state, errors };
  }

  // info.json is optional: if missing, use defaults; if present, parse and ignore name
  const defaultsInfo = {
    title: '',
    intro: '',
    language: 'en' as const,
    section: 'chess' as const,
    articleContent: 'NORMAL' as const,
  };
  if (!names.includes(INFO_JSON_NAME)) {
    state.info = { ...defaultsInfo };
    state.attachments = {};
  } else {
    let infoData: Record<string, unknown> = {};
    try {
      const infoStr = await zip.file(INFO_JSON_NAME)!.async('string');
      infoData = JSON.parse(infoStr) as Record<string, unknown>;
      const validArticleContent: Array<'NORMAL' | 'NEWS' | 'TRAINING' | 'INVITATION'> = ['NORMAL', 'NEWS', 'TRAINING', 'INVITATION'];
      const rawArticleContent = String(infoData.articleContent ?? infoData.article_content ?? 'NORMAL').trim().toUpperCase();
      const articleContent = validArticleContent.includes(rawArticleContent as 'NORMAL' | 'NEWS' | 'TRAINING' | 'INVITATION') ? (rawArticleContent as 'NORMAL' | 'NEWS' | 'TRAINING' | 'INVITATION') : 'NORMAL';

      state.info = {
        title: typeof infoData.title === 'string' ? (infoData.title as string).trim().slice(0, 255) : '',
        intro: typeof infoData.intro === 'string' ? (infoData.intro as string).trim().slice(0, 1000) : '',
        language: infoData.language === 'cs' || infoData.language === 'en' ? infoData.language : 'en',
        section:
          infoData.section === 'chess' ||
          infoData.section === 'software' ||
          infoData.section === 'adventure' ||
          infoData.section === 'unlisted'
            ? infoData.section
            : 'chess',
        articleContent,
      };

      for (const key of names) {
        if (key === INFO_JSON_NAME || key === CONTENT_JSON_NAME) continue;
        if (key.endsWith('.zip') || /^video\d+\.webm$/i.test(key) || /^audio\d+\.webm$/i.test(key)) {
          const entry = infoData[key];
          if (typeof entry === 'object' && entry !== null && 'accessLevel' in entry) {
            const e = entry as { accessLevel?: string };
            state.attachments[key] = {
              accessLevel: e.accessLevel === 'paid' ? 'paid' : 'free',
            };
          }
        }
      }
    } catch {
      state.info = { ...defaultsInfo };
      state.attachments = {};
    }
  }

  try {
    const contentStr = await zip.file(CONTENT_JSON_NAME)!.async('string');
    let payload: unknown;
    try {
      payload = JSON.parse(contentStr);
    } catch {
      errors.push('content.json is not valid JSON');
    }
    const schemaResult = validateContentPayload(payload);
    if (!schemaResult.valid) {
      errors.push(...schemaResult.errors);
    }
    const parsed = payloadToContentAndIds(payload);
    const isValidPayload =
      typeof payload === 'object' && payload !== null && 'content' in payload && Array.isArray((payload as { content?: unknown }).content);
    if (parsed && parsed.content.length > 0) {
      state.content = parsed.content;
      state.blockIds = parsed.blockIds;
      state.blocks = contentToBlocks(parsed.content, parsed.blockIds);
    } else if (isValidPayload) {
      const emptyId = createBlockId();
      const emptyContent = [{ type: 'markdown', content: '', id: emptyId }];
      const emptyIds = [emptyId];
      state.content = emptyContent;
      state.blockIds = emptyIds;
      state.blocks = contentToBlocks(emptyContent, emptyIds);
    } else if (payload !== undefined) {
      const invalidId = createBlockId();
      const invalidContent = [{ type: '_invalid', _raw: contentStr, id: invalidId }];
      const invalidIds = [invalidId];
      state.content = invalidContent;
      state.blockIds = invalidIds;
      state.blocks = [{ id: invalidIds[0], type: 'unknown', rawItem: { type: '_invalid', _raw: contentStr } }];
    } else {
      state.content = [];
      state.blockIds = [];
      state.blocks = [];
    }
  } catch {
    errors.push('content.json could not be read as UTF-8 text');
  }

  const thumbnailEntry = names.find((n) => n.toLowerCase() === THUMBNAIL_NAME);
  if (thumbnailEntry) {
    try {
      state.assets.thumbnail = await zip.file(thumbnailEntry)!.async('blob');
    } catch {
      errors.push('thumbnail.avif could not be read');
    }
  }

  const numberedNames = names.filter((n) => /^\d+\.avif$/i.test(n));
  for (const n of numberedNames) {
    const num = parseInt(n.replace(/\.avif$/i, ''), 10);
    if (!Number.isNaN(num)) {
      try {
        state.assets.numberedImages[num] = await zip.file(n)!.async('blob');
      } catch {
        errors.push(`Could not read ${n}`);
      }
    }
  }

  for (const n of names) {
    const articleVideoMatch = /^video(\d+)\.webm$/i.exec(n);
    if (articleVideoMatch) {
      const num = parseInt(articleVideoMatch[1], 10);
      try {
        const blob = await zip.file(n)!.async('blob');
        const durationSeconds = await getWebMDuration(blob);
        state.assets.articleVideos[num] = { blob, durationSeconds };
      } catch {
        errors.push(`Could not read ${n}`);
      }
    }
    const articleAudioMatch = /^audio(\d+)\.webm$/i.exec(n);
    if (articleAudioMatch) {
      const num = parseInt(articleAudioMatch[1], 10);
      try {
        const blob = await zip.file(n)!.async('blob');
        const durationSeconds = await getWebMDuration(blob);
        state.assets.articleAudios[num] = { blob, durationSeconds };
      } catch {
        errors.push(`Could not read ${n}`);
      }
    }
    const videoMatch = /^chessvideo(\d+)\.zip$/i.exec(n);
    if (videoMatch) {
      const num = parseInt(videoMatch[1], 10);
      try {
        state.assets.chessVideos[num] = await zip.file(n)!.async('blob');
      } catch {
        errors.push(`Could not read ${n}`);
      }
    }
    const slideshowMatch = /^slideshow(\d+)\.zip$/i.exec(n);
    if (slideshowMatch) {
      const num = parseInt(slideshowMatch[1], 10);
      try {
        state.assets.slideshows[num] = await zip.file(n)!.async('blob');
      } catch {
        errors.push(`Could not read ${n}`);
      }
    }
  }

  // Ensure attachment entry for each article video (default free if not in info.json)
  for (const num of Object.keys(state.assets.articleVideos).map(Number).filter((n) => !Number.isNaN(n))) {
    const key = `video${num}.webm`;
    if (!state.attachments[key]) {
      state.attachments[key] = { accessLevel: 'free' };
    }
  }

  // Ensure attachment entry for each article audio (default free if not in info.json)
  for (const num of Object.keys(state.assets.articleAudios).map(Number).filter((n) => !Number.isNaN(n))) {
    const key = `audio${num}.webm`;
    if (!state.attachments[key]) {
      state.attachments[key] = { accessLevel: 'free' };
    }
  }

  const articleErrors = validateArticle(state);
  for (const msg of articleErrors) {
    errors.push(msg);
  }

  return { state, errors };
}
