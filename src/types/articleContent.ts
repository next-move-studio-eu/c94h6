/**
 * Article content JSON format: stored body is an object with "content" array of ContentItem.
 * Each item is discriminated by `type`. Used for content.json inside content.zip.
 * The wrapper allows extra top-level fields to be added later.
 *
 * Editor vs presentation fields:
 * - Stored JSON (editor-time) holds only what the author edits: plain text, FEN, UCI, etc.
 * - Presentation-only fields (e.g. encrypted answers) are added during publish
 *   and must not be stored in the article body. They are injected by the backend or
 *   resolved at render time (e.g. from API / session).
 *
 * Component → ContentItem mapping (editor-time props only):
 *
 * | Article block / component | ContentItem type    | Stored props |
 * |---------------------------|---------------------|--------------|
 * | title, subtitle, para, code, table | markdown        | content      |
 * | Accordion                 | accordion           | title, accordionType, body (MD only) |
 * | ChessDiagram              | chess-diagram       | fen, highlights, lookingOnWhite |
 * | PhotoArticle              | photo-article       | imageId, caption? |
 * | ChessVideo (block: video) | chess-video         | videoNumber, title? |
 * | Video (block: articleVideo) | video             | videoId, title |
 * | Slideshow                 | slideshow           | slideshowNumber, title? |
 * | PlayAgainstEngine         | play-engine         | fen, playWithWhite |
 * | PieDiagram                | pie                 | name, data (label, value, color) |
 * | BarDiagram                | bar                 | name, xAxis, series (name, data, color) |
 * | KaTeX (display math)      | katex               | content (LaTeX) |
 * | Quiz                      | quiz                | question, quizType, options? / sortOptions? / fixedCaptions?+matchOptions? (no encrypted fields) |
 * | unsupported type         | (any string)        | type + rest preserved as rawItem in editor only; not valid for publish |
 */

// ---------------------------------------------------------------------------
// Markdown (unified text)
// ---------------------------------------------------------------------------

/** All text content: headings, paragraphs, code blocks, tables. Single MD string, no JSX. */
export interface MarkdownItem {
  type: 'markdown';
  /** Plain Markdown only (no MDX, no JSX). */
  content: string;
}

// ---------------------------------------------------------------------------
// Accordion — components/article-blocks/Accordion.tsx
// ---------------------------------------------------------------------------

export interface AccordionItem {
  type: 'accordion';
  /** Accordion header label. */
  title: string;
  /** Icon/key: e.g. "Info", "Warning". Passed to Accordion as `type`. */
  accordionType: string;
  /** Body is Markdown only (no MDX, no JSX). Rendered with react-markdown + remark-gfm. */
  body: string;
}

// ---------------------------------------------------------------------------
// Chess diagram — components/article-blocks/ChessDiagram.tsx
// ---------------------------------------------------------------------------

export interface ChessDiagramItem {
  type: 'chess-diagram';
  /** FEN position string. */
  fen: string;
  /** Comma-separated square highlights (e.g. "e4,e5"). */
  highlights: string;
  /** Board orientation. */
  lookingOnWhite: boolean;
  /** Optional: "guess the move" UCI (editor only; replaced with bestMoveEncrypted on publish). */
  bestMove?: string;
  /** Optional caption displayed centered below the board. */
  text?: string;
}

// ---------------------------------------------------------------------------
// Photo (article image) — components/article-blocks/PhotoArticle.tsx
// ---------------------------------------------------------------------------

export interface PhotoArticleItem {
  type: 'photo-article';
  /** Numbered image id (1 → 1.avif, 2 → 2.avif). */
  imageId: number;
  /** Optional caption. */
  caption?: string;
}

// ---------------------------------------------------------------------------
// Chess video — components/article-blocks/ChessVideo.tsx (block: video)
// ---------------------------------------------------------------------------

export interface ChessVideoItem {
  type: 'chess-video';
  /** Identifies chessvideoN.zip (e.g. 1 → chessvideo1.zip). */
  videoNumber: number;
  /** Optional title in block header. */
  title?: string;
}

// ---------------------------------------------------------------------------
// In-article AV1 video — components/article-blocks/Video.tsx (block: articleVideo)
// ---------------------------------------------------------------------------

export interface ArticleVideoItem {
  type: 'video';
  /** Video id (e.g. "1" → video1.webm). */
  videoId: string;
  /** Title shown in block header. */
  title: string;
}

// ---------------------------------------------------------------------------
// Slideshow — components/article-blocks/Slideshow.tsx
// ---------------------------------------------------------------------------

export interface SlideshowItem {
  type: 'slideshow';
  /** Identifies slideshowN.zip (e.g. 1 → slideshow1.zip). */
  slideshowNumber: number;
  /** Optional title in block header. */
  title?: string;
}

// ---------------------------------------------------------------------------
// In-article audio — components/article-blocks/ArticleAudio (audioN.webm)
// ---------------------------------------------------------------------------

export interface ArticleAudioItem {
  type: 'article-audio';
  /** Audio id (e.g. "1" → audio1.webm). */
  audioId: string;
  /** Optional title in block header. */
  title?: string;
}

// ---------------------------------------------------------------------------
// SMILES (chemistry structure) — rendered as 2D structure via RDKit
// ---------------------------------------------------------------------------

export interface SmilesItem {
  type: 'smiles';
  /** SMILES string (required). */
  smiles: string;
  /** Optional caption/title above the structure. */
  title?: string;
}

// ---------------------------------------------------------------------------
// Play against engine — components/article-blocks/PlayAgainstEngine.tsx
// ---------------------------------------------------------------------------

