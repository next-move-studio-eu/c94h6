import BlockWrapper from '../BlockWrapper';
import type { PieBlock, PieSliceItem } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';
import { Plus, Trash2 } from 'lucide-react';
import PieDiagram from '../../article-blocks/PieDiagram';

const PRESET_COLORS = [
  '#fac98e',
  '#e14951',
  '#6bbf59',
  '#5b8def',
  '#b57fdd',
  '#f28b54',
  '#7dd3fc',
  '#86efac',
];

function ensureHex(s: string | undefined): string {
  if (!s || typeof s !== 'string') return PRESET_COLORS[0];
  const t = s.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  return t.startsWith('#') ? t : `#${t}`;
}

export function PieBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<PieBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const data = block.data;

  const updateSlice = (i: number, patch: Partial<PieSliceItem>) => {
    const next = [...data];
    next[i] = { ...next[i], ...patch };
    onUpdate({ ...block, data: next });
  };

  const removeSlice = (i: number) => {
    const next = data.filter((_, j) => j !== i);
    onUpdate({ ...block, data: next });
  };

  const addSlice = () => {
    const nextColor = PRESET_COLORS[data.length % PRESET_COLORS.length];
    onUpdate({
      ...block,
      data: [...data, { label: '', value: 0, color: nextColor }],
    });
  };

  const sliceRows = data.map((slice, i) => (
    <li
      key={i}
      className="surface-container-high flex flex-wrap items-center gap-2 rounded-xl p-3"
    >
      <span
        className="h-5 w-5 shrink-0 rounded-full"
        style={{ backgroundColor: ensureHex(slice.color) }}
        aria-hidden
      />
      <label className="sr-only">{t('articleEditor.pieSliceLabel')}</label>
      <input
        type="text"
        value={slice.label}
        onChange={(e) => updateSlice(i, { label: e.target.value })}
        placeholder={t('articleEditor.placeholderPieLabel')}
        className="field-filled focus-ring min-w-0 w-auto flex-1"
      />
      <label className="sr-only">{t('articleEditor.pieSliceValue')}</label>
      <input
        type="number"
        min={0}
        step={1}
        value={slice.value}
        onChange={(e) => updateSlice(i, { value: Math.max(0, Number(e.target.value) || 0) })}
        placeholder="0"
        className="field-filled focus-ring w-20"
      />
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={ensureHex(slice.color)}
          onChange={(e) => updateSlice(i, { color: e.target.value })}
          className="focus-ring h-10 w-10 cursor-pointer rounded-full border-none bg-transparent p-0"
          title={t('articleEditor.pieSliceColor')}
          aria-label={t('articleEditor.pieSliceColor')}
        />
        <button
          type="button"
          onClick={() => removeSlice(i)}
          className="btn-icon"
          aria-label={t('articleEditor.remove')}
          title={t('articleEditor.remove')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  ));

  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articlesPage.blockPie')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.pieName')}
          </label>
          <input
            type="text"
            value={block.name}
            onChange={(e) => onUpdate({ ...block, name: e.target.value })}
            placeholder={t('articleEditor.placeholderPieName')}
            className="field-filled focus-ring"
          />
        </div>
        {data.length > 0 && (
          <div className="surface-container-high flex justify-center rounded-xl p-3">
            <PieDiagram name={block.name} data={data} className="pointer-events-none" />
          </div>
        )}
        <ul className="space-y-2 list-none p-0 m-0">
          {sliceRows}
        </ul>
        <button
          type="button"
          onClick={addSlice}
          className="btn-tonal w-full"
        >
          <Plus className="h-4 w-4" />
          {t('articleEditor.pieAddSlice')}
        </button>
      </div>
    </BlockWrapper>
  );
}
