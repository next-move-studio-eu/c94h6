/**
 * Validation for article editor state / blocks. Used e.g. when parsing ZIP or before publish.
 * Returns list of human-readable error messages.
 */
import type { EditorBlock, QuizBlock, EditorState } from '../types/articleEditor';
import type { ContentItem } from '../types/articleContent';
import {
  blocksToContentJson,
  extractArticleVideoIdsFromContent,
  extractArticleAudioIdsFromContent,
  extractChessVideoIdsFromContent,
  extractSlideshowIdsFromContent,
} from './articleContentJson';

/**
 * Validate a single quiz block. Rules vary by quizType:
 * - radio     : 1+ options, exactly 1 correct
 * - checkbox  : 1+ options, 1+ correct
 * - sort      : 2+ sortOptions with unique order values
 * - match     : 1+ fixedCaptions and same count of matchOptions, matching order sets
 */
export function validateQuizBlock(block: QuizBlock): string[] {
  const errors: string[] = [];

  switch (block.quizType) {
    case 'radio': {
      const options = block.options ?? [];
      if (options.length === 0) {
        errors.push('Radio quiz must have at least one option');
        break;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) errors.push('Radio quiz must have exactly one correct answer');
      if (correctCount > 1) errors.push('Radio quiz must have exactly one correct answer (use checkbox for multiple)');
      break;
    }

    case 'checkbox': {
      const options = block.options ?? [];
      if (options.length === 0) {
        errors.push('Checkbox quiz must have at least one option');
        break;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) errors.push('Checkbox quiz must have at least one correct answer');
      break;
    }

    case 'sort': {
      const items = block.sortOptions ?? [];
      if (items.length < 2) {
        errors.push('Sort quiz must have at least 2 items');
        break;
      }
      const orders = items.map((o) => o.order);
      if (new Set(orders).size !== orders.length) errors.push('Sort quiz items must have unique order values');
      break;
    }

    case 'match': {
      const fixed = block.fixedCaptions ?? [];
      const match = block.matchOptions ?? [];
      if (fixed.length === 0) errors.push('Match quiz must have at least one FixedCaption');
      if (match.length === 0) errors.push('Match quiz must have at least one MatchOption');
      if (fixed.length > 0 && match.length > 0 && fixed.length !== match.length) {
        errors.push('Match quiz: FixedCaption count must equal MatchOption count');
      }
      if (fixed.length > 0 && match.length > 0 && fixed.length === match.length) {
        const fixedOrders = fixed.map((o) => o.order).sort((a, b) => a - b);
        const matchOrders = match.map((o) => o.order).sort((a, b) => a - b);
        if (JSON.stringify(fixedOrders) !== JSON.stringify(matchOrders)) {
          errors.push('Match quiz: FixedCaption and MatchOption order values must match');
        }
      }
      break;
    }
  }

  return errors;
}

/**
 * Validate all blocks. Returns a flat list of error messages.
 */
export function validateArticleBlocks(blocks: EditorBlock[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'quiz') {
      const quizErrors = validateQuizBlock(block as QuizBlock);
      for (const msg of quizErrors) {
        errors.push(`Block ${i + 1} (Quiz): ${msg}`);
      }
    }
    if (block.type === 'smiles' && !(block.smiles ?? '').trim()) {
      errors.push(`Block ${i + 1} (SMILES): SMILES string is required.`);
    }
  }
  return errors;
}

const VALID_ARTICLE_CONTENT = ['NORMAL', 'NEWS', 'TRAINING', 'INVITATION'];

/**
 * Full article validation: blocks + asset vs MDX reference consistency.
 */
export function validateArticle(state: EditorState): string[] {
  const errors = validateArticleBlocks(state.blocks);
  const ac = state.info?.articleContent;
  if (!ac || !VALID_ARTICLE_CONTENT.includes(ac)) {
    errors.push('Article content type is required (NORMAL, NEWS, TRAINING, or INVITATION).');
  }
  const content: ContentItem[] = state.content?.length
    ? (state.content as ContentItem[])
    : blocksToContentJson(state.blocks).content;

  const articleVideoIds = Object.keys(state.assets.articleVideos).map(Number).filter((n) => !Number.isNaN(n));
  const refArticleVideo = extractArticleVideoIdsFromContent(content);
  for (const id of articleVideoIds) {
    if (!refArticleVideo.includes(id)) {
      errors.push(`Article video video${id}.webm is not referenced by any type "video" item in the content.`);
    }
  }
  for (const id of refArticleVideo) {
    if (!articleVideoIds.includes(id)) {
      errors.push(`Content references article video ${id} but video${id}.webm is not in assets.`);
    }
  }

  const chessVideoIds = Object.keys(state.assets.chessVideos).map(Number).filter((n) => !Number.isNaN(n));
  const refChessVideo = extractChessVideoIdsFromContent(content);
  for (const id of chessVideoIds) {
    if (!refChessVideo.includes(id)) {
      errors.push(`Chess video chessvideo${id}.zip is not referenced by any chess-video item in the content.`);
    }
  }
  for (const id of refChessVideo) {
    if (!chessVideoIds.includes(id)) {
      errors.push(`Content references chess video ${id} but chessvideo${id}.zip is not in assets.`);
    }
  }

  const slideshowIds = Object.keys(state.assets.slideshows).map(Number).filter((n) => !Number.isNaN(n));
  const refSlideshow = extractSlideshowIdsFromContent(content);
  for (const id of slideshowIds) {
    if (!refSlideshow.includes(id)) {
      errors.push(`Slideshow slideshow${id}.zip is not referenced by any slideshow item in the content.`);
    }
  }
  for (const id of refSlideshow) {
    if (!slideshowIds.includes(id)) {
      errors.push(`Content references slideshow ${id} but slideshow${id}.zip is not in assets.`);
    }
  }

  const articleAudioIds = Object.keys(state.assets.articleAudios).map(Number).filter((n) => !Number.isNaN(n));
  const refArticleAudio = extractArticleAudioIdsFromContent(content);
  for (const id of articleAudioIds) {
    if (!refArticleAudio.includes(id)) {
      errors.push(`Article audio audio${id}.webm is not referenced by any article-audio item in the content.`);
    }
  }
  for (const id of refArticleAudio) {
    if (!articleAudioIds.includes(id)) {
      errors.push(`Content references article audio ${id} but audio${id}.webm is not in assets.`);
    }
  }

  return errors;
}
