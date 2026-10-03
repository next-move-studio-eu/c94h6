import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, SquareChevronRight, ChevronRight } from 'lucide-react';

export type ReplayMovesAction = 'back' | 'forward-main' | 'forward-select';

export type ReplayMovesListener = (action: ReplayMovesAction) => void;

export interface ReplayMovesProps {
  onAction?: ReplayMovesListener;
  /** When true, buttons are smaller to fit alongside e.g. a rotate button */
  compact?: boolean;
}

export interface ReplayMovesRef {
  addListener: (listener: ReplayMovesListener) => void;
  removeListener: (listener: ReplayMovesListener) => void;
  getForwardSelectButton: () => HTMLButtonElement | null;
}

// ReplayMoves component - emits navigation events
// This component has a simple responsibility: emit navigation events
// Each consuming page must mount its logic to handle these events
const ReplayMoves = forwardRef<ReplayMovesRef, ReplayMovesProps>(({ onAction, compact }, ref) => {
  const listenersRef = useRef<Set<ReplayMovesListener>>(new Set());
  const forwardSelectButtonRef = useRef<HTMLButtonElement>(null);
  const btnClass = compact
    ? 'focus-ring flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-on-surface-variant transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface-variant)_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-40'
    : 'focus-ring flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-on-surface-variant transition-colors hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface-variant)_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-40';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    addListener: (listener: ReplayMovesListener) => {
      listenersRef.current.add(listener);
    },
    removeListener: (listener: ReplayMovesListener) => {
      listenersRef.current.delete(listener);
    },
    getForwardSelectButton: () => forwardSelectButtonRef.current
  }), []);

  // Register/unregister the onAction callback
  useEffect(() => {
    if (onAction) {
      listenersRef.current.add(onAction);
      return () => {
        listenersRef.current.delete(onAction);
      };
    }
  }, [onAction]);

  // Emit action to all listeners
  const emitAction = (action: ReplayMovesAction) => {
    listenersRef.current.forEach(listener => listener(action));
  };

  const handleBack = () => {
    emitAction('back');
  };

  const handleForwardMain = () => {
    emitAction('forward-main');
  };

  const handleForwardSelect = () => {
    emitAction('forward-select');
  };

  return (
    <div className="flex gap-2 w-full min-w-0">
      <button
        onClick={handleBack}
        className={btnClass}
      >
        <ChevronLeft className={iconSize} />
      </button>
      <button
        onClick={handleForwardMain}
        className={btnClass}
      >
        <SquareChevronRight className={iconSize} />
      </button>
      <button
        ref={forwardSelectButtonRef}
        onClick={handleForwardSelect}
        className={btnClass}
      >
        <ChevronRight className={iconSize} />
      </button>
    </div>
  );
});

ReplayMoves.displayName = 'ReplayMoves';

export default ReplayMoves;
