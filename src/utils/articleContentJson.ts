/**
 * Round-trip between editor blocks and content.json ({ content: ContentItem[] }).
 * Used for article ZIP storage and Pro mode raw JSON editing.
 * Raw JSON is source of truth: we store full content items and merge only known fields on update.
 */
import type { EditorBlock, QuizBlock, BlockType } from '../types/articleEditor';
import type { ContentItemRaw } from '../types/articleEditor';
import { createBlockId } from '../types/articleEditor';
import { validateContentItemForBlockEditor } from './articleBlockSchemas';
import type {
  ContentItem,
  ArticleContent,
  MarkdownItem,
  AccordionItem,
  ChessDiagramItem,
  PhotoArticleItem,
  ChessVideoItem,
  ArticleVideoItem,
  SlideshowItem,
  ArticleAudioItem,
  SmilesItem,
  PlayEngineItem,
  DotItem,
  PieItem,
  BarItem,
  KaTeXItem,
  TtsContentItem,
  QuizItem,
} from '../types/articleContent';

// ---------------------------------------------------------------------------
// Content type <-> block type and editable keys (for merge-only updates)
// ---------------------------------------------------------------------------

/** Content JSON type string -> editor BlockType for known types. */
const BLOCK_TYPE_FROM_CONTENT_TYPE: Record<string, BlockType> = {
  'markdown': 'markdown',
  'accordion': 'accordion',
  'chess-diagram': 'chessDiagram',
  'photo-article': 'photo',
  'chess-video': 'video',
  'video': 'articleVideo',
  'article-audio': 'articleAudio',
  'smiles': 'smiles',
  'slideshow': 'slideshow',
  'play-engine': 'playEngine',
  'dot': 'dot',
  'pie': 'pie',
  'bar': 'bar',
  'katex': 'katex',
  'tts': 'tts',
  'quiz': 'quiz',
};

/** BlockType -> content type string (for writing back). */
const CONTENT_TYPE_FROM_BLOCK_TYPE: Partial<Record<BlockType, string>> = {
  markdown: 'markdown',
  accordion: 'accordion',
  chessDiagram: 'chess-diagram',
  photo: 'photo-article',
  video: 'chess-video',
  articleVideo: 'video',
  articleAudio: 'article-audio',
  smiles: 'smiles',
  slideshow: 'slideshow',
  playEngine: 'play-engine',
  dot: 'dot',
  pie: 'pie',
  bar: 'bar',
  katex: 'katex',
  tts: 'tts',
  quiz: 'quiz',
};

/** Keys that block editors are allowed to change; merged back into content on update. Same names in JSON. */
export const EDITABLE_KEYS_BY_BLOCK_TYPE: Partial<Record<BlockType, readonly string[]>> = {
  markdown: ['content'],
  accordion: ['title', 'accordionType', 'body'],
  chessDiagram: ['fen', 'highlights', 'lookingOnWhite', 'bestMove', 'text'],
  photo: ['imageId', 'caption'],
  video: ['videoNumber', 'title'],
  articleVideo: ['videoId', 'title'],
  articleAudio: ['audioId', 'title'],
  smiles: ['smiles', 'title'],
  slideshow: ['slideshowNumber', 'title'],
  playEngine: ['fen', 'playWithWhite'],
  dot: ['content'],
  pie: ['name', 'data'],
  bar: ['name', 'xAxis', 'series'],
  katex: ['content'],
  tts: ['justRead', 'items'],
  quiz: [
    'question',
    'quizType',
    'relevantBlockIds',
    'options',
    'sortOptions',
    'fixedCaptions',
    'matchOptions',
  ],
};

// ---------------------------------------------------------------------------
// content (full items) + blockIds -> blocks (for display)
// ---------------------------------------------------------------------------

function getBlockTypeFromItem(item: ContentItemRaw): BlockType {
  const t = item?.type;
  return typeof t === 'string' && t in BLOCK_TYPE_FROM_CONTENT_TYPE
    ? (BLOCK_TYPE_FROM_CONTENT_TYPE[t] as BlockType)
    : 'unknown';
}

