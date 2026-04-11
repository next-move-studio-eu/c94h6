import BlockWrapper from '../BlockWrapper';
import type { BarBlock, BarSeriesItem } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';
import { Plus, Trash2 } from 'lucide-react';
import BarDiagram from '../../article-blocks/BarDiagram';

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

function parseNumberList(str: string): number[] {
  return str
    .split(/[\s,]+/)
    .map((v) => Math.max(0, Number(v) || 0))
    .filter((_, __, arr) => arr.length === 1 || true);
}

function formatNumberList(arr: number[]): string {
  return (arr ?? []).join(', ');
}

export function BarBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<BarBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const xAxis = block.xAxis;
  const series = block.series;

  const setXAxis = (next: string[]) => {
    onUpdate({ ...block, xAxis: next });
  };

  const updateSeries = (i: number, patch: Partial<BarSeriesItem>) => {
    const next = [...series];
    next[i] = { ...next[i], ...patch };
    onUpdate({ ...block, series: next });
  };

  const removeSeries = (i: number) => {
    const next = series.filter((_, j) => j !== i);
    onUpdate({ ...block, series: next });
  };

  const addSeries = () => {
    const nextColor = PRESET_COLORS[series.length % PRESET_COLORS.length];
    const defaultData = xAxis.length ? xAxis.map(() => 0) : [0];
    onUpdate({
      ...block,
      series: [...series, { name: '', data: defaultData, color: nextColor }],
    });
  };

  const xAxisStr = xAxis.join(', ');
  const setXAxisFromString = (s: string) => {
    const labels = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    setXAxis(labels.length ? labels : []);
  };

  const seriesRows = series.map((s, i) => (
    <li
      key={i}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
    >
      <span
        className="shrink-0 w-5 h-5 rounded border border-[var(--border)]"
        style={{ backgroundColor: ensureHex(s.color) }}
        aria-hidden
      />
      <label className="sr-only">{t('articleEditor.barSeriesName')}</label>
      <input
        type="text"
        value={s.name}
        onChange={(e) => updateSeries(i, { name: e.target.value })}
        placeholder={t('articleEditor.placeholderBarSeriesName')}
        className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
      />
      <label className="sr-only">{t('articleEditor.barSeriesData')}</label>
      <input
        type="text"
        value={formatNumberList(s.data)}
        onChange={(e) => updateSeries(i, { data: parseNumberList(e.target.value) })}
        placeholder="10, 20, 15"
        className="min-w-0 w-32 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
      />
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={ensureHex(s.color)}
          onChange={(e) => updateSeries(i, { color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
          title={t('articleEditor.barSeriesColor')}
          aria-label={t('articleEditor.barSeriesColor')}
        />
        <button
          type="button"
          onClick={() => removeSeries(i)}
          className="rounded p-1.5 text-[var(--textSecondary)] hover:bg-[var(--errorSubtle)] hover:text-[var(--error)]"
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
      blockLabel={t('articlesPage.blockBar')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.barName')}
          </label>
          <input
            type="text"
            value={block.name}
            onChange={(e) => onUpdate({ ...block, name: e.target.value })}
            placeholder={t('articleEditor.placeholderBarName')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.barXAxis')}
          </label>
          <input
            type="text"
            value={xAxisStr}
            onChange={(e) => setXAxisFromString(e.target.value)}
            placeholder="Jan, Feb, Mar"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        {series.length > 0 && (
          <div className="flex justify-center rounded-lg border border-[var(--border)] bg-[var(--surfaceHigh)] p-3">
            <BarDiagram
              name={block.name}
              xAxis={xAxis}
              series={series}
              className="pointer-events-none"
            />
          </div>
        )}
        <ul className="space-y-2 list-none p-0 m-0">
          {seriesRows}
        </ul>
        <button
          type="button"
          onClick={addSeries}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-transparent py-2.5 text-sm font-medium text-[var(--textSecondary)] hover:border-[var(--primary)] hover:bg-[var(--primarySubtle)] hover:text-[var(--primary)]"
        >
          <Plus className="h-4 w-4" />
          {t('articleEditor.barAddSeries')}
        </button>
      </div>
    </BlockWrapper>
  );
}
