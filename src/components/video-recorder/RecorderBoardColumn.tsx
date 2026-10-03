import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import ChessBoard from '../../components/ChessBoard';
import ReplayMoves from '../../components/ReplayMoves';
import type { ReplayMovesRef } from '../../components/ReplayMoves';
import { ThemeProvider } from '../../contexts/ThemeContext';
import RecorderPreviewPlayer from './RecorderPreviewPlayer';
import type {
  RecorderBoardSharedProps,
  RecorderControlActions,
  RecorderPreviewProps,
} from './types';

interface RecorderBoardColumnProps extends RecorderBoardSharedProps {
  mode: 'light' | 'dark';
  boardColumnRef?: RefObject<HTMLDivElement | null>;
  replayMovesRef: RefObject<ReplayMovesRef | null>;
  controls: RecorderControlActions;
  preview: RecorderPreviewProps;
  rotateBoardLabel: string;
  newGameLabel: string;
  copyButtonLabel: string;
}

export default function RecorderBoardColumn({
  mode,
  boardColumnRef,
  replayMovesRef,
  controls,
  preview,
  rotateBoardLabel,
  newGameLabel,
  copyButtonLabel,
  ...board
}: RecorderBoardColumnProps) {
  const isPreview = board.appMode === 'preview';

  return (
    <div
      ref={boardColumnRef as RefObject<HTMLDivElement>}
      className={`flex flex-col flex-shrink-0 gap-4 pt-0 ${isPreview ? 'w-fit items-center' : 'w-[450px]'}`}
    >
      <BoardSurface mode={mode} boardScale={board.isFullscreen ? board.boardScale : undefined} {...board} />

      {board.appMode === 'recording' && !board.isFullscreen && (
        <>
          <div className="flex items-center gap-1 w-full">
            <motion.button
              type="button"
              onClick={() => controls.setLookingOnWhite((prev) => !prev)}
              className="btn-icon flex-shrink-0"
              title={rotateBoardLabel}
              aria-label={rotateBoardLabel}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
            </motion.button>

            <div className="flex-1 min-w-0">
              <ReplayMoves ref={replayMovesRef as RefObject<ReplayMovesRef>} onAction={controls.handleReplayAction} compact />
            </div>

            <motion.button
              type="button"
              onClick={controls.handleFullscreen}
              className="btn-icon flex-shrink-0"
              title={preview.videoPlayerTexts.enterFullscreen}
              aria-label={preview.videoPlayerTexts.enterFullscreen}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </motion.button>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <motion.button
              onClick={controls.handleNewGame}
              className="btn-tonal w-full"
              whileTap={{ scale: 0.99 }}
            >
              {newGameLabel}
            </motion.button>
            <motion.button
              onClick={() => controls.setIsCopyPopupOpen(true)}
              className="btn-tonal w-full"
              whileTap={{ scale: 0.99 }}
            >
              {copyButtonLabel}
            </motion.button>
          </div>
        </>
      )}

      {isPreview && (
        <div className="w-full min-w-[42rem]">
          <RecorderPreviewPlayer {...preview} />
        </div>
      )}
    </div>
  );
}

function BoardSurface({
  mode,
  fen,
  highlights,
  lookingOnWhite,
  boardMode,
  appMode,
  isFullscreen,
  boardScale,
  handleMove,
  handleSquareClick,
}: RecorderBoardSharedProps & { mode: 'light' | 'dark'; boardScale?: number }) {
  const boardContent = (
    <ThemeProvider mode={mode}>
      <ChessBoard
        fen={fen}
        highlights={highlights}
        lookingOnWhite={lookingOnWhite}
        onMove={appMode === 'recording' && boardMode === 'play' ? handleMove : undefined}
        onSquareClick={appMode === 'recording' ? handleSquareClick : undefined}
        disabled={appMode === 'preview'}
        allowInput={appMode === 'recording' && boardMode === 'play'}
      />
    </ThemeProvider>
  );

  if (isFullscreen) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: '450px',
          height: '450px',
          transform: `scale(${boardScale ?? 1})`,
          transformOrigin: 'center center',
        }}
      >
        {boardContent}
      </div>
    );
  }

  return <div className="w-[450px] h-[450px]">{boardContent}</div>;
}