/** Known keys per content type (for splitting item into block fields + _rest). */
const KNOWN_KEYS_BY_CONTENT_TYPE: Record<string, readonly string[]> = {
  'markdown': ['type', 'content'],
  'accordion': ['type', 'title', 'accordionType', 'body'],
  'chess-diagram': ['type', 'fen', 'highlights', 'lookingOnWhite', 'bestMove', 'text'],
  'photo-article': ['type', 'imageId', 'caption'],
  'chess-video': ['type', 'videoNumber', 'title'],
  'video': ['type', 'videoId', 'title'],
  'article-audio': ['type', 'audioId', 'title'],
  'smiles': ['type', 'smiles', 'title'],
  'slideshow': ['type', 'slideshowNumber', 'title'],
  'play-engine': ['type', 'fen', 'playWithWhite'],
  'dot': ['type', 'content'],
  'pie': ['type', 'name', 'data'],
  'bar': ['type', 'name', 'xAxis', 'series'],
  'katex': ['type', 'content'],
  'tts': ['type', 'justRead', 'items'],
  'quiz': [
    'type',
    'question',
    'quizType',
    'relevantBlockIds',
    'options',
    'sortOptions',
    'fixedCaptions',
    'matchOptions',
  ],
};

function contentItemToBlockWithRest(item: ContentItemRaw, id: string): EditorBlock {
  const contentType = typeof item?.type === 'string' ? item.type : '?';
  const blockType = getBlockTypeFromItem(item);

  if (blockType === 'unknown') {
    return { id, type: 'unknown', rawItem: item as Record<string, unknown> };
  }

  const knownKeys = KNOWN_KEYS_BY_CONTENT_TYPE[contentType];
  const rest: Record<string, unknown> = {};
  const out: Record<string, unknown> = { id, type: blockType };
  if (knownKeys) {
    for (const key of Object.keys(item)) {
      if (knownKeys.includes(key) && key !== 'type') out[key] = item[key];
      else if (key !== 'type') rest[key] = item[key];
    }
  } else {
    for (const key of Object.keys(item)) {
      if (key !== 'type') rest[key] = item[key];
    }
  }
  if (Object.keys(rest).length > 0) out._rest = rest;
  return out as unknown as EditorBlock;
}

function contentItemToBlockWithValidation(
  item: ContentItemRaw,
  id: string,
  index: number,
  schemaErrors: string[]
): EditorBlock {
  const contentType = typeof item?.type === 'string' ? item.type : '?';
  const blockType = getBlockTypeFromItem(item);
  if (blockType === 'unknown') return contentItemToBlockWithRest(item, id);

  const validation = validateContentItemForBlockEditor(item);
  if (!validation.valid) {
    schemaErrors.push(`content[${index}] (${contentType}): ${validation.errors.join(', ')}`);
    return { id, type: 'unknown', rawItem: item as Record<string, unknown> };
  }
  return contentItemToBlockWithRest(item, id);
}

/**
 * Derive editor blocks from content array and block IDs. Uses item.id when present, else blockIds[i], else generates id.
 */
export function contentToBlocks(content: ContentItemRaw[], blockIds: string[]): EditorBlock[] {
  const ids = content.map((item, i) => {
    const itemId = (item as { id?: string }).id;
    return typeof itemId === 'string' && itemId ? itemId : (blockIds[i] ?? createBlockId());
  });
  return content.map((item, i) => contentItemToBlockWithRest(item as ContentItemRaw, ids[i]));
}

export function contentToBlocksWithSchema(content: ContentItemRaw[], blockIds: string[]): { blocks: EditorBlock[]; schemaErrors: string[] } {
  const ids = content.map((item, i) => {
    const itemId = (item as { id?: string }).id;
    return typeof itemId === 'string' && itemId ? itemId : (blockIds[i] ?? createBlockId());
  });
  const schemaErrors: string[] = [];
  const blocks = content.map((item, i) => contentItemToBlockWithValidation(item as ContentItemRaw, ids[i], i, schemaErrors));
  return { blocks, schemaErrors };
}

// ---------------------------------------------------------------------------
// Merge only known fields back into content (block update)
// ---------------------------------------------------------------------------

/**
 * Merge only the editable keys from updatedBlock into existingItem. All other keys on existingItem are preserved.
 */
