import type { ContentItemRaw } from '../types/articleEditor';

export interface BlockSchemaValidationResult {
  valid: boolean;
  errors: string[];
}

interface ItemRule {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  optional?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function validateRules(item: ContentItemRaw, rules: readonly ItemRule[]): BlockSchemaValidationResult {
  const errors: string[] = [];
  for (const rule of rules) {
    const value = item[rule.key];
    if (value == null) {
      if (!rule.optional) errors.push(`Missing "${rule.key}"`);
      continue;
    }
    if (rule.type === 'array') {
      if (!Array.isArray(value)) errors.push(`"${rule.key}" must be an array`);
      continue;
    }
    if (rule.type === 'object') {
      if (!isRecord(value)) errors.push(`"${rule.key}" must be an object`);
      continue;
    }
    if (typeof value !== rule.type) {
      errors.push(`"${rule.key}" must be ${rule.type}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

const RULES_BY_TYPE: Partial<Record<string, readonly ItemRule[]>> = {
  markdown: [{ key: 'content', type: 'string' }],
  accordion: [
    { key: 'title', type: 'string' },
    { key: 'accordionType', type: 'string' },
    { key: 'body', type: 'string' },
  ],
  'chess-diagram': [
    { key: 'fen', type: 'string' },
    { key: 'highlights', type: 'string' },
    { key: 'lookingOnWhite', type: 'boolean' },
    { key: 'bestMove', type: 'string', optional: true },
    { key: 'text', type: 'string', optional: true },
  ],
  'photo-article': [
    { key: 'imageId', type: 'number' },
    { key: 'caption', type: 'string', optional: true },
  ],
  'chess-video': [
    { key: 'videoNumber', type: 'number' },
    { key: 'title', type: 'string', optional: true },
  ],
  video: [
    { key: 'videoId', type: 'string' },
    { key: 'title', type: 'string' },
  ],
  'article-audio': [
    { key: 'audioId', type: 'string' },
    { key: 'title', type: 'string' },
  ],
  smiles: [
    { key: 'smiles', type: 'string' },
    { key: 'title', type: 'string', optional: true },
  ],
  slideshow: [
    { key: 'slideshowNumber', type: 'number' },
    { key: 'title', type: 'string', optional: true },
  ],
  'play-engine': [
    { key: 'fen', type: 'string' },
    { key: 'playWithWhite', type: 'boolean' },
  ],
  dot: [{ key: 'content', type: 'string' }],
  pie: [
    { key: 'name', type: 'string' },
    { key: 'data', type: 'array' },
  ],
  bar: [
    { key: 'name', type: 'string' },
    { key: 'xAxis', type: 'array' },
    { key: 'series', type: 'array' },
  ],
  katex: [{ key: 'content', type: 'string' }],
  tts: [{ key: 'items', type: 'array' }, { key: 'justRead', type: 'boolean', optional: true }],
  quiz: [
    { key: 'question', type: 'string' },
    { key: 'quizType', type: 'string' },
    { key: 'relevantBlockIds', type: 'array', optional: true },
    { key: 'options', type: 'array', optional: true },
    { key: 'sortOptions', type: 'array', optional: true },
    { key: 'fixedCaptions', type: 'array', optional: true },
    { key: 'matchOptions', type: 'array', optional: true },
  ],
};

export function validateContentItemForBlockEditor(item: ContentItemRaw): BlockSchemaValidationResult {
  if (!isRecord(item)) return { valid: false, errors: ['Content item must be an object'] };
  if (typeof item.type !== 'string' || item.type.length === 0) {
    return { valid: false, errors: ['Content item must have a string "type"'] };
  }
  const rules = RULES_BY_TYPE[item.type];
  // Unknown types are valid for transport and will be shown via unknown block.
  if (!rules) return { valid: true, errors: [] };
  return validateRules(item, rules);
}
