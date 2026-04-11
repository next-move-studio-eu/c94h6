import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Chess } from 'chess.js';
import { tauriUciEngineStatus, analyzePositionTauri, isTauri } from '../engine/tauriUciAdapter';

export interface EngineAnalysisOutputRef {
  clear: () => void;
  fill: (message: string) => void;
  requestAnalysis: (pv: 1 | 5) => Promise<void>;
  isLoading: boolean;
  isConnectionReady: boolean;
  initFailed: boolean;
}

interface EngineAnalysisOutputProps {
  fen: string;
  gameId: string;
  apiBaseUrl?: string;
  fullscreenMode?: boolean;
  externalThinking?: boolean;
  translateMove?: (san: string) => string;
}

interface AnalysisRow {
  score: number;
  pv: string[];
}

const MAX_ANALYSIS_PLY = 8;

const convertUciToAlgebraic = (uciMoves: string[], fen: string, translateMove?: (san: string) => string): string[] => {
  try {
    const game = new Chess(fen);
    const algebraicMoves: string[] = [];
    const limitedMoves = uciMoves.slice(0, MAX_ANALYSIS_PLY);
    for (const uciMove of limitedMoves) {
      if (uciMove.length < 4) continue;
      const from = uciMove.substring(0, 2) as any;
      const to = uciMove.substring(2, 4) as any;
      const promotion = uciMove.length > 4 ? uciMove.substring(4, 5) : undefined;
      try {
        const move = game.move({ from, to, promotion: promotion as any });
        if (move) {
          let algebraic = move.san;
          if (translateMove) algebraic = translateMove(algebraic);
          algebraicMoves.push(algebraic);
        } else {
          algebraicMoves.push(uciMove);
        }
      } catch {
        algebraicMoves.push(uciMove);
      }
    }
    return algebraicMoves;
  } catch {
    return uciMoves;
  }
};

const formatScore = (score: number): string => {
  const absScore = Math.abs(score);
  if (absScore >= 1000000 && absScore % 1000000 === 0) {
    const mateIn = absScore / 1000000;
    return score > 0 ? `+#${mateIn}` : `-#${mateIn}`;
  }
  const value = score / 100;
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
};

/** Engine reports score from side-to-move; convert to White's perspective for consistent display. */
const scoreFromWhitePerspective = (score: number, fen: string): number => {
  const activeColor = fen.split(' ')[1];
  return activeColor === 'b' ? -score : score;
};