export function mergeKnownFields(
  existingItem: ContentItemRaw,
  updatedBlock: EditorBlock,
  blockType: BlockType
): ContentItemRaw {
  if (blockType === 'unknown') {
    const unk = updatedBlock as import('../types/articleEditor').UnknownBlock;
    return unk.rawItem ? { ...unk.rawItem } : { ...existingItem };
  }

  const editableKeys = EDITABLE_KEYS_BY_BLOCK_TYPE[blockType];
  if (!editableKeys || editableKeys.length === 0) return { ...existingItem };

  const result = { ...existingItem };
  const contentType = CONTENT_TYPE_FROM_BLOCK_TYPE[blockType];
  if (contentType) result.type = contentType;

  for (const key of editableKeys) {
    if (key in updatedBlock) {
      result[key] = (updatedBlock as unknown as Record<string, unknown>)[key];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Payload -> content + blockIds (load path; keeps full items)
// ---------------------------------------------------------------------------

export interface ContentPayload {
  content: ContentItemRaw[];
  [key: string]: unknown;
}

/**
 * Ensure every content item has a string `id` (used by load, Pro pretty-print, and publish pipeline).
 */
export function ensureContentItemsHaveIds(items: unknown[]): ContentItemRaw[] {
  return items.map((item) => {
    const raw: Record<string, unknown> =
      typeof item === 'object' && item !== null ? { ...(item as Record<string, unknown>) } : { type: 'markdown', content: '' };
    const id = typeof raw.id === 'string' && raw.id ? raw.id : createBlockId();
    return { ...raw, id } as ContentItemRaw;
  });
}

/**
 * Parse payload into content array (full items, no stripping) and ensure each item has an id.
 * Use this for load path so custom fields are preserved. Uses item.id if present (string), else generates one.
 */
export function payloadToContentAndIds(payload: unknown): { content: ContentItemRaw[]; blockIds: string[] } | null {
  if (payload == null || typeof payload !== 'object' || !('content' in payload)) return null;
  const rawContent = (payload as { content: unknown }).content;
  if (!Array.isArray(rawContent)) return null;
  const content = ensureContentItemsHaveIds(rawContent);
  const blockIds = content.map((item) => (item as { id: string }).id);
  return { content, blockIds };
}

/**
 * Build payload for save/Pro serialization from content. Preserves top-level keys if provided.
 */
export function contentToPayload(content: ContentItemRaw[], topLevel?: Record<string, unknown>): ContentPayload {
  return { ...(topLevel ?? {}), content };
}

/**
 * Convert a single block to content item (for addBlock). Includes _rest so custom fields are preserved.
 */
export function blockToContentItem(block: EditorBlock): ContentItemRaw {
  const base = ((): Record<string, unknown> => {
    switch (block.type) {
      case 'markdown':
        return { type: 'markdown', content: block.content };
      case 'accordion':
        return { type: 'accordion', title: block.title, accordionType: block.accordionType, body: block.body };
      case 'chessDiagram': {
        const d = block as import('../types/articleEditor').ChessDiagramBlock;
        return {
          type: 'chess-diagram',
          fen: d.fen,
          highlights: d.highlights,
          lookingOnWhite: d.lookingOnWhite,
          ...(d.bestMove != null && d.bestMove !== '' ? { bestMove: d.bestMove } : {}),
        };
      }
      case 'photo':
        return { type: 'photo-article', imageId: block.imageId, ...(block.caption ? { caption: block.caption } : {}) };
      case 'video':
        return { type: 'chess-video', videoNumber: block.videoNumber, ...(block.title !== undefined && block.title !== '' ? { title: block.title } : {}) };
      case 'articleVideo':
        return { type: 'video', videoId: block.videoId, title: block.title };
      case 'articleAudio':
        return { type: 'article-audio', audioId: block.audioId, title: block.title };
      case 'smiles': {
        const s = block as import('../types/articleEditor').SmilesBlock;
        return { type: 'smiles', smiles: s.smiles, ...(s.title != null && s.title !== '' ? { title: s.title } : {}) };
      }
      case 'slideshow':
        return { type: 'slideshow', slideshowNumber: block.slideshowNumber, ...(block.title !== undefined && block.title !== '' ? { title: block.title } : {}) };
      case 'playEngine':
        return { type: 'play-engine', fen: block.fen, playWithWhite: block.playWithWhite };
      case 'dot':
        return { type: 'dot', content: block.content };
      case 'pie':
        return { type: 'pie', name: block.name, data: block.data };
      case 'bar':
        return { type: 'bar', name: block.name, xAxis: block.xAxis, series: block.series };
      case 'katex':
        return { type: 'katex', content: block.content };
      case 'tts': {
        const t = block as import('../types/articleEditor').TtsBlock;
        return {
          type: 'tts',
          ...(t.justRead ? { justRead: true } : {}),
          items: t.items.map((it) => ({
            ...(it.label != null && it.label !== '' ? { label: it.label } : {}),
            text: it.text,
            language: it.language,
            stt: it.stt,
          })),
        };
      }
      case 'quiz': {
        const q = block as QuizBlock;
        const item: Record<string, unknown> = {
          type: 'quiz',
          question: q.question,
          quizType: q.quizType,
        };
        if (q.relevantBlockIds?.length) item.relevantBlockIds = q.relevantBlockIds;
        if (q.options?.length) item.options = q.options;
        if (q.sortOptions?.length) item.sortOptions = q.sortOptions;
        if (q.fixedCaptions?.length) item.fixedCaptions = q.fixedCaptions;
        if (q.matchOptions?.length) item.matchOptions = q.matchOptions;
        return item;
      }
      case 'unknown':
        return { ...(block.rawItem as Record<string, unknown>) };
      default: {
        const raw = (block as import('../types/articleEditor').UnknownBlock).rawItem;
        return { ...(raw as Record<string, unknown>) };
      }
    }
  })();
  const rest = (block as { _rest?: Record<string, unknown> })._rest;
  const out = rest ? { ...rest, ...base } : base;
  return { ...out, id: block.id } as ContentItemRaw;
}

// ---------------------------------------------------------------------------
// blocks → content JSON (legacy: used when migrating from blocks-only state)
// ---------------------------------------------------------------------------

export function blocksToContentJson(blocks: EditorBlock[]): ArticleContent {
  const content = blocks.map((block): ContentItem => {
    let item: ContentItem;
    switch (block.type) {
      case 'markdown':
        item = { type: 'markdown', content: block.content } satisfies MarkdownItem;
        break;
      case 'accordion':
        item = {
          type: 'accordion',
          title: block.title,
          accordionType: block.accordionType,
          body: block.body,
        } satisfies AccordionItem;
        break;
      case 'chessDiagram': {
        const d = block as import('../types/articleEditor').ChessDiagramBlock;
        item = {
          type: 'chess-diagram',
          fen: d.fen,
          highlights: d.highlights,
          lookingOnWhite: d.lookingOnWhite,
          ...(d.bestMove != null && d.bestMove !== '' ? { bestMove: d.bestMove } : {}),
          ...(d.text != null && d.text !== '' ? { text: d.text } : {}),
        } satisfies ChessDiagramItem;
        break;
      }
      case 'photo':
        item = {
          type: 'photo-article',
          imageId: block.imageId,
          ...(block.caption ? { caption: block.caption } : {}),
        } satisfies PhotoArticleItem;
        break;
      case 'video':
        item = {
          type: 'chess-video',
          videoNumber: block.videoNumber,
          ...(block.title !== undefined && block.title !== '' ? { title: block.title } : {}),
        } satisfies ChessVideoItem;
        break;
      case 'articleVideo':
        item = {
          type: 'video',
          videoId: block.videoId,
          title: block.title,
        } satisfies ArticleVideoItem;
        break;
      case 'articleAudio':
        item = {
          type: 'article-audio',
          audioId: block.audioId,
          title: block.title,
        } satisfies ArticleAudioItem;
        break;
      case 'smiles': {
        const s = block as import('../types/articleEditor').SmilesBlock;
        item = {
          type: 'smiles',
          smiles: s.smiles,
          ...(s.title != null && s.title !== '' ? { title: s.title } : {}),
        } satisfies SmilesItem;
        break;
      }
      case 'slideshow':
        item = {
          type: 'slideshow',
          slideshowNumber: block.slideshowNumber,
          ...(block.title !== undefined && block.title !== '' ? { title: block.title } : {}),
        } satisfies SlideshowItem;
        break;
      case 'playEngine':
        item = {
          type: 'play-engine',
          fen: block.fen,
          playWithWhite: block.playWithWhite,
        } satisfies PlayEngineItem;
        break;
      case 'dot':
        item = { type: 'dot', content: block.content } satisfies DotItem;
        break;
      case 'pie':
        item = { type: 'pie', name: block.name, data: block.data } satisfies PieItem;
        break;
      case 'bar':
        item = {
          type: 'bar',
          name: block.name,
          xAxis: block.xAxis,
          series: block.series,
        } satisfies BarItem;
        break;
      case 'katex':
        item = { type: 'katex', content: block.content } satisfies KaTeXItem;
        break;
      case 'tts': {
        const ttsBlock = block as import('../types/articleEditor').TtsBlock;
        item = {
          type: 'tts',
          ...(ttsBlock.justRead ? { justRead: true } : {}),
          items: ttsBlock.items.map((it) => ({
            ...(it.label != null && it.label !== '' ? { label: it.label } : {}),
            text: it.text,
            language: it.language,
            stt: it.stt,
          })),
        } satisfies TtsContentItem;
        break;
      }
      case 'quiz': {
        const q = block as QuizBlock;
        const quizItem: QuizItem = {
          type: 'quiz',
          question: q.question,
          quizType: q.quizType,
        };
        if (q.relevantBlockIds?.length) quizItem.relevantBlockIds = q.relevantBlockIds;
        if (q.options?.length) quizItem.options = q.options;
        if (q.sortOptions?.length) quizItem.sortOptions = q.sortOptions;
        if (q.fixedCaptions?.length) quizItem.fixedCaptions = q.fixedCaptions;
        if (q.matchOptions?.length) quizItem.matchOptions = q.matchOptions;
        item = quizItem;
        break;
      }
      case 'unknown':
        item = block.rawItem as unknown as ContentItem;
        break;
      default:
        item = (block as Extract<EditorBlock, { type: 'unknown' }>).rawItem as unknown as ContentItem;
    }
    return { ...item, id: block.id } as ContentItem;
  });
  return { content };
}

// ---------------------------------------------------------------------------
// content JSON → blocks
// ---------------------------------------------------------------------------

function contentItemToBlock(item: ContentItem): EditorBlock {
  const id = createBlockId();
  switch (item.type) {
    case 'markdown':
      return { id, type: 'markdown', content: (item as MarkdownItem).content };
    case 'accordion': {
      const a = item as AccordionItem;
      return { id, type: 'accordion', title: a.title, accordionType: a.accordionType, body: a.body };
    }
    case 'chess-diagram': {
      const c = item as ChessDiagramItem;
      return {
        id,
        type: 'chessDiagram',
        fen: c.fen,
        highlights: c.highlights,
        lookingOnWhite: c.lookingOnWhite,
        ...(c.bestMove != null && c.bestMove !== '' ? { bestMove: c.bestMove } : {}),
        ...(c.text != null && c.text !== '' ? { text: c.text } : {}),
      };
    }
    case 'photo-article': {
      const p = item as PhotoArticleItem;
      return { id, type: 'photo', imageId: p.imageId, caption: p.caption ?? '' };
    }
    case 'chess-video': {
      const v = item as ChessVideoItem;
      return { id, type: 'video', videoNumber: v.videoNumber, title: v.title };
    }
    case 'video': {
      const av = item as ArticleVideoItem;
      return { id, type: 'articleVideo', videoId: av.videoId, title: av.title };
    }
    case 'article-audio': {
      const aa = item as ArticleAudioItem;
      return { id, type: 'articleAudio', audioId: aa.audioId, title: aa.title ?? '' };
    }
    case 'smiles': {
      const sm = item as SmilesItem;
      return { id, type: 'smiles', smiles: sm.smiles, title: sm.title };
    }
    case 'slideshow': {
      const s = item as SlideshowItem;
      return { id, type: 'slideshow', slideshowNumber: s.slideshowNumber, title: s.title };
    }
    case 'play-engine': {
      const pe = item as PlayEngineItem;
      return { id, type: 'playEngine', fen: pe.fen, playWithWhite: pe.playWithWhite };
    }
    case 'dot': {
      const d = item as DotItem;
      return { id, type: 'dot', content: d.content };
    }
    case 'pie': {
      const p = item as PieItem;
      return { id, type: 'pie', name: p.name, data: p.data };
    }
    case 'bar': {
      const b = item as BarItem;
      return { id, type: 'bar', name: b.name, xAxis: b.xAxis, series: b.series };
    }
    case 'katex': {
      const k = item as KaTeXItem;
      return { id, type: 'katex', content: k.content };
    }
    case 'tts': {
      const t = item as TtsContentItem;
      return {
        id,
        type: 'tts',
        ...(t.justRead ? { justRead: true } : {}),
        items: t.items.map((it) => ({
          ...(it.label != null && it.label !== '' ? { label: it.label } : {}),
          text: it.text,
          language: it.language,
          stt: it.stt,
        })),
      };
    }
    case 'quiz': {
      const q = item as QuizItem;
      const base = {
        id,
        type: 'quiz' as const,
        question: q.question,
        quizType: q.quizType,
      };
      if (q.options?.length)
        return { ...base, options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect ?? false })) };
      if (q.sortOptions?.length)
        return { ...base, sortOptions: q.sortOptions.map((s) => ({ caption: s.caption, order: s.order ?? 1 })) };
      if (q.fixedCaptions?.length && q.matchOptions?.length)
        return {
          ...base,
          fixedCaptions: q.fixedCaptions,
          matchOptions: q.matchOptions.map((m) => ({ caption: m.caption, order: m.order ?? 1 })),
        };
      return { ...base, options: [{ text: '', isCorrect: true }] };
    }
    default: {
      return { id, type: 'unknown', rawItem: item as unknown as Record<string, unknown> };
    }
  }
}

