/**
 * Validates a content array (content.json).
 * Returns a list of error messages; empty array means valid.
 */
import { CONTENT_ITEM_TYPES } from '../types/articleContent';

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function isNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

function isArray(x: unknown): x is unknown[] {
  return Array.isArray(x);
}

export function validateFormatContent(input: unknown): string[] {
  const errors: string[] = [];
  if (!isArray(input)) {
    return ['Root must be a JSON array.'];
  }
  const arr = input as unknown[];
  arr.forEach((item, index) => {
    const prefix = `Item ${index + 1}: `;
    if (!isObject(item)) {
      errors.push(prefix + 'Must be an object.');
      return;
    }
    const type = item.type;
    if (!isString(type) || type === '') {
      errors.push(prefix + 'Missing or invalid "type" field.');
      return;
    }
    if (!CONTENT_ITEM_TYPES.includes(type as (typeof CONTENT_ITEM_TYPES)[number])) {
      errors.push(prefix + `Unknown type "${type}". Known types: ${CONTENT_ITEM_TYPES.join(', ')}.`);
    }
    switch (type) {
      case 'markdown':
        if (!('content' in item) || !isString(item.content)) errors.push(prefix + 'markdown requires string "content".');
        break;
      case 'accordion':
        if (!isString(item.title)) errors.push(prefix + 'accordion requires string "title".');
        if (!isString(item.accordionType)) errors.push(prefix + 'accordion requires string "accordionType".');
        if (!isString(item.body)) errors.push(prefix + 'accordion requires string "body".');
        break;
      case 'chess-diagram':
        if (!isString(item.fen)) errors.push(prefix + 'chess-diagram requires string "fen".');
        if (!('highlights' in item) || !isString(item.highlights)) errors.push(prefix + 'chess-diagram requires string "highlights".');
        if (!isBoolean(item.lookingOnWhite)) errors.push(prefix + 'chess-diagram requires boolean "lookingOnWhite".');
        break;
      case 'photo-article':
        if (!isNumber(item.imageId)) errors.push(prefix + 'photo-article requires number "imageId".');
        break;
      case 'chess-video':
        if (!isNumber(item.videoNumber)) errors.push(prefix + 'chess-video requires number "videoNumber".');
        break;
      case 'video':
        if (!isString(item.videoId)) errors.push(prefix + 'video requires string "videoId".');
        if (!isString(item.title)) errors.push(prefix + 'video requires string "title".');
        break;
      case 'slideshow':
        if (!isNumber(item.slideshowNumber)) errors.push(prefix + 'slideshow requires number "slideshowNumber".');
        break;
      case 'play-engine':
        if (!isString(item.fen)) errors.push(prefix + 'play-engine requires string "fen".');
        if (!isBoolean(item.playWithWhite)) errors.push(prefix + 'play-engine requires boolean "playWithWhite".');
        break;
      case 'dot':
        if (!('content' in item) || !isString(item.content)) errors.push(prefix + 'dot requires string "content" (Graphviz DOT source).');
        break;
      case 'quiz':
        if (!isString(item.question)) errors.push(prefix + 'quiz requires string "question".');
        if (!isString(item.quizType)) errors.push(prefix + 'quiz requires string "quizType".');
        const qt = item.quizType;
        if (qt && !['radio', 'checkbox', 'sort', 'match'].includes(qt as string)) {
          errors.push(prefix + 'quizType must be one of: radio, checkbox, sort, match.');
        }
        break;
      default:
        break;
    }
  });
  return errors;
}
