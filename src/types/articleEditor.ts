/**
 * Types for the backend-independent article editor.
 * Article ZIP protocol: article.zip contains content.zip; content.zip has info.json, content.json, optional thumbnail.avif, N.avif, chessvideoN.zip, slideshowN.zip, videoN.webm.
 */

export type ArticleLanguage = 'cs' | 'en';
export type ArticleSection = 'chess' | 'software' | 'adventure' | 'unlisted';
export type AccessLevel = 'free' | 'paid';

export type ArticleContentType = 'NORMAL' | 'NEWS' | 'TRAINING' | 'INVITATION';

export interface EditorArticleInfo {
  title: string;
  intro: string;
  language: ArticleLanguage;
  section: ArticleSection;
  articleContent: ArticleContentType;
}

/** Per-attachment metadata for chessvideoN.zip / slideshowN.zip (key = filename e.g. "chessvideo1.zip") */
export type EditorAttachments = Record<string, { accessLevel: AccessLevel }>;

export type BlockType =
  | 'markdown'
  | 'accordion'
  | 'chessDiagram'
  | 'photo'
  | 'video'
  | 'articleVideo'
  | 'articleAudio'
  | 'slideshow'
  | 'playEngine'
  | 'quiz'
  | 'dot'
  | 'pie'
  | 'bar'
  | 'katex'
  | 'tts'
  | 'smiles'
  | 'unknown';

export interface BaseBlock {
  id: string;
  type: BlockType;
  /** Custom/unknown fields from JSON; preserved on round-trip. Block editors must not strip this. */
  _rest?: Record<string, unknown>;
}

/** Unified text block: headings, paragraphs, code, tables as a single Markdown string. */
export interface MarkdownBlock extends BaseBlock {
  type: 'markdown';
  /** Plain Markdown only (no MDX, no JSX). */
  content: string;
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  title: string;
  accordionType: string;
  body: string;
}

export interface ChessDiagramBlock extends BaseBlock {
  type: 'chessDiagram';
  fen: string;
  highlights: string;
  lookingOnWhite: boolean;
  /** Optional: "guess the move" challenge; encrypted to bestMoveEncrypted on publish. */
  bestMove?: string;
  /** Optional caption displayed centered below the board. */
  text?: string;
}

export interface PhotoBlock extends BaseBlock {
  type: 'photo';
  imageId: number;
  caption: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  videoNumber: number;
  /** Caption/title shown in the block header (like Video.tsx). */
  title?: string;
}

/** In-article AV1 video (videoN.webm), rendered as <Video> in MDX. Content is always collapsed by default. */
export interface ArticleVideoBlock extends BaseBlock {
  type: 'articleVideo';
  videoId: string;
  title: string;
}

/** In-article audio (audioN.webm), rendered as audio player. Content is always collapsed by default. */
export interface ArticleAudioBlock extends BaseBlock {
  type: 'articleAudio';
  audioId: string;
  title: string;
}

/** Chemistry structure from SMILES string. Rendered as 2D structure in preview/detail (display mode is presentation-layer only). */
export interface SmilesBlock extends BaseBlock {
  type: 'smiles';
  /** Optional caption/title above the structure. */
  title?: string;
  /** SMILES string (required). */
  smiles: string;
}

export interface SlideshowBlock extends BaseBlock {
  type: 'slideshow';
  slideshowNumber: number;
  /** Caption/title shown in the block header (like Video.tsx). */
  title?: string;
}

export interface PlayEngineBlock extends BaseBlock {
  type: 'playEngine';
  fen: string;
  playWithWhite: boolean;
}

export interface DotBlock extends BaseBlock {
  type: 'dot';
  /** Graphviz DOT source. */
  content: string;
}

export interface PieSliceItem {
  label: string;
  value: number;
  color: string;
}

export interface PieBlock extends BaseBlock {
  type: 'pie';
  /** Title displayed above the chart. */
  name: string;
  data: PieSliceItem[];
}

export interface BarSeriesItem {
  name: string;
  data: number[];
  /** Hex/CSS color; theme-adjusted (same as pie). */
  color: string;
}

export interface BarBlock extends BaseBlock {
  type: 'bar';
  /** Title displayed above the chart. */
  name: string;
  /** Labels for the x-axis (e.g. ["Jan", "Feb", "Mar"]). */
  xAxis: string[];
  series: BarSeriesItem[];
}

export interface KaTeXBlock extends BaseBlock {
  type: 'katex';
  /** LaTeX source (display math, block mode). */
  content: string;
}

// ---------------------------------------------------------------------------
// TTS / STT block (text-to-speech with optional speech-to-text per row)
// ---------------------------------------------------------------------------

export interface TtsBlockItem {
  /** Optional label for the row. */
  label?: string;
  /** Text to speak (TTS). */
  text: string;
  /** Language code (e.g. "en-GB"). */
  language: string;
  /** If true, show "Hold to record" and verify STT against text. */
  stt: boolean;
}

export interface TtsBlock extends BaseBlock {
  type: 'tts';
  /** When true and exactly one row: show only play button (center), no table/label/STT. Pure TTS replay for long texts; supports stop. */
  justRead?: boolean;
  items: TtsBlockItem[];
}

// ---------------------------------------------------------------------------
// Quiz types
// ---------------------------------------------------------------------------

export type QuizType = 'radio' | 'checkbox' | 'sort' | 'match';

/** Option for radio/checkbox quiz types. */
export interface QuizOptionItem {
  text: string;
  isCorrect: boolean;
}

/** Item for sort quiz type. */
export interface SortOptionItem {
  caption: string;
  /** Correct sort position (1-based). */
  order: number;
}

/** Fixed label for the left column of a match quiz. */
export interface FixedCaptionItem {
  caption: string;
  order: number;
}

