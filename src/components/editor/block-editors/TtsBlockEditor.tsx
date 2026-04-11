import { useCallback } from 'react';
import BlockWrapper from '../BlockWrapper';
import type { TtsBlock, TtsBlockItem } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';
import { Plus, Trash2 } from 'lucide-react';

export function TtsBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<TtsBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const items = block.items;

  const updateItem = useCallback(
    (i: number, patch: Partial<TtsBlockItem>) => {
      const next = [...items];
      next[i] = { ...next[i], ...patch };
      onUpdate({ ...block, items: next });
    },
    [block, items, onUpdate]
  );

  const addRow = useCallback(() => {
    onUpdate({
      ...block,
      items: [...items, { text: '', language: 'en-GB', stt: false }],
    });
  }, [block, items, onUpdate]);

  const removeRow = useCallback(
    (i: number) => {
      if (items.length <= 1) return;
      const next = items.filter((_, j) => j !== i);
      onUpdate({ ...block, items: next });
    },
    [block, items, onUpdate]
  );

  const setJustRead = useCallback(
    (value: boolean) => {
      onUpdate({ ...block, justRead: value });
    },
    [block, onUpdate]
  );

  const tableClass =
    'w-full border-collapse text-left text-sm table-fixed border border-[var(--border)]';
  const cellClass =
    'align-top py-2 px-3 border border-[var(--border)]';
  const thClass = `${cellClass} bg-[var(--surfaceHigh)] text-[var(--textSecondary)] font-medium`;

  const showJustReadUi = block.justRead && items.length === 1;
  const singleItem = items[0];

  if (showJustReadUi) {
    return (
      <BlockWrapper
        block={block}
        blockLabel={t('articleEditor.blockTts')}
        canMoveUp={index > 0}
        canMoveDown={index < totalBlocks - 1}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
      >
        <label className="flex items-center gap-2 cursor-pointer w-fit mb-3 text-sm text-[var(--textSecondary)]">
          <input
            type="checkbox"
            checked={!!block.justRead}
            onChange={(e) => setJustRead(e.target.checked)}
            className="sr-only peer"
          />
          <span className="relative inline-flex shrink-0 w-3.5 h-3.5 rounded border-2 border-[var(--border)] group-hover:border-[var(--primary)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-[var(--primary)] flex items-center justify-center transition-colors peer-checked:border-[var(--primary)]"
            style={{ backgroundColor: block.justRead ? 'var(--primary)' : 'var(--bg)' }}
            aria-hidden="true"
          >
            {block.justRead && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--onPrimary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4l3 3 5-6" />
              </svg>
            )}
          </span>
          <span className="text-[var(--text)]">{t('articleEditor.ttsJustRead')}</span>
        </label>
        <div className="w-full space-y-3">
          <p className="text-xs text-[var(--textSecondary)]">
            {t('articleEditor.ttsJustReadPreviewHint')}
          </p>
          <div>
            <label className="block text-xs font-medium text-[var(--textSecondary)] mb-1">
              {t('articleEditor.ttsLabel')} ({t('articleEditor.ttsJustReadButtonTitle')})
            </label>
            <input
              type="text"
              value={singleItem.label ?? ''}
              onChange={(e) => updateItem(0, { label: e.target.value })}
              placeholder={t('articleEditor.ttsJustReadLabelPlaceholder')}
              className="w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--textSecondary)] mb-1">
              {t('articleEditor.ttsText')}
            </label>
            <textarea
              value={singleItem.text}
              onChange={(e) => updateItem(0, { text: e.target.value })}
              placeholder={t('articleEditor.ttsTextPlaceholder')}
              rows={4}
              className="w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none resize-y"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--textSecondary)] mb-1">
              {t('articleEditor.ttsLanguage')}
            </label>
            <input
              type="text"
              value={singleItem.language}
              onChange={(e) => updateItem(0, { language: e.target.value })}
              placeholder="en-GB"
              className="w-full max-w-[8rem] rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              title={t('articleEditor.ttsLanguageHint')}
            />
          </div>
        </div>
      </BlockWrapper>
    );
  }

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockTts')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      {items.length === 1 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit mb-3 text-sm text-[var(--textSecondary)]">
          <input
            type="checkbox"
            checked={!!block.justRead}
            onChange={(e) => setJustRead(e.target.checked)}
            className="sr-only peer"
          />
          <span className="relative inline-flex shrink-0 w-3.5 h-3.5 rounded border-2 border-[var(--border)] group-hover:border-[var(--primary)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-[var(--primary)] flex items-center justify-center transition-colors peer-checked:border-[var(--primary)]"
            style={{ backgroundColor: block.justRead ? 'var(--primary)' : 'var(--bg)' }}
            aria-hidden="true"
          >
            {block.justRead && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--onPrimary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4l3 3 5-6" />
              </svg>
            )}
          </span>
          <span className="text-[var(--text)]">{t('articleEditor.ttsJustRead')}</span>
        </label>
      )}
      <table className={tableClass}>
        <colgroup>
          <col style={{ width: '35%' }} />
          <col style={{ width: '35%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className={thClass}>
              {t('articleEditor.ttsLabel')}
            </th>
            <th className={thClass}>
              {t('articleEditor.ttsText')}
            </th>
            <th className={thClass}>
              {t('articleEditor.ttsLanguage')}
            </th>
            <th className={thClass}>
              {t('articleEditor.ttsStt')}
            </th>
            <th className={thClass} aria-hidden />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className={cellClass}>
                <input
                  type="text"
                  value={item.label ?? ''}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  placeholder={t('articleEditor.ttsLabelPlaceholder')}
                  className="w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </td>
              <td className={cellClass}>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItem(i, { text: e.target.value })}
                  placeholder={t('articleEditor.ttsTextPlaceholder')}
                  className="w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </td>
              <td className={cellClass}>
                <input
                  type="text"
                  value={item.language}
                  onChange={(e) => updateItem(i, { language: e.target.value })}
                  placeholder="en-GB"
                  className="w-full min-w-0 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  title={t('articleEditor.ttsLanguageHint')}
                />
              </td>
              <td className={cellClass}>
                <label className="flex items-center gap-2 cursor-pointer w-fit group text-xs text-[var(--textSecondary)]">
                  <span className="relative inline-flex shrink-0">
                    <input
                      type="checkbox"
                      checked={item.stt}
                      onChange={(e) => updateItem(i, { stt: e.target.checked })}
                      className="sr-only peer"
                    />
                    <span
                      className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-[var(--primary)] ${item.stt ? 'border-[var(--primary)]' : 'border-[var(--border)] group-hover:border-[var(--primary)]'}`}
                      style={{ backgroundColor: item.stt ? 'var(--primary)' : 'var(--bg)' }}
                      aria-hidden="true"
                    >
                      {item.stt && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--onPrimary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 4l3 3 5-6" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="text-[var(--text)]">{t('articleEditor.ttsSttEnable')}</span>
                </label>
              </td>
              <td className={cellClass}>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={items.length <= 1}
                  className="rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)] disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label={t('articleEditor.remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--textSecondary)] hover:border-[var(--primary)] hover:bg-[var(--primarySubtle)] hover:text-[var(--primary)]"
        >
          <Plus className="h-4 w-4" />
          {t('articleEditor.ttsAddRow')}
        </button>
      </div>
    </BlockWrapper>
  );
}
