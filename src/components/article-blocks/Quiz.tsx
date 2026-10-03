import React, { useId, useState, useCallback, isValidElement, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Frown, Info, Loader2, GripVertical, Link2, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useArticleContent } from '../../contexts/ArticleContentContext';

// ---------------------------------------------------------------------------
// Shared styling helper
// ---------------------------------------------------------------------------

const themeVar = (token: string) => `var(--${token})`;

// ---------------------------------------------------------------------------
// Option sub-components (data carriers; Quiz reads their props via React.Children)
// ---------------------------------------------------------------------------

export interface RadioOptionProps {
  text?: string;
  isCorrect?: boolean;
  isCorrectEncrypted?: string | null;
}

export interface CheckOptionProps {
  text?: string;
  isCorrect?: boolean;
  isCorrectEncrypted?: string | null;
}

export interface SortOptionProps {
  caption?: string;
  order?: number;
  orderEncrypted?: string | null;
}

export interface FixedCaptionProps {
  caption?: string;
  order?: number;
}

export interface MatchOptionProps {
  caption?: string;
  order?: number;
  orderEncrypted?: string | null;
}

export function RadioOption(_props: RadioOptionProps) { return null; }
export function CheckOption(_props: CheckOptionProps) { return null; }
export function SortOption(_props: SortOptionProps) { return null; }
export function FixedCaption(_props: FixedCaptionProps) { return null; }
export function MatchOption(_props: MatchOptionProps) { return null; }

RadioOption.displayName = 'RadioOption';
CheckOption.displayName = 'CheckOption';
SortOption.displayName = 'SortOption';
FixedCaption.displayName = 'FixedCaption';
MatchOption.displayName = 'MatchOption';

// ---------------------------------------------------------------------------
// Helper: detect component by displayName (robust across MDX component maps)
// ---------------------------------------------------------------------------

function isDisplayName(child: React.ReactNode, name: string): boolean {
  if (!isValidElement(child)) return false;
  const t = child.type as { displayName?: string };
  return t?.displayName === name;
}

function getProps<T>(child: React.ReactNode): T {
  return (child as ReactElement<T>).props;
}

// ---------------------------------------------------------------------------
// Sub-renderers per quiz type
// ---------------------------------------------------------------------------

type QuizResult = 'correct' | 'incorrect' | 'already' | null;

interface RadioCheckQuizProps {
  inputType: 'radio' | 'checkbox';
  items: { text: string; encrypted: string | null }[];
  result: QuizResult;
  isSubmitting: boolean;
  onSubmit: (selected: boolean[]) => void;
  submitLabel: string;
  /** When set (after submit), show correct options as checked and disable inputs */
  correctAnswers?: string[] | null;
}

function RadioCheckQuiz({ inputType, items, result, isSubmitting, onSubmit, submitLabel, correctAnswers }: RadioCheckQuizProps) {
  const name = useId();
  const [selected, setSelected] = useState<boolean[]>(() => items.map(() => false));
  const revealed = result != null && correctAnswers != null && correctAnswers.length === items.length;
  const checked = revealed ? items.map((_, idx) => correctAnswers![idx] === 'true') : selected;

  const toggle = (idx: number) => {
    if (result != null || isSubmitting) return;
    if (inputType === 'radio') {
      setSelected(items.map((_, i) => i === idx));
    } else {
      setSelected((prev) => prev.map((v, i) => (i === idx ? !v : v)));
    }
  };

  const isRadio = inputType === 'radio';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2" aria-disabled={result != null || isSubmitting}>
        {items.map((item, idx) => {
          const id = `${name}-${idx}`;
          const isChecked = checked[idx];
          return (
            <label key={idx} htmlFor={id} className={`flex items-center gap-2 w-fit group ${result == null && !isSubmitting ? 'cursor-pointer' : 'cursor-default'}`} style={{ color: themeVar('text') }}>
              <span className="relative inline-flex shrink-0">
                <input id={id} type={inputType} name={isRadio ? name : undefined} checked={isChecked} onChange={() => toggle(idx)} disabled={result != null || isSubmitting} className="sr-only peer" />
                <span
                  className={`w-3.5 h-3.5 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 ${isRadio ? 'rounded-full border-2' : 'rounded border-2'}`}
                  style={{
                    borderColor: isChecked ? themeVar('primary') : themeVar('border'),
                    backgroundColor: isChecked ? themeVar('primary') : themeVar('bg'),
                    outlineColor: 'var(--md-sys-color-outline)',
                  }}
                  aria-hidden="true"
                >
                  {isChecked && (isRadio ? (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeVar('onPrimary') }} />
                  ) : (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: themeVar('onPrimary') }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4l3 3 5-6" />
                    </svg>
                  ))}
                </span>
              </span>
              <span className="text-sm">{item.text}</span>
            </label>
          );
        })}
      </div>
      {result == null && (
        <button
          type="button"
          onClick={() => onSubmit(selected)}
          disabled={isSubmitting || (isRadio && !selected.some(Boolean))}
          className="btn-filled"
        >
          {isSubmitting ? '…' : submitLabel}
        </button>
      )}
    </div>
  );
}