/**
 * Parse content.json payload (object with "content" array) into editor blocks.
 * Expects { content: ContentItem[] }; returns empty array if invalid.
 */
export function contentJsonToBlocks(payload: unknown): EditorBlock[] {
  if (payload == null || typeof payload !== 'object' || !('content' in payload)) return [];
  const content = (payload as { content: unknown }).content;
  if (!Array.isArray(content)) return [];
  return content.map((item) => contentItemToBlock(item as ContentItem));
}

// ---------------------------------------------------------------------------
// Extract referenced asset IDs from content (for validation)
// ---------------------------------------------------------------------------

export function extractArticleVideoIdsFromContent(content: ContentItem[]): number[] {
  const ids: number[] = [];
  for (const item of content) {
    if (item.type === 'video') {
      const n = parseInt((item as ArticleVideoItem).videoId, 10);
      if (!Number.isNaN(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
  }
  return ids;
}

export function extractChessVideoIdsFromContent(content: ContentItem[]): number[] {
  const ids: number[] = [];
  for (const item of content) {
    if (item.type === 'chess-video') {
      const v = (item as ChessVideoItem).videoNumber;
      if (v > 0 && !ids.includes(v)) ids.push(v);
    }
  }
  return ids;
}

export function extractSlideshowIdsFromContent(content: ContentItem[]): number[] {
  const ids: number[] = [];
  for (const item of content) {
    if (item.type === 'slideshow') {
      const n = (item as SlideshowItem).slideshowNumber;
      if (n > 0 && !ids.includes(n)) ids.push(n);
    }
  }
  return ids;
}

export function extractArticleAudioIdsFromContent(content: ContentItem[]): number[] {
  const ids: number[] = [];
  for (const item of content) {
    if (item.type === 'article-audio') {
      const n = parseInt((item as ArticleAudioItem).audioId, 10);
      if (!Number.isNaN(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
  }
  return ids;
}

export function extractNumberedImageIdsFromContent(content: ContentItem[]): number[] {
  const ids: number[] = [];
  for (const item of content) {
    if (item.type === 'photo-article') {
      const n = (item as PhotoArticleItem).imageId;
      if (n > 0 && !ids.includes(n)) ids.push(n);
    }
  }
  return ids;
}