const EngineAnalysisOutput = forwardRef<EngineAnalysisOutputRef, EngineAnalysisOutputProps>(
  ({ fen, gameId: _gameId, externalThinking = false, translateMove }, ref) => {
    const [analysisRows, setAnalysisRows] = useState<AnalysisRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnectionReady, setIsConnectionReady] = useState(false);
    const [initFailed, setInitFailed] = useState(false);
    const [currentPvMode, setCurrentPvMode] = useState<1 | 5 | null>(null);
    const [lastOffSkeletonLines, setLastOffSkeletonLines] = useState<1 | 5>(5);
    const currentFenRef = useRef<string>(fen);

    useEffect(() => {
      if (currentFenRef.current !== fen) {
        currentFenRef.current = fen;
        setAnalysisRows([]);
      }
    }, [fen]);

    // In Tauri: poll until UCI engine is loaded. Outside Tauri: mark init failed (no UI message; Load UCI is the only cue).
    useEffect(() => {
      let mounted = true;
      if (!isTauri()) {
        setInitFailed(true);
        return;
      }
      const check = async () => {
        const ready = await tauriUciEngineStatus();
        if (mounted) {
          setIsConnectionReady(ready);
          setInitFailed(!ready);
        }
      };
      check();
      const interval = setInterval(check, 2000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, []);

    const requestAnalysis = useCallback(async (pv: 1 | 5) => {
      if (!isConnectionReady) return;
      setIsLoading(true);
      setAnalysisRows([]);
      setCurrentPvMode(pv);
      try {
        const rows = await analyzePositionTauri(fen, pv);
        setAnalysisRows(rows);
      } catch (err) {
        console.error('Engine analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    }, [fen, isConnectionReady]);

    useImperativeHandle(ref, () => ({
      clear: () => setAnalysisRows([]),
      fill: (message: string) => {
        try {
          const results: { score: number; pv: string[] | string }[] = JSON.parse(message);
          setAnalysisRows(results.map((r) => ({
            score: r.score,
            pv: Array.isArray(r.pv) ? r.pv : (typeof r.pv === 'string' && r.pv.trim() ? r.pv.trim().split(/\s+/) : [])
          })));
        } catch (e) {
          console.error('Error parsing analysis message:', e);
        }
      },
      requestAnalysis,
      isLoading,
      isConnectionReady,
      initFailed
    }), [requestAnalysis, isLoading, isConnectionReady, initFailed]);

    const displayRows = currentPvMode === 1
      ? (analysisRows.length > 0 ? [analysisRows[0]] : [])
      : Array.from({ length: 5 }, (_, i) => analysisRows[i] || { score: 0, pv: [] });

    const hasAnalysis = analysisRows.length > 0;
    const showLoading = isLoading && !hasAnalysis;
    const isSinglePvMode = currentPvMode === 1;
    const showAnimatedSkeleton = showLoading || (externalThinking && !hasAnalysis);
    const animatedSkeletonCount = showLoading ? (currentPvMode === 1 ? 1 : 5) : 1;

    useEffect(() => {
      if (showAnimatedSkeleton) {
        const count = showLoading ? (currentPvMode === 1 ? 1 : 5) : 1;
        setLastOffSkeletonLines(count);
      }
    }, [showAnimatedSkeleton, showLoading, currentPvMode]);

    const skeletonRowContentHeight = { height: '1.4em', fontSize: '14px' };
    const renderSkeletonRows = (count: number, animated: boolean) => (
      <div className="flex flex-col flex-1 justify-start" style={{ gap: '8px' }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="group/row flex gap-3 items-start px-2 py-1 rounded-lg -mx-2" style={{ lineHeight: 1.4, overflow: 'hidden', flexShrink: 0 }}>
            <span className={`inline-block w-16 flex-shrink-0 rounded ${animated ? 'skeleton-shimmer' : 'skeleton-static'}`} style={skeletonRowContentHeight} />
            <span className={`inline-block flex-1 min-w-0 rounded ${animated ? 'skeleton-shimmer' : 'skeleton-static'}`} style={skeletonRowContentHeight} />
          </div>
        ))}
      </div>
    );

    const FIXED_HEIGHT = '182px';

    return (
      <div className="relative overflow-hidden transition-all duration-300" style={{ width: '100%', height: FIXED_HEIGHT }}>
        <div className="h-full" style={{ padding: '6px 0' }}>
          <div className="h-full flex flex-col">
            {showAnimatedSkeleton ? (
              renderSkeletonRows(animatedSkeletonCount, true)
            ) : hasAnalysis ? (
              <div className={`flex flex-col flex-1 ${isSinglePvMode ? '' : 'justify-start'}`} style={{ gap: isSinglePvMode ? '0' : '8px' }}>
                {displayRows.map((row, index) => {
                  const algebraicMoves = row.pv.length > 0 ? convertUciToAlgebraic(row.pv, fen, translateMove) : [];
                  const movesText = algebraicMoves.length > 0 ? algebraicMoves.join(' ') : '';
                  const scoreValue = row.pv.length > 0 ? formatScore(scoreFromWhitePerspective(row.score, fen)) : '';
                  return (
                    <div
                      key={index}
                      className="group/row flex gap-3 items-start transition-all duration-200 hover:bg-[var(--hoverBg)] px-2 py-1 rounded-lg -mx-2"
                      style={{ lineHeight: isSinglePvMode ? '1.6' : '1.4', overflow: isSinglePvMode ? 'visible' : 'hidden', flexShrink: 0 }}
                    >
                      <div className="font-mono text-sm w-16 flex-shrink-0 font-semibold transition-all duration-200 text-[var(--primary)]" style={{ lineHeight: isSinglePvMode ? '1.6' : '1.4' }}>
                        {scoreValue}
                      </div>
                      {!isSinglePvMode ? (
                        <div className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-200 text-[var(--text)]" style={{ lineHeight: '1.4' }}>
                          {movesText}
                        </div>
                      ) : (
                        <div className="flex-1 text-sm break-words whitespace-normal transition-colors duration-200 text-[var(--text)] overflow-y-auto max-h-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {movesText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              renderSkeletonRows(lastOffSkeletonLines, false)
            )}
          </div>
        </div>
      </div>
    );
  }
);

EngineAnalysisOutput.displayName = 'EngineAnalysisOutput';

export default EngineAnalysisOutput;
