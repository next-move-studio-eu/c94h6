import { useCallback } from 'react';
import BlockWrapper from '../BlockWrapper';
import type { TtsBlock, TtsBlockItem } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import { checkboxFaceClass, type BlockEditorProps } from './blockEditorShared';
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

  const tableClass = 'w-full table-fixed text-left text-sm';
  const cellClass = 'align-top px-3 py-2';
  const thClass = `${cellClass} surface-container-high font-medium text-[var(--md-sys-color-on-surface-variant)]`;

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
        <label className="group mb-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <input
            type="checkbox"
            checked={!!block.justRead}
            onChange={(e) => setJustRead(e.target.checked)}
            className="sr-only peer"
          />
          <span className={checkboxFaceClass(!!block.justRead)} aria-hidden="true">
            {block.justRead && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--md-sys-color-on-primary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4l3 3 5-6" />
              </svg>
            )}
          </span>
          <span className="text-[var(--md-sys-color-on-surface)]">{t('articleEditor.ttsJustRead')}</span>
        </label>
        <div className="w-full space-y-3">
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.ttsJustReadPreviewHint')}
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              {t('articleEditor.ttsLabel')} ({t('articleEditor.ttsJustReadButtonTitle')})
            </label>
            <input
              type="text"
              value={singleItem.label ?? ''}
              onChange={(e) => updateItem(0, { label: e.target.value })}
              placeholder={t('articleEditor.ttsJustReadLabelPlaceholder')}
              className="field-filled focus-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              {t('articleEditor.ttsText')}
            </label>
            <textarea
              value={singleItem.text}
              onChange={(e) => updateItem(0, { text: e.target.value })}
              placeholder={t('articleEditor.ttsTextPlaceholder')}
              rows={4}
              className="field-filled focus-ring resize-y"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              {t('articleEditor.ttsLanguage')}
            </label>
            <input
              type="text"
              value={singleItem.language}
              onChange={(e) => updateItem(0, { language: e.target.value })}
              placeholder="en-GB"
              className="field-filled focus-ring max-w-[8rem]"
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
        <label className="group mb-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <input
            type="checkbox"
            checked={!!block.justRead}
            onChange={(e) => setJustRead(e.target.checked)}
            className="sr-only peer"
          />
          <span className={checkboxFaceClass(!!block.justRead)} aria-hidden="true">
            {block.justRead && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--md-sys-color-on-primary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4l3 3 5-6" />
              </svg>
            )}
          </span>
          <span className="text-[var(--md-sys-color-on-surface)]">{t('articleEditor.ttsJustRead')}</span>
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
                  className="field-filled focus-ring"
                />
              </td>
              <td className={cellClass}>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItem(i, { text: e.target.value })}
                  placeholder={t('articleEditor.ttsTextPlaceholder')}
                  className="field-filled focus-ring"
                />
              </td>
              <td className={cellClass}>
                <input
                  type="text"
                  value={item.language}
                  onChange={(e) => updateItem(i, { language: e.target.value })}
                  placeholder="en-GB"
                  className="field-filled focus-ring"
                  title={t('articleEditor.ttsLanguageHint')}
                />
              </td>
              <td className={cellClass}>
                <label className="group flex w-fit cursor-pointer items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  <span className="relative inline-flex shrink-0">
                    <input
                      type="checkbox"
                      checked={item.stt}
                      onChange={(e) => updateItem(i, { stt: e.target.checked })}
                      className="sr-only peer"
                    />
                    <span className={checkboxFaceClass(item.stt)} aria-hidden="true">
                      {item.stt && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ stroke: 'var(--md-sys-color-on-primary)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 4l3 3 5-6" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{t('articleEditor.ttsSttEnable')}</span>
                </label>
              </td>
              <td className={cellClass}>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={items.length <= 1}
                  className="btn-icon"
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
          className="btn-tonal"
        >
          <Plus className="h-4 w-4" />
          {t('articleEditor.ttsAddRow')}
        </button>
      </div>
    </BlockWrapper>
  );
}
