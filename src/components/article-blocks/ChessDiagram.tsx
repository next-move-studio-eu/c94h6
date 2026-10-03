import { useState, useCallback, useMemo } from 'react';
import ChessBoard from '../ChessBoard';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Trophy, Frown, Puzzle } from 'lucide-react';

interface ChessDiagramProps {
  fen?: string;
  highlights?: string;
  lookingOnWhite?: boolean;
  /** Plain UCI move (editor-only); when present, board is interactive for preview. */
  bestMove?: string;
  /** Optional caption displayed centered below the board. */
  text?: string;
}

function uciToArrow(uci: string, color: 'G' | 'R'): string {
  const t = (uci || '').trim().toLowerCase();
  const from = t.slice(0, 2);
  const to = t.length >= 4 ? t.slice(2, 4) : '';
  if (from.length !== 2 || to.length !== 2) return '';
  return `${from}${to}${color}`;
}

type DiagramResult = 'correct' | 'incorrect' | null;

/**
 * ChessDiagram — display wrapper for ChessBoard in editor preview.
 * When bestMove (plain UCI) is set, renders an interactive "guess the move" challenge
 * with local comparison (no API call needed in editor context).
 */
export default function ChessDiagram({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  highlights = '',
  lookingOnWhite = true,
  bestMove,
  text,
}: ChessDiagramProps) {
  const { mode } = useTheme();
  const { t } = useTranslation('articleBlocks');

  const isChallenge = Boolean(bestMove);
  const [result, setResult] = useState<DiagramResult>(null);
  const [correctMoveUci, setCorrectMoveUci] = useState<string | null>(null);
  const [wrongMoveUci, setWrongMoveUci] = useState<string | null>(null);

  const handleMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      if (!isChallenge || result != null) return;
      const userMove = (move.from + move.to + (move.promotion || '')).toLowerCase();
      const expected = (bestMove || '').toLowerCase().trim();
      const isCorrect = userMove.slice(0, 4) === expected.slice(0, 4);
      setWrongMoveUci(userMove.slice(0, 4));
      setCorrectMoveUci(expected.slice(0, 4));
      setResult(isCorrect ? 'correct' : 'incorrect');
    },
    [isChallenge, bestMove, result],
  );

  const challengeHighlights = useMemo(() => {
    if (!isChallenge || result == null) return highlights;
    const parts: string[] = highlights ? [highlights] : [];
    if (result === 'correct' && correctMoveUci) parts.push(uciToArrow(correctMoveUci, 'G'));
    if (result === 'incorrect') {
      if (correctMoveUci) parts.push(uciToArrow(correctMoveUci, 'G'));
      if (wrongMoveUci) parts.push(uciToArrow(wrongMoveUci, 'R'));
    }
    return parts.join(',');
  }, [highlights, isChallenge, result, correctMoveUci, wrongMoveUci]);

  const disabled = isChallenge && result != null;
  const allowInput = isChallenge && result == null;

  const themeVar = (token: string) => `var(--${token})`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: '400px', margin: '0 auto' }}>
        <div style={{ width: '400px', height: '400px', overflow: 'hidden' }}>
          <div style={{ width: '450px', height: '450px', transform: 'scale(0.8889)', transformOrigin: 'top left' }}>
            <ThemeProvider mode={mode}>
              <ChessBoard
                fen={fen}
                highlights={challengeHighlights}
                lookingOnWhite={lookingOnWhite}
                disabled={disabled || !isChallenge}
                allowInput={allowInput}
                onMove={handleMove}
              />
            </ThemeProvider>
          </div>
        </div>
      </div>
      {(text || isChallenge) && (
        <p className="text-sm text-center flex items-center justify-center gap-2" style={{ color: themeVar('textSecondary') }}>
          {isChallenge && <Puzzle className="shrink-0 w-4 h-4" style={{ color: themeVar('primary') }} aria-hidden />}
          {text}
        </p>
      )}
      {isChallenge && result != null && (
        <div
          className="flex w-full max-w-[400px] items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: result === 'correct' ? 'var(--md-sys-color-success-container)' : 'var(--md-sys-color-warning-container)',
            color: result === 'correct' ? 'var(--md-sys-color-on-success-container)' : 'var(--md-sys-color-on-warning-container)',
          }}
        >
          {result === 'correct' ? (
            <Trophy className="h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <Frown className="h-5 w-5 shrink-0" aria-hidden />
          )}
          <span className="text-sm font-semibold">
            {result === 'correct' ? t('quiz.correct') : t('quiz.incorrect')}
          </span>
        </div>
      )}
    </div>
  );
}
