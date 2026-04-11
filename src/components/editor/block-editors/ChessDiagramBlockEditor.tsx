import ChessBoard from '../../ChessBoard';
import BlockWrapper from '../BlockWrapper';
import type { ChessDiagramBlock } from '../../../types/articleEditor';
import { DEFAULT_FEN } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import { PREVIEW_WIDTH, CHESS_BOARD_PREVIEW_SCALE, type BlockEditorProps } from './blockEditorShared';

export function ChessDiagramBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<ChessDiagramBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockChessDiagram')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div
        className="grid gap-x-3 items-start"
        style={{ gridTemplateColumns: `${PREVIEW_WIDTH} 1fr` }}
      >
        <div
          className="row-span-3 relative rounded border border-[var(--border)] bg-[var(--frame)] overflow-hidden shrink-0"
          style={{ width: PREVIEW_WIDTH, minHeight: PREVIEW_WIDTH }}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              width: 450,
              height: 450,
              transform: `scale(${CHESS_BOARD_PREVIEW_SCALE})`,
              transformOrigin: '0 0',
            }}
          >
            <ChessBoard
              fen={block.fen || DEFAULT_FEN}
              highlights={block.highlights}
              lookingOnWhite={block.lookingOnWhite}
              disabled
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">{t('articleEditor.labelFen')}</label>
          <input
            type="text"
            value={block.fen}
            onChange={(e) => onUpdate({ ...block, fen: e.target.value })}
            placeholder={DEFAULT_FEN}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.labelHighlights')}
          </label>
          <input
            type="text"
            value={block.highlights}
            onChange={(e) => onUpdate({ ...block, highlights: e.target.value })}
            placeholder={t('articleEditor.placeholderHighlights')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer w-fit group">
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              checked={block.lookingOnWhite}
              onChange={(e) => onUpdate({ ...block, lookingOnWhite: e.target.checked })}
              className="sr-only peer"
            />
            <span
              className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-[var(--primary)] ${block.lookingOnWhite ? 'border-[var(--primary)]' : 'border-[var(--border)] group-hover:border-[var(--primary)]'}`}
              style={{ backgroundColor: block.lookingOnWhite ? 'var(--primary)' : 'var(--bg)' }}
              aria-hidden="true"
            >
              {block.lookingOnWhite && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--onPrimary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4l3 3 5-6" />
                </svg>
              )}
            </span>
          </span>
          <span className="text-sm text-[var(--text)]">{t('articleEditor.viewFromWhite')}</span>
        </label>

        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.labelBestMove')}
          </label>
          <input
            type="text"
            value={block.bestMove ?? ''}
            onChange={(e) => onUpdate({ ...block, bestMove: e.target.value || undefined })}
            placeholder={t('articleEditor.bestMovePlaceholder')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.labelDiagramText')}
          </label>
          <input
            type="text"
            value={block.text ?? ''}
            onChange={(e) => onUpdate({ ...block, text: e.target.value || undefined })}
            placeholder={t('articleEditor.placeholderDiagramText')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      </div>
    </BlockWrapper>
  );
}
