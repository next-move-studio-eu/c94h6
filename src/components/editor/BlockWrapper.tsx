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
    <div className="surface-container-highest rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
            {blockLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--md-sys-color-secondary-container)] px-2 py-0.5 text-[10px] font-medium text-[var(--md-sys-color-on-secondary-container)]">
            <span>{t('articleEditor.blockIdPrefix')}</span>
            <code className="font-mono">{block.id}</code>
            <button
              type="button"
              onClick={copyBlockId}
              className="btn-icon h-5 w-5 text-[var(--md-sys-color-on-secondary-container)]"
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
            className="btn-icon h-8 w-8"
            aria-label={t('articleEditor.ariaMoveUp')}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="btn-icon h-8 w-8"
            aria-label={t('articleEditor.ariaMoveDown')}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="btn-icon h-8 w-8 text-[var(--md-sys-color-error)]"
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