/** Draggable item for the right column of a match quiz. */
export interface MatchOptionItem {
  caption: string;
  /** Correct matching order (must equal the corresponding FixedCaption order). */
  order: number;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  question: string;
  quizType: QuizType;
  /** Optional block ids to show as context (e.g. above the quiz). */
  relevantBlockIds?: string[];
  /** Radio/checkbox options */
  options?: QuizOptionItem[];
  /** Sort options */
  sortOptions?: SortOptionItem[];
  /** Match: fixed left-column labels */
  fixedCaptions?: FixedCaptionItem[];
  /** Match: draggable right-column items */
  matchOptions?: MatchOptionItem[];
}

/** Content item with a type the editor does not support; preserved as raw object for round-trip. */
export interface UnknownBlock extends BaseBlock {
  type: 'unknown';
  /** The full content item object (e.g. { type: 'my-3D-model', ... }) for display and serialization. */
  rawItem: Record<string, unknown>;
}

export type EditorBlock =
  | MarkdownBlock
  | AccordionBlock
  | ChessDiagramBlock
  | PhotoBlock
  | VideoBlock
  | ArticleVideoBlock
  | ArticleAudioBlock
  | SlideshowBlock
  | PlayEngineBlock
  | DotBlock
  | PieBlock
  | BarBlock
  | KaTeXBlock
  | TtsBlock
  | QuizBlock
  | SmilesBlock
  | UnknownBlock;

/** Numbered content images: 1, 2, 3, ... (AVIF blobs). */
export type NumberedImages = Record<number, Blob>;
/** chessvideo1.zip, chessvideo2.zip ... */
export type ChessVideos = Record<number, Blob>;
/** slideshow1.zip, slideshow2.zip ... */
export type Slideshows = Record<number, Blob>;
/** In-article AV1 WebM videos: video1.webm, video2.webm ... (stored at ZIP root). */
export type ArticleVideos = Record<number, { blob: Blob; durationSeconds: number }>;
/** In-article audio: audio1.webm, audio2.webm ... (stored at ZIP root). */
export type ArticleAudios = Record<number, { blob: Blob; durationSeconds?: number }>;

export interface EditorAssets {
  thumbnail: Blob | null;
  numberedImages: NumberedImages;
  chessVideos: ChessVideos;
  slideshows: Slideshows;
  /** In-article videos (video1.webm, video2.webm). */
  articleVideos: ArticleVideos;
  /** In-article audio (audio1.webm, audio2.webm). */
  articleAudios: ArticleAudios;
}

/** One content item as stored in JSON (full object, no key stripping). */
export type ContentItemRaw = Record<string, unknown>;

export interface EditorState {
  info: EditorArticleInfo;
  attachments: EditorAttachments;
  /** Canonical content array; source of truth for save/Pro. Each item is the full JSON object. */
  content: ContentItemRaw[];
  /** Stable IDs for React keys; length = content.length. */
  blockIds: string[];
  /** Derived from content + blockIds for UI. Do not serialize; use content for save. */
  blocks: EditorBlock[];
  assets: EditorAssets;
}

export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function createEmptyEditorState(): EditorState {
  return {
    info: {
      title: '',
      intro: '',
      language: 'en',
      section: 'chess',
      articleContent: 'NORMAL',
    },
    attachments: {},
    content: [],
    blockIds: [],
    blocks: [],
    assets: {
      thumbnail: null,
      numberedImages: {},
      chessVideos: {},
      slideshows: {},
      articleVideos: {},
      articleAudios: {},
    },
  };
}

export function createBlockId(): string {
  return `block-${Math.random().toString(36).slice(2, 11)}`;
}

export function createDefaultBlock(type: BlockType): EditorBlock {
  const id = createBlockId();
  switch (type) {
    case 'markdown':
      return { id, type: 'markdown', content: '' };
    case 'accordion':
      return { id, type: 'accordion', title: '', accordionType: 'Info', body: '' };
    case 'chessDiagram':
      return { id, type: 'chessDiagram', fen: DEFAULT_FEN, highlights: '', lookingOnWhite: true };
    case 'photo':
      return { id, type: 'photo', imageId: 1, caption: '' };
    case 'video':
      return { id, type: 'video', videoNumber: 1 };
    case 'articleVideo':
      return { id, type: 'articleVideo', videoId: '1', title: '' };
    case 'articleAudio':
      return { id, type: 'articleAudio', audioId: '1', title: '' };
    case 'slideshow':
      return { id, type: 'slideshow', slideshowNumber: 1 };
    case 'playEngine':
      return { id, type: 'playEngine', fen: DEFAULT_FEN, playWithWhite: true };
    case 'quiz':
      return {
        id,
        type: 'quiz',
        question: '',
        quizType: 'radio',
        options: [{ text: '', isCorrect: true }],
      };
    case 'dot':
      return { id, type: 'dot', content: '' };
    case 'pie':
      return { id, type: 'pie', name: 'Pie chart', data: [{ label: 'A', value: 50, color: '#4a90d9' }, { label: 'B', value: 50, color: '#888888' }] };
    case 'bar':
      return { id, type: 'bar', name: 'Bar chart', xAxis: ['Jan', 'Feb', 'Mar'], series: [{ name: 'Sales', data: [10, 20, 15], color: '#5b8def' }] };
    case 'katex':
      return { id, type: 'katex', content: '' };
    case 'tts':
      return {
        id,
        type: 'tts',
        items: [{ text: '', language: 'en-GB', stt: false }],
      };
    case 'smiles':
      return { id, type: 'smiles', smiles: '' };
    case 'unknown':
      return { id, type: 'unknown', rawItem: { type: '?' } };
    default:
      return { id, type: 'markdown', content: '' };
  }
}
