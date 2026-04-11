import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
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
import { type BlockEditorProps } from './blockEditorShared';

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
        <span className="mb-2 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizOptions')}</span>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer w-fit group shrink-0">
                <span className="relative inline-flex shrink-0">
                  <input type="checkbox" checked={opt.isCorrect} onChange={(e) => setOption(idx, opt.text, e.target.checked)} className="sr-only peer" />
                  <span
                    className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-[var(--primary)] ${opt.isCorrect ? 'border-[var(--primary)]' : 'border-[var(--border)] group-hover:border-[var(--primary)]'}`}
                    style={{ backgroundColor: opt.isCorrect ? 'var(--primary)' : 'var(--bg)' }}
                    aria-hidden="true"
                  >
                    {opt.isCorrect && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--onPrimary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4l3 3 5-6" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-xs text-[var(--textSecondary)]">{t('articleEditor.quizCorrect')}</span>
              </label>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => setOption(idx, e.target.value, opt.isCorrect)}
                placeholder={t('articleEditor.placeholderQuizOption')}
                className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
              {options.length > 1 && (
                <button type="button" onClick={() => removeOption(idx)} className="shrink-0 rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)]" aria-label={t('articleEditor.ariaRemove')}>×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className="mt-2 rounded border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--textSecondary)] hover:border-[var(--primary)] hover:text-[var(--text)]">
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
        <span className="mb-2 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizSortItems')}</span>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={item.order}
                onChange={(e) => setItem(idx, item.caption, parseInt(e.target.value, 10) || 1)}
                className="w-14 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-center text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                title={t('articleEditor.quizSortOrder')}
              />
              <input
                type="text"
                value={item.caption}
                onChange={(e) => setItem(idx, e.target.value, item.order)}
                placeholder={t('articleEditor.placeholderSortCaption')}
                className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
              {items.length > 2 && (
                <button type="button" onClick={() => removeItem(idx)} className="shrink-0 rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)]" aria-label={t('articleEditor.ariaRemove')}>×</button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={addItem} className="rounded border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--textSecondary)] hover:border-[var(--primary)] hover:text-[var(--text)]">
            + {t('articleEditor.quizAddOption')}
          </button>
          <button type="button" onClick={() => onUpdate({ ...block, sortOptions: shuffleAnswers(items) })} className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--textSecondary)] hover:border-[var(--primary)] hover:text-[var(--text)]" title={t('articleEditor.quizShuffleAnswers')}>
            {t('articleEditor.quizShuffleAnswers')}
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--textSecondary)]">{t('articleEditor.quizSortHint')}</p>
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
            <span className="mb-1 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizMatchFixed')}</span>
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
                    className="w-12 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-center text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                    title={t('articleEditor.quizMatchOrder')}
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => setFixed(idx, e.target.value, item.order)}
                    placeholder={t('articleEditor.placeholderMatchFixed')}
                    className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizMatchOptions')}</span>
            <div className="space-y-2">
              {match.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => setMatch(idx, e.target.value, item.order)}
                    placeholder={t('articleEditor.placeholderMatchOption')}
                    className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                  {fixed.length > 1 && (
                    <button type="button" onClick={() => removePair(idx)} className="shrink-0 rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)]" aria-label={t('articleEditor.ariaRemove')}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addPair} className="rounded border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--textSecondary)] hover:border-[var(--primary)] hover:text-[var(--text)]">
            + {t('articleEditor.quizAddPair')}
          </button>
          <button type="button" onClick={() => onUpdate({ ...block, matchOptions: shuffleAnswers(match) })} className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--textSecondary)] hover:border-[var(--primary)] hover:text-[var(--text)]" title={t('articleEditor.quizShuffleAnswers')}>
            {t('articleEditor.quizShuffleAnswers')}
          </button>
        </div>
        <p className="text-xs text-[var(--textSecondary)]">{t('articleEditor.quizMatchHint')}</p>
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
          <label className="mb-1 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizQuestion')}</label>
          <input
            type="text"
            value={block.question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('articleEditor.placeholderQuizQuestion')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizRelevantBlockIds')}</label>
          <input
            type="text"
            value={(block.relevantBlockIds ?? []).join(', ')}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
              onUpdate({ ...block, relevantBlockIds: ids.length ? ids : undefined });
            }}
            placeholder={t('articleEditor.quizRelevantBlockIdsPlaceholder')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[var(--textSecondary)]">{t('articleEditor.quizRelevantBlockIdsHint')}</p>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-[var(--textSecondary)]">{t('articleEditor.quizType')}</span>
          <Select
            value={block.quizType ?? 'radio'}
            onChange={(v) => setQuizType(v as QuizType)}
            options={[
              { value: 'radio', label: t('articleEditor.quizTypeRadio') },
              { value: 'checkbox', label: t('articleEditor.quizTypeCheckbox') },
              { value: 'sort', label: t('articleEditor.quizTypeSort') },
              { value: 'match', label: t('articleEditor.quizTypeMatch') },
            ]}
            variant="editor"
            className="w-52"
          />
        </div>

        {(block.quizType === 'radio' || block.quizType === 'checkbox') && renderRadioCheckOptions()}
        {block.quizType === 'sort' && renderSortOptions()}
        {block.quizType === 'match' && renderMatchOptions()}
      </div>
    </BlockWrapper>
  );
}