interface SortQuizProps {
  items: { caption: string; encrypted: string | null }[];
  result: QuizResult;
  isSubmitting: boolean;
  onSubmit: (userOrder: number[]) => void;
  submitLabel: string;
  /** When set (after submit), display items in this order (indices into items) */
  correctOrder?: number[] | null;
}

const SORT_ROW_ATTR = 'data-quiz-sort-position';
const MATCH_RIGHT_ROW_ATTR = 'data-quiz-match-right-position';

function getSortPosition(el: Element | null): number | null {
  const row = el?.closest(`[${SORT_ROW_ATTR}]`);
  if (!row) return null;
  const raw = row.getAttribute(SORT_ROW_ATTR);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function getMatchRightPosition(el: Element | null): number | null {
  const row = el?.closest(`[${MATCH_RIGHT_ROW_ATTR}]`);
  if (!row) return null;
  const raw = row.getAttribute(MATCH_RIGHT_ROW_ATTR);
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function SortQuiz({ items: initialItems, result, isSubmitting, onSubmit, submitLabel, correctOrder }: SortQuizProps) {
  const { t } = useTranslation('articleBlocks');
  const [order, setOrder] = useState<number[]>(() => initialItems.map((_, i) => i));
  const [dragging, setDragging] = useState<number | null>(null);
  const draggingRef = React.useRef<number | null>(null);
  const revealed = result != null && correctOrder != null && correctOrder.length === initialItems.length;
  const displayOrder = revealed ? correctOrder! : order;

  const moveItem = React.useCallback((fromIdx: number, toIdx: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  }, []);

  React.useEffect(() => { draggingRef.current = dragging; }, [dragging]);

  const canDrag = result == null && !isSubmitting;

  const handlePointerDown = React.useCallback((e: React.PointerEvent, posIdx: number) => {
    if (!canDrag || e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDragging(posIdx);
    draggingRef.current = posIdx;

    const onPointerMove = (ev: PointerEvent) => {
      const toIdx = getSortPosition(document.elementFromPoint(ev.clientX, ev.clientY));
      if (toIdx == null) return;
      const fromIdx = draggingRef.current;
      if (fromIdx !== null && fromIdx !== toIdx) {
        moveItem(fromIdx, toIdx);
        draggingRef.current = toIdx;
        setDragging(toIdx);
      }
    };

    const onPointerUp = () => {
      target.releasePointerCapture(e.pointerId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      setDragging(null);
      draggingRef.current = null;
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }, [canDrag, moveItem]);

  const moveUp = (idx: number) => { if (idx > 0) moveItem(idx, idx - 1); };
  const moveDown = (idx: number) => { if (idx < order.length - 1) moveItem(idx, idx + 1); };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        {displayOrder.map((itemIdx, posIdx) => {
          const item = initialItems[itemIdx];
          return (
            <div
              key={itemIdx}
              data-quiz-sort-position={posIdx}
              className={`surface-container-highest flex select-none items-center gap-2 rounded-lg px-3 py-2 text-sm ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-70'} ${dragging === posIdx ? 'opacity-50' : ''}`}
            >
              {canDrag ? (
                <span
                  className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 -m-0.5"
                  onPointerDown={(e) => handlePointerDown(e, posIdx)}
                  aria-hidden
                >
                  <GripVertical className="w-4 h-4 opacity-40" />
                </span>
              ) : (
                <GripVertical className="w-4 h-4 shrink-0 opacity-40" />
              )}
              <span className="flex-1 min-w-0">{item.caption}</span>
              {canDrag && (
                <span className="flex flex-col gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveUp(posIdx)} disabled={posIdx === 0} className="text-xs leading-none opacity-60 hover:opacity-100 disabled:opacity-20" aria-label={t('quiz.moveUpAria')}>▲</button>
                  <button type="button" onClick={() => moveDown(posIdx)} disabled={posIdx === order.length - 1} className="text-xs leading-none opacity-60 hover:opacity-100 disabled:opacity-20" aria-label={t('quiz.moveDownAria')}>▼</button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {result == null && (
        <button
          type="button"
          onClick={() => onSubmit(initialItems.map((_, idx) => order.indexOf(idx) + 1))}
          disabled={isSubmitting}
          className="btn-filled"
        >
          {isSubmitting ? '…' : submitLabel}
        </button>
      )}
    </div>
  );
}

interface MatchQuizProps {
  fixedItems: { caption: string; order: number }[];
  matchItems: { caption: string; encrypted: string | null; order: number }[];
  result: QuizResult;
  isSubmitting: boolean;
  onSubmit: (userMatching: { encrypted: string | null; matchedOrder: number }[], rightOrder?: number[]) => void;
  submitLabel: string;
  /** When set (after submit), show correct assignment: correctAnswers[i] = fixed order for match item i */
  correctAnswers?: string[] | null;
}

function MatchQuiz({ fixedItems, matchItems, result, isSubmitting, onSubmit, submitLabel, correctAnswers }: MatchQuizProps) {
  const { t } = useTranslation('articleBlocks');
  const [rightOrder, setRightOrder] = useState<number[]>(() => matchItems.map((_, i) => i));
  const [dragging, setDragging] = useState<number | null>(null);
  const draggingRef = React.useRef<number | null>(null);
  const revealed = result != null && correctAnswers != null && correctAnswers.length === matchItems.length;
  const sortedFixed = [...fixedItems].sort((a, b) => a.order - b.order);
  const n = sortedFixed.length;

  const moveItem = React.useCallback((fromIdx: number, toIdx: number) => {
    setRightOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  }, []);

  React.useEffect(() => { draggingRef.current = dragging; }, [dragging]);

  const canDrag = result == null && !isSubmitting && !revealed;

  const handlePointerDown = React.useCallback((e: React.PointerEvent, posIdx: number) => {
    if (!canDrag || e.button !== 0) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDragging(posIdx);
    draggingRef.current = posIdx;

    const onPointerMove = (ev: PointerEvent) => {
      const toIdx = getMatchRightPosition(document.elementFromPoint(ev.clientX, ev.clientY));
      if (toIdx == null) return;
      const fromIdx = draggingRef.current;
      if (fromIdx !== null && fromIdx !== toIdx) {
        moveItem(fromIdx, toIdx);
        draggingRef.current = toIdx;
        setDragging(toIdx);
      }
    };

    const onPointerUp = () => {
      target.releasePointerCapture(e.pointerId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      setDragging(null);
      draggingRef.current = null;
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }, [canDrag, moveItem]);

  const moveUp = (idx: number) => { if (idx > 0) moveItem(idx, idx - 1); };
  const moveDown = (idx: number) => { if (idx < rightOrder.length - 1) moveItem(idx, idx + 1); };

  const correctRightOrder = revealed && correctAnswers != null && correctAnswers.length === n
    ? sortedFixed.map((_, p) => matchItems.findIndex((m) => m.order === parseInt(correctAnswers![p], 10)))
    : sortedFixed.map((f) => matchItems.findIndex((m) => m.order === f.order));
  const effectiveRightOrder = revealed && correctRightOrder.every((i) => i >= 0)
    ? correctRightOrder
    : rightOrder;

  const rowMinHeight = '2.75rem';

  return (
    <div className="space-y-3">
      <div className="grid gap-2 items-stretch" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <div className="flex flex-col gap-1 min-w-0">
          {sortedFixed.map((f) => (
            <div
              key={f.order}
              className="surface-container-highest flex min-h-[var(--match-row-height)] items-center rounded-lg px-3 py-2 text-sm"
              style={{ minHeight: rowMinHeight }}
            >
              <span className="font-medium break-words">{f.caption}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center gap-1 py-0" aria-hidden style={{ minHeight: rowMinHeight }}>
          {sortedFixed.map((_, i) => (
            <div key={i} className="flex items-center justify-center" style={{ minHeight: rowMinHeight }}>
              <Link2 className="w-4 h-4 opacity-40 shrink-0" style={{ color: themeVar('text') }} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 min-w-0" style={{ ['--match-row-height' as string]: rowMinHeight }}>
          {effectiveRightOrder.map((itemIdx, posIdx) => {
            const item = matchItems[itemIdx];
            if (!item) return null;
            return (
              <motion.div
                key={`${itemIdx}-${posIdx}`}
                layout
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                data-quiz-match-right-position={posIdx}
                className={`surface-container-highest flex min-h-[var(--match-row-height)] select-none items-center gap-2 rounded-lg px-3 py-2 text-sm ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-70'} ${dragging === posIdx ? 'opacity-50' : ''}`}
                style={{ minHeight: rowMinHeight }}
              >
                {canDrag ? (
                  <span
                    className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 -m-0.5"
                    onPointerDown={(e) => handlePointerDown(e, posIdx)}
                    aria-hidden
                  >
                    <GripVertical className="w-4 h-4 opacity-40" />
                  </span>
                ) : (
                  <GripVertical className="w-4 h-4 shrink-0 opacity-40" />
                )}
                <span className="flex-1 min-w-0 break-words">{item.caption}</span>
                {canDrag && (
                  <span className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveUp(posIdx)} disabled={posIdx === 0} className="text-xs leading-none opacity-60 hover:opacity-100 disabled:opacity-20" aria-label={t('quiz.moveUpAria')}>▲</button>
                    <button type="button" onClick={() => moveDown(posIdx)} disabled={posIdx === rightOrder.length - 1} className="text-xs leading-none opacity-60 hover:opacity-100 disabled:opacity-20" aria-label={t('quiz.moveDownAria')}>▼</button>
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      {result == null && (
        <button
          type="button"
          onClick={() => onSubmit(sortedFixed.map((f, p) => ({ encrypted: matchItems[rightOrder[p]].encrypted, matchedOrder: f.order })), rightOrder)}
          disabled={isSubmitting}
          className="btn-filled"
        >
          {isSubmitting ? '…' : submitLabel}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Quiz component
// ---------------------------------------------------------------------------

export interface QuizProps {
  question: string;
  /** Production progress tracker id; injected by backend on publish. */
  quizId?: number | null;
  /** Frame background token: 'surfaceHigh' (default) or 'surface'. */
  quizFrameBackground?: 'surface' | 'surfaceHigh';
  children?: React.ReactNode;
}

export default function Quiz({ question, quizId, quizFrameBackground = 'surfaceHigh', children }: QuizProps) {
  const { t } = useTranslation('articleBlocks');
  const articleContext = useArticleContent();
  const articleId = articleContext?.articleId ?? null;

  const isVerifiable = quizId != null && articleId != null;

  const initialAlreadyAnswered = quizId != null && (articleContext?.answeredQuizIds?.has(quizId) ?? false);
  const [result, setResult] = useState<QuizResult>(initialAlreadyAnswered ? 'already' : null);

  // Sync to "already" when answeredQuizIds loads (e.g. after fetch completes) and contains this quiz
  React.useEffect(() => {
    if (result !== null || quizId == null) return;
    if (articleContext?.answeredQuizIds?.has(quizId)) setResult('already');
  }, [articleContext?.answeredQuizIds, quizId, result]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<string[] | null>(null);

  // ---------------------------------------------------------------------------
  // Parse children into typed lists
  // ---------------------------------------------------------------------------

  const childArray = React.Children.toArray(children);

  const radioOptions = childArray.filter((c) => isDisplayName(c, 'RadioOption')).map((c) => getProps<RadioOptionProps>(c));
  const checkOptions = childArray.filter((c) => isDisplayName(c, 'CheckOption')).map((c) => getProps<CheckOptionProps>(c));
  const sortChildren = childArray.filter((c) => isDisplayName(c, 'SortOption')).map((c) => getProps<SortOptionProps>(c));
  const fixedCaptionChildren = childArray.filter((c) => isDisplayName(c, 'FixedCaption')).map((c) => getProps<FixedCaptionProps>(c));
  const matchOptionChildren = childArray.filter((c) => isDisplayName(c, 'MatchOption')).map((c) => getProps<MatchOptionProps>(c));

  const quizType =
    radioOptions.length > 0 ? 'radio'
    : checkOptions.length > 0 ? 'checkbox'
    : sortChildren.length > 0 ? 'sort'
    : (fixedCaptionChildren.length > 0 || matchOptionChildren.length > 0) ? 'match'
    : 'radio';

  // ---------------------------------------------------------------------------
  // Generic submit handler
  // ---------------------------------------------------------------------------

  const submitAnswers = useCallback(async (answers: { encrypted_token: string; user_answer: string }[]) => {
    if (!isVerifiable || isSubmitting || result != null) return;
    if (answers.some((a) => !a.encrypted_token)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quiz/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: parseInt(articleId!, 10),
          quiz_id: quizId,
          answers,
        }),
      });

      if (res.status === 409) { setResult('already'); return; }
      if (!res.ok) return;

      const data: { correct: boolean; correct_answers?: string[] } = await res.json();
      setResult(data.correct ? 'correct' : 'incorrect');
      if (data.correct_answers) {
        setCorrectAnswers(data.correct_answers);
      }
    } catch {
      // Network error — allow retry
    } finally {
      setIsSubmitting(false);
    }
  }, [isVerifiable, isSubmitting, result, articleId, quizId]);

  // ---------------------------------------------------------------------------
  // Type-specific submit wrappers
  // ---------------------------------------------------------------------------

  const handleRadioCheckSubmit = (selected: boolean[]) => {
    const items = quizType === 'radio' ? radioOptions : checkOptions;
    if (!isVerifiable) {
      const correct = items.every((item, idx) => (item.isCorrect === true) === selected[idx]);
      setCorrectAnswers(items.map((o) => (o.isCorrect ? 'true' : 'false')));
      setResult(correct ? 'correct' : 'incorrect');
      return;
    }
    const answers = items.map((item, idx) => ({
      encrypted_token: item.isCorrectEncrypted ?? '',
      user_answer: selected[idx] ? 'true' : 'false',
    }));
    submitAnswers(answers);
  };

  const handleSortSubmit = (userOrder: number[]) => {
    if (!isVerifiable) {
      const expected = sortChildren.map((o) => String(o.order ?? 0));
      const correct = expected.every((exp, idx) => String(userOrder[idx]) === exp);
      setCorrectAnswers(expected);
      setResult(correct ? 'correct' : 'incorrect');
      return;
    }
    const answers = sortChildren.map((item, idx) => ({
      encrypted_token: item.orderEncrypted ?? '',
      user_answer: String(userOrder[idx]),
    }));
    submitAnswers(answers);
  };

  const handleMatchSubmit = (userMatching: { encrypted: string | null; matchedOrder: number }[], rightOrder?: number[]) => {
    if (!isVerifiable && rightOrder != null) {
      const sortedFixed = [...fixedCaptionChildren].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const correct = rightOrder.every((matchIdx, p) => matchOptionChildren[matchIdx]?.order === sortedFixed[p]?.order);
      setCorrectAnswers(sortedFixed.map((f) => String(f.order ?? '')));
      setResult(correct ? 'correct' : 'incorrect');
      return;
    }
    const answers = userMatching.map((m) => ({
      encrypted_token: m.encrypted ?? '',
      user_answer: String(m.matchedOrder),
    }));
    submitAnswers(answers);
  };

  // ---------------------------------------------------------------------------
  // Outcome bar
  // ---------------------------------------------------------------------------

  const StateIcon = isSubmitting ? Loader2 : result === 'correct' ? Trophy : result === 'incorrect' ? Frown : result === 'already' ? Info : null;

  const outcomeBar = (result != null || isSubmitting) && (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
      style={{
        backgroundColor: result === 'correct'
          ? 'var(--md-sys-color-success-container)'
          : result === 'incorrect'
            ? 'var(--md-sys-color-warning-container)'
            : 'var(--md-sys-color-surface-container-highest)',
        color: result === 'correct'
          ? 'var(--md-sys-color-on-success-container)'
          : result === 'incorrect'
            ? 'var(--md-sys-color-on-warning-container)'
            : 'var(--md-sys-color-on-surface)',
      }}
    >
      {StateIcon && (
        <StateIcon
          className={`h-5 w-5 shrink-0 ${isSubmitting ? 'animate-spin' : result == null ? 'opacity-40' : ''}`}
          style={isSubmitting ? { color: 'var(--md-sys-color-primary)' } : undefined}
          aria-hidden
        />
      )}
      <span className={`text-sm ${result === 'correct' || result === 'incorrect' ? 'font-semibold' : ''}`}>
        {isSubmitting ? t('quiz.verifying') : result === 'correct' ? t('quiz.correct') : result === 'incorrect' ? t('quiz.incorrect') : t('quiz.alreadyAnswered')}
      </span>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const frameClass = quizFrameBackground === 'surfaceHigh'
    ? 'surface-container-high'
    : 'surface-container-low';

  return (
    <div className={`my-6 space-y-4 rounded-xl p-5 ${frameClass}`}>
      <p
        className="font-medium text-sm flex items-center gap-2"
        style={{ color: themeVar('text') }}
      >
        <Puzzle className="shrink-0 w-4 h-4" style={{ color: themeVar('primary') }} aria-hidden />
        {question}
      </p>

      {/* Radio / Checkbox */}
      {(quizType === 'radio' || quizType === 'checkbox') && (
        <RadioCheckQuiz
          inputType={quizType}
          items={(quizType === 'radio' ? radioOptions : checkOptions).map((o) => ({
            text: o.text ?? '',
            encrypted: o.isCorrectEncrypted ?? null,
          }))}
          result={result}
          isSubmitting={isSubmitting}
          onSubmit={handleRadioCheckSubmit}
          submitLabel={t('quiz.submit')}
          correctAnswers={correctAnswers}
        />
      )}

      {/* Sort */}
      {quizType === 'sort' && (
        <SortQuiz
          items={sortChildren.map((o) => ({ caption: o.caption ?? '', encrypted: o.orderEncrypted ?? null }))}
          result={result}
          isSubmitting={isSubmitting}
          onSubmit={handleSortSubmit}
          submitLabel={t('quiz.submit')}
          correctOrder={correctAnswers != null && correctAnswers.length === sortChildren.length
            ? correctAnswers.map((p, i) => ({ i, p: parseInt(p, 10) })).sort((a, b) => a.p - b.p).map((x) => x.i)
            : null}
        />
      )}

      {/* Match */}
      {quizType === 'match' && (
        <MatchQuiz
          fixedItems={fixedCaptionChildren.map((o) => ({ caption: o.caption ?? '', order: o.order ?? 0 }))}
          matchItems={matchOptionChildren.map((o) => ({ caption: o.caption ?? '', encrypted: o.orderEncrypted ?? null, order: o.order ?? 0 }))}
          result={result}
          isSubmitting={isSubmitting}
          onSubmit={handleMatchSubmit}
          submitLabel={t('quiz.submit')}
          correctAnswers={correctAnswers}
        />
      )}

      {outcomeBar}
    </div>
  );
}
