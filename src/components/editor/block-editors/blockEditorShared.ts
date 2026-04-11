import type { EditorBlock } from '../../../types/articleEditor';

/** Props passed to every block editor. */
export interface BlockEditorProps<T extends EditorBlock> {
  block: T;
  index: number;
  totalBlocks: number;
  numberedImageIds: number[];
  numberedImages?: Record<number, Blob>;
  videoIds?: number[];
  articleVideoIds?: number[];
  articleAudioIds?: number[];
  slideshowIds?: number[];
  onUpdate: (block: T) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/** Left column width for block previews (image thumbnail, chess board). */
export const PREVIEW_WIDTH = '7rem';

/** Scale factor for chess board preview thumbnail. */
export const CHESS_BOARD_PREVIEW_SCALE = 112 / 450;

/** Common languages for code blocks (Prism/GFM identifiers). */
export const CODE_LANGUAGES = [
  { value: 'text', label: 'Plain text' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
];

/** Accordion icon type options. */
export const ACCORDION_TYPES = [
  'Info',
  'Bike',
  'Mountain',
  'Tent',
  'MapPin',
  'Train',
  'Bus',
  'Ship',
  'Plane',
  'Car',
  'Code',
  'ShieldCheck',
  'CircleAlert',
  'Castle',
  'EyeOff',
  'Lightbulb',
];
