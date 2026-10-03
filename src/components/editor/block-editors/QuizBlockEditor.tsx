import BlockWrapper from '../BlockWrapper';
import type { QuizBlock, QuizType, QuizOptionItem, SortOptionItem, FixedCaptionItem, MatchOptionItem } from '../../../types/articleEditor';

/** Shuffle array randomly (Fisher–Yates). Does not mutate keys/order fields, only the order of items in the list. */
function shuffleAnswers<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
import { useTranslation } from 'react-i18next';
import { checkboxFaceClass, type BlockEditorProps } from './blockEditorShared';

export function QuizBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<QuizBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);

  const setQuestion = (question: string) => onUpdate({ ...block, question });
  const setQuizType = (quizType: QuizType) => {
    const base = { ...block, quizType };
    switch (quizType) {
      case 'radio':
      case 'checkbox':
        return onUpdate({ ...base, options: [{ text: '', isCorrect: true }], sortOptions: undefined, fixedCaptions: undefined, matchOptions: undefined });
      case 'sort':
        return onUpdate({ ...base, sortOptions: [{ caption: '', order: 1 }, { caption: '', order: 2 }], options: undefined, fixedCaptions: undefined, matchOptions: undefined });
      case 'match':
        return onUpdate({ ...base, fixedCaptions: [{ caption: '', order: 1 }], matchOptions: [{ caption: '', order: 1 }], options: undefined, sortOptions: undefined });
    }
  };

  const renderRadioCheckOptions = () => {
    const options: QuizOptionItem[] = block.options?.length ? block.options : [{ text: '', isCorrect: true }];
    const setOption = (idx: number, text: string, isCorrect: boolean) =>
      onUpdate({ ...block, options: options.map((o, i) => (i === idx ? { text, isCorrect } : o)) });
    const addOption = () => onUpdate({ ...block, options: [...options, { text: '', isCorrect: false }] });
    const removeOption = (idx: number) => {
      if (options.length <= 1) return;
      onUpdate({ ...block, options: options.filter((_, i) => i !== idx) });
    };
    return (
      <div>
        <span className="mb-2 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizOptions')}</span>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer w-fit group shrink-0">
                <span className="relative inline-flex shrink-0">
                  <input type="checkbox" checked={opt.isCorrect} onChange={(e) => setOption(idx, opt.text, e.target.checked)} className="sr-only peer" />
                  <span className={checkboxFaceClass(opt.isCorrect)} aria-hidden="true">
                    {opt.isCorrect && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--md-sys-color-on-primary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4l3 3 5-6" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizCorrect')}</span>
              </label>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => setOption(idx, e.target.value, opt.isCorrect)}
                placeholder={t('articleEditor.placeholderQuizOption')}
                className="field-filled focus-ring min-w-0 w-auto flex-1"
              />
              {options.length > 1 && (
                <button type="button" onClick={() => removeOption(idx)} className="btn-icon shrink-0" aria-label={t('articleEditor.ariaRemove')}>×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className="btn-tonal mt-2">
          + {t('articleEditor.quizAddOption')}
        </button>
      </div>
    );
  };

  const renderSortOptions = () => {
    const items: SortOptionItem[] = block.sortOptions?.length ? block.sortOptions : [{ caption: '', order: 1 }, { caption: '', order: 2 }];
    const setItem = (idx: number, caption: string, order: number) =>
      onUpdate({ ...block, sortOptions: items.map((o, i) => (i === idx ? { caption, order } : o)) });
    const addItem = () => onUpdate({ ...block, sortOptions: [...items, { caption: '', order: items.length + 1 }] });
    const removeItem = (idx: number) => {
      if (items.length <= 2) return;
      onUpdate({ ...block, sortOptions: items.filter((_, i) => i !== idx) });
    };
    return (
      <div>
        <span className="mb-2 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizSortItems')}</span>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={item.order}
                onChange={(e) => setItem(idx, item.caption, parseInt(e.target.value, 10) || 1)}
                className="field-filled focus-ring w-14 shrink-0 text-center"
                title={t('articleEditor.quizSortOrder')}
              />
              <input
                type="text"
                value={item.caption}
                onChange={(e) => setItem(idx, e.target.value, item.order)}
                placeholder={t('articleEditor.placeholderSortCaption')}
                className="field-filled focus-ring min-w-0 w-auto flex-1"
              />
              {items.length > 2 && (
                <button type="button" onClick={() => removeItem(idx)} className="btn-icon shrink-0" aria-label={t('articleEditor.ariaRemove')}>×</button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={addItem} className="btn-tonal">
            + {t('articleEditor.quizAddOption')}
          </button>
          <button type="button" onClick={() => onUpdate({ ...block, sortOptions: shuffleAnswers(items) })} className="btn-text" title={t('articleEditor.quizShuffleAnswers')}>
            {t('articleEditor.quizShuffleAnswers')}
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizSortHint')}</p>
      </div>
    );
  };

  const renderMatchOptions = () => {
    const fixed: FixedCaptionItem[] = block.fixedCaptions?.length ? block.fixedCaptions : [{ caption: '', order: 1 }];
    const match: MatchOptionItem[] = block.matchOptions?.length ? block.matchOptions : [{ caption: '', order: 1 }];

    const setFixed = (idx: number, caption: string, order: number) =>
      onUpdate({ ...block, fixedCaptions: fixed.map((o, i) => (i === idx ? { caption, order } : o)) });
    const setMatch = (idx: number, caption: string, order: number) =>
      onUpdate({ ...block, matchOptions: match.map((o, i) => (i === idx ? { caption, order } : o)) });
    const addPair = () => {
      const nextOrder = Math.max(...fixed.map((o) => o.order), 0) + 1;
      onUpdate({ ...block, fixedCaptions: [...fixed, { caption: '', order: nextOrder }], matchOptions: [...match, { caption: '', order: nextOrder }] });
    };
    const removePair = (idx: number) => {
      if (fixed.length <= 1) return;
      onUpdate({ ...block, fixedCaptions: fixed.filter((_, i) => i !== idx), matchOptions: match.filter((_, i) => i !== idx) });
    };

    return (
      <div className="space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <span className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizMatchFixed')}</span>
            <div className="space-y-2">
              {fixed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.order}
                    onChange={(e) => {
                      const order = parseInt(e.target.value, 10) || 1;
                      setFixed(idx, item.caption, order);
                      setMatch(idx, match[idx]?.caption ?? '', order);
                    }}
                    className="field-filled focus-ring w-12 shrink-0 text-center"
                    title={t('articleEditor.quizMatchOrder')}
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => setFixed(idx, e.target.value, item.order)}
                    placeholder={t('articleEditor.placeholderMatchFixed')}
                    className="field-filled focus-ring min-w-0 w-auto flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizMatchOptions')}</span>
            <div className="space-y-2">
              {match.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => setMatch(idx, e.target.value, item.order)}
                    placeholder={t('articleEditor.placeholderMatchOption')}
                    className="field-filled focus-ring min-w-0 w-auto flex-1"
                  />
                  {fixed.length > 1 && (
                    <button type="button" onClick={() => removePair(idx)} className="btn-icon shrink-0" aria-label={t('articleEditor.ariaRemove')}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addPair} className="btn-tonal">
            + {t('articleEditor.quizAddPair')}
          </button>
          <button type="button" onClick={() => onUpdate({ ...block, matchOptions: shuffleAnswers(match) })} className="btn-text" title={t('articleEditor.quizShuffleAnswers')}>
            {t('articleEditor.quizShuffleAnswers')}
          </button>
        </div>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizMatchHint')}</p>
      </div>
    );
  };

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockQuiz')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizQuestion')}</label>
          <input
            type="text"
            value={block.question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('articleEditor.placeholderQuizQuestion')}
            className="field-filled focus-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizRelevantBlockIds')}</label>
          <input
            type="text"
            value={(block.relevantBlockIds ?? []).join(', ')}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
              onUpdate({ ...block, relevantBlockIds: ids.length ? ids : undefined });
            }}
            placeholder={t('articleEditor.quizRelevantBlockIdsPlaceholder')}
            className="field-filled focus-ring"
          />
          <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizRelevantBlockIdsHint')}</p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">{t('articleEditor.quizType')}</span>
          <select
            value={block.quizType ?? 'radio'}
            onChange={(e) => setQuizType(e.target.value as QuizType)}
            className="field-filled focus-ring w-52"
          >
            <option value="radio">{t('articleEditor.quizTypeRadio')}</option>
            <option value="checkbox">{t('articleEditor.quizTypeCheckbox')}</option>
            <option value="sort">{t('articleEditor.quizTypeSort')}</option>
            <option value="match">{t('articleEditor.quizTypeMatch')}</option>
          </select>
        </div>

        {(block.quizType === 'radio' || block.quizType === 'checkbox') && renderRadioCheckOptions()}
        {block.quizType === 'sort' && renderSortOptions()}
        {block.quizType === 'match' && renderMatchOptions()}
      </div>
    </BlockWrapper>
  );
}
