import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Copy, Check, Trash2 } from 'lucide-react';
import type { EditorBlock } from '../../types/articleEditor';
import { useTranslation } from 'react-i18next';

interface BlockWrapperProps {
  block: EditorBlock;
  blockLabel: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  children: React.ReactNode;
}

export default function BlockWrapper({
  block,
  blockLabel,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  children,
}: BlockWrapperProps) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const copyBlockId = async () => {
    try {
      await navigator.clipboard.writeText(block.id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative rounded-r-xl border-l-4 border-[var(--primaryBorder)] bg-[var(--surface)] pl-4 pr-4 pt-3 pb-4 transition-all hover:border-[var(--primary)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--textSecondary)]">
            {blockLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--textSecondary)]">
            <span>{t('articleEditor.blockIdPrefix')}</span>
            <code className="font-mono text-[var(--text)]">{block.id}</code>
            <button
              type="button"
              onClick={copyBlockId}
              className="rounded p-0.5 text-[var(--textSecondary)] hover:bg-[var(--hoverBg)] hover:text-[var(--primary)]"
              aria-label={t(copied ? 'articleEditor.ariaBlockIdCopied' : 'articleEditor.ariaCopyBlockId')}
              title={t(copied ? 'articleEditor.ariaBlockIdCopied' : 'articleEditor.ariaCopyBlockId')}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--hoverBg)] hover:text-[var(--primary)] disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label={t('articleEditor.ariaMoveUp')}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--hoverBg)] hover:text-[var(--primary)] disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label={t('articleEditor.ariaMoveDown')}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)]"
            aria-label={t('articleEditor.ariaRemove')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