export interface PlayEngineItem {
  type: 'play-engine';
  /** Starting FEN. */
  fen: string;
  /** Side the user plays. */
  playWithWhite: boolean;
}

// ---------------------------------------------------------------------------
// DOT (Graphviz) — rendered as SVG in preview/detail
// ---------------------------------------------------------------------------

export interface DotItem {
  type: 'dot';
  /** Graphviz DOT source. */
  content: string;
}

// ---------------------------------------------------------------------------
// Pie chart — components/article-blocks/PieDiagram.tsx
// ---------------------------------------------------------------------------

export interface PieSliceContent {
  label: string;
  value: number;
  /** Hex/CSS color; theme-adjusted (darken in dark mode, lighten in light). */
  color: string;
}

export interface PieItem {
  type: 'pie';
  /** Title displayed above the chart. */
  name: string;
  data: PieSliceContent[];
}

// ---------------------------------------------------------------------------
// Bar chart — components/article-blocks/BarDiagram.tsx
// ---------------------------------------------------------------------------

export interface BarSeriesContent {
  name: string;
  data: number[];
  /** Hex/CSS color; theme-adjusted (same as pie). */
  color: string;
}

export interface BarItem {
  type: 'bar';
  /** Title displayed above the chart. */
  name: string;
  /** Labels for the x-axis (e.g. ["Jan", "Feb", "Mar"]). */
  xAxis: string[];
  series: BarSeriesContent[];
}

// ---------------------------------------------------------------------------
// KaTeX (display math block)
// ---------------------------------------------------------------------------

export interface KaTeXItem {
  type: 'katex';
  /** LaTeX source (display math, block mode). */
  content: string;
}

// ---------------------------------------------------------------------------
// TTS / STT — text-to-speech list with optional labels and speech-to-text per row
// ---------------------------------------------------------------------------

export interface TtsItemContent {
  label?: string;
  text: string;
  /** Language code (e.g. "en-GB"). */
  language: string;
  /** If true, enable "Hold to record" and verify STT against text. */
  stt: boolean;
}

export interface TtsContentItem {
  type: 'tts';
  /** When true and exactly one row: show only play button (center), no table/label/STT. Pure TTS replay. */
  justRead?: boolean;
  items: TtsItemContent[];
}

// ---------------------------------------------------------------------------
// Quiz — components/article-blocks/Quiz.tsx
// ---------------------------------------------------------------------------

/** Radio/checkbox option. Editor: isCorrect; presentation (post-processed): isCorrectEncrypted. */
export interface QuizOptionContent {
  text: string;
  isCorrect?: boolean;
  /** Set by backend on publish; used for verification in detail view. */
  isCorrectEncrypted?: string | null;
}

/** Sort option. Editor: order; presentation: orderEncrypted. */
export interface SortOptionContent {
  caption: string;
  /** Correct 1-based position (editor). */
  order?: number;
  /** Set by backend on publish; used for verification in detail view. */
  orderEncrypted?: string | null;
}

/** Match: fixed left column (editor-time: no encryption). */
export interface FixedCaptionContent {
  caption: string;
  order: number;
}

/** Match: draggable right column. Editor: order; presentation: orderEncrypted. */
export interface MatchOptionContent {
  caption: string;
  order?: number;
  /** Set by backend on publish; used for verification in detail view. */
  orderEncrypted?: string | null;
}

export type QuizTypeContent = 'radio' | 'checkbox' | 'sort' | 'match';

export interface QuizItem {
  type: 'quiz';
  question: string;
  /** Server-assigned id for verification when present in published content. */
  quizId?: number | null;
  quizType: QuizTypeContent;
  /** Optional block ids to show as context (e.g. above the quiz). */
  relevantBlockIds?: string[];
  /** Radio/checkbox. */
  options?: QuizOptionContent[];
  /** Sort. */
  sortOptions?: SortOptionContent[];
  /** Match: fixed captions. */
  fixedCaptions?: FixedCaptionContent[];
  /** Match: match options. */
  matchOptions?: MatchOptionContent[];
}

// ---------------------------------------------------------------------------
// Unknown (raw / future types)
// ---------------------------------------------------------------------------

/** Item with a type the app does not support; used for editor/preview display only. Not valid for publish. */
export interface UnknownItem {
  type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Union and content array
// ---------------------------------------------------------------------------

export type ContentItem =
  | MarkdownItem
  | AccordionItem
  | ChessDiagramItem
  | PhotoArticleItem
  | ChessVideoItem
  | ArticleVideoItem
  | SlideshowItem
  | ArticleAudioItem
  | SmilesItem
  | PlayEngineItem
  | DotItem
  | PieItem
  | BarItem
  | KaTeXItem
  | TtsContentItem
  | QuizItem
  | UnknownItem;

/** Article body: object with "content" array (allows extra top-level fields later). */
export interface ArticleContentPayload {
  content: ContentItem[];
}

export type ArticleContent = ArticleContentPayload;

/** Known content item type literals (for validation and switches). */
export const CONTENT_ITEM_TYPES = [
  'markdown',
  'accordion',
  'chess-diagram',
  'photo-article',
  'chess-video',
  'video',
  'slideshow',
  'article-audio',
  'smiles',
  'play-engine',
  'dot',
  'pie',
  'bar',
  'katex',
  'tts',
  'quiz',
] as const;

export type KnownContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

/** Type guard: item has a known type and is not UnknownItem. */
export function isKnownContentItem(item: ContentItem): item is Exclude<ContentItem, UnknownItem> {
  return CONTENT_ITEM_TYPES.includes(item.type as KnownContentItemType);
}
