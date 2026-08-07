import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Square, ArrowRight } from 'lucide-react';
import type { BoardMode, HighlightColor } from './types';
import { HIGHLIGHT_COLORS } from './utils';

interface RecorderHighlightPanelProps {
  layout: 'sidebar' | 'fullscreen';
  boardMode: BoardMode;
  clearHighlightsOnMove: boolean;
  colorNames: Record<HighlightColor, string>;
  colorValues: Record<HighlightColor, string>;
  onHighlightClick: (mode: BoardMode) => void;
  onClearHighlightsOnMoveChange: (value: boolean) => void;
  onRemoveAllHighlights: () => void;
  clearHighlightsLabel: string;
  removeAllLabel: string;
}

export default function RecorderHighlightPanel({
  layout,
  boardMode,
  clearHighlightsOnMove,
  colorNames,
  colorValues,
  onHighlightClick,
  onClearHighlightsOnMoveChange,
  onRemoveAllHighlights,
  clearHighlightsLabel,
  removeAllLabel,
}: RecorderHighlightPanelProps) {
  const isFullscreen = layout === 'fullscreen';

  return (
    <div
      className={`flex flex-col rounded-lg p-3 ${isFullscreen ? 'flex-shrink-0' : 'w-48'}`}
      style={{ backgroundColor: 'var(--surfaceHigh)' }}
    >
      {isFullscreen ? (
        <>
          <div className="grid grid-cols-6 gap-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <HighlightButton
                key={`${layout}-square-${color}`}
                kind="square"
                color={color}
                label={colorNames[color]}
                colorValue={colorValues[color]}
                active={boardMode === `square-${color}`}
                compact
                onClick={() => onHighlightClick(`square-${color}`)}
              />
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1.5 mt-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <HighlightButton
                key={`${layout}-arrow-${color}`}
                kind="arrow"
                color={color}
                label={colorNames[color]}
                colorValue={colorValues[color]}
                active={boardMode === `arrow-${color}`}
                compact
                onClick={() => onHighlightClick(`arrow-${color}`)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {HIGHLIGHT_COLORS.map((color) => (
            <Fragment key={`${layout}-${color}`}>
              <HighlightButton
                kind="square"
                color={color}
                label={colorNames[color]}
                colorValue={colorValues[color]}
                active={boardMode === `square-${color}`}
                compact={false}
                onClick={() => onHighlightClick(`square-${color}`)}
              />
              <HighlightButton
                kind="arrow"
                color={color}
                label={colorNames[color]}
                colorValue={colorValues[color]}
                active={boardMode === `arrow-${color}`}
                compact={false}
                onClick={() => onHighlightClick(`arrow-${color}`)}
              />
            </Fragment>
          ))}
        </div>
      )}

      <div
        className={`pt-2 mt-2 ${isFullscreen ? 'border-t border-[var(--primaryBorder)] flex flex-wrap items-center gap-2' : 'mb-3 border-t space-y-1.5'}`}
      >
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              checked={clearHighlightsOnMove}
              onChange={(event) => onClearHighlightsOnMoveChange(event.target.checked)}
              className="sr-only"
            />
            <span
              className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all duration-200"
              style={{
                borderColor: clearHighlightsOnMove ? 'var(--primary)' : 'var(--border)',
                backgroundColor: clearHighlightsOnMove ? 'var(--primary)' : (isFullscreen ? 'transparent' : 'var(--bg)'),
              }}
              aria-hidden="true"
            >
              {clearHighlightsOnMove && (
                <svg
                  width={isFullscreen ? '8' : '10'}
                  height={isFullscreen ? '6' : '8'}
                  viewBox="0 0 10 8"
                  fill="none"
                  className="shrink-0"
                  style={{ stroke: 'var(--onPrimary)' }}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 4l3 3 5-6" />
                </svg>
              )}
            </span>
          </span>
          <span className="text-xs text-text">{clearHighlightsLabel}</span>
        </label>

        <motion.button
          onClick={onRemoveAllHighlights}
          className={isFullscreen ? 'px-2 py-1 rounded-lg text-xs font-medium' : 'w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150'}
          style={{ backgroundColor: 'var(--error)', color: 'var(--onError)' }}
          onMouseEnter={(event) => {
            if (!isFullscreen) {
              (event.currentTarget as HTMLElement).style.opacity = '0.9';
            }
          }}
          onMouseLeave={(event) => {
            if (!isFullscreen) {
              (event.currentTarget as HTMLElement).style.opacity = '1';
            }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {removeAllLabel}
        </motion.button>
      </div>
    </div>
  );
}

interface HighlightButtonProps {
  kind: 'square' | 'arrow';
  color: HighlightColor;
  label: string;
  colorValue: string;
  active: boolean;
  compact: boolean;
  onClick: () => void;
}

function HighlightButton({ kind, label, colorValue, active, compact, onClick }: HighlightButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1 rounded-lg border-2 ${compact ? 'transition-colors duration-150' : 'aspect-square transition-all duration-200'}`}
      style={{
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        backgroundColor: active ? 'var(--primarySubtle)' : compact ? 'transparent' : undefined,
      }}
      whileHover={compact ? undefined : { scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {kind === 'square' ? (
        <Square
          className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 mb-0.5'}
          strokeWidth={2}
          color={colorValue}
        />
      ) : (
        <ArrowRight
          className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 mb-0.5'}
          strokeWidth={2}
          color={colorValue}
        />
      )}
      <span className={compact ? 'text-[9px] text-text leading-tight truncate w-full text-center' : 'text-[10px] text-text leading-tight'}>
        {label}
      </span>
    </motion.button>
  );
}
