/**
 * Renders a simple bar chart from xAxis labels and series (name, data, color).
 * Series colors are theme-adjusted via diagramColorUtils (same as pie chart and DOT nodes).
 */
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { themeAdjustDiagramColor } from '../../utils/diagramColorUtils';

export interface BarSeriesData {
  name: string;
  data: number[];
  color: string;
}

interface BarDiagramProps {
  /** Title shown above the chart. */
  name: string;
  /** Labels for each category on the x-axis. */
  xAxis: string[];
  series: BarSeriesData[];
  className?: string;
  /** When true, show info icon with tooltip about color post-processing (editor preview only). */
  showPostprocessInfo?: boolean;
}
const PADDING = 40;
const INNER_WIDTH = 320;
const INNER_HEIGHT = 200;
const BAR_GAP = 4;
const LEGEND_GAP = 12;
const Y_AXIS_LABEL_GAP = 6;

/** Compute roughly 4–6 nice tick values from 0 to max (inclusive). */
function yAxisTicks(max: number): number[] {
  if (max <= 0) return [0];
  let step = 1;
  if (max > 5) step = 5;
  if (max > 20) step = 10;
  if (max > 50) step = 20;
  if (max > 100) step = 50;
  if (max > 250) step = Math.ceil(max / 5 / 50) * 50;
  const ticks: number[] = [0];
  for (let v = step; v < max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

export default function BarDiagram({ name, xAxis, series, className, showPostprocessInfo }: BarDiagramProps) {
  const { t } = useTranslation('articleBlocks');
  const [, setThemeMode] = useState(() => document.documentElement.getAttribute('data-mode') ?? 'light');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeMode(document.documentElement.getAttribute('data-mode') ?? 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
  }, []);

  const categories = xAxis.length;
  const hasSeries = series.length > 0 && series.some((s) => s.data.length > 0);
  const maxVal = hasSeries
    ? Math.max(...series.flatMap((s) => s.data.map((v) => Number(v) || 0)))
    : 0;
  const range = maxVal > 0 ? maxVal : 1;

  const seriesWithColors = series.map((s) => ({
    ...s,
    data: s.data.map((v) => Math.max(0, Number(v) || 0)),
    color: themeAdjustDiagramColor(s.color),
  }));

  if (!hasSeries || categories === 0) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          padding: '1rem',
          color: 'var(--textSecondary)',
          fontSize: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {showPostprocessInfo && (
          <span
            title={t('dotDiagram.postprocessTooltip')}
            style={{
              position: 'absolute',
              top: 4,
              right: 0,
              display: 'inline-flex',
              color: 'var(--textSecondary)',
              cursor: 'help',
            }}
            aria-label={t('dotDiagram.postprocessTooltip')}
          >
            <Info size={18} strokeWidth={2} />
          </span>
        )}
        <span className="font-semibold text-[var(--text)]">{name.trim()}</span>
        {t('charts.noData')}
      </div>
    );
  }

  const title = name.trim();
  const seriesCount = seriesWithColors.length;
  const totalBarsPerCategory = seriesCount;
  const barGroupWidth = Math.max(20, (INNER_WIDTH - (categories - 1) * BAR_GAP) / categories);
  const barWidth = Math.max(4, (barGroupWidth - (totalBarsPerCategory - 1) * 4) / totalBarsPerCategory);
  const chartHeight = INNER_HEIGHT;
  const yTicks = yAxisTicks(maxVal);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '1rem',
        width: '100%',
        overflow: 'visible',
      }}
    >
      {showPostprocessInfo && (
        <span
          title={t('dotDiagram.postprocessTooltip')}
          style={{
            position: 'absolute',
            top: 4,
            right: 0,
            display: 'inline-flex',
            color: 'var(--textSecondary)',
            cursor: 'help',
          }}
          aria-label={t('dotDiagram.postprocessTooltip')}
        >
          <Info size={18} strokeWidth={2} />
        </span>
      )}
      <h3
        className="m-0 text-base font-semibold text-[var(--text)]"
        style={{ textAlign: 'center' }}
      >
        {title}
      </h3>
      <svg
        width={INNER_WIDTH + 2 * PADDING}
        height={INNER_HEIGHT + 2 * PADDING}
        viewBox={`0 0 ${INNER_WIDTH + 2 * PADDING} ${INNER_HEIGHT + 2 * PADDING}`}
        style={{ flexShrink: 0, display: 'block' }}
        aria-hidden
      >
        {/* Y-axis line */}
        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={PADDING + chartHeight}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {/* X-axis line */}
        <line
          x1={PADDING}
          y1={PADDING + chartHeight}
          x2={PADDING + INNER_WIDTH}
          y2={PADDING + chartHeight}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {/* Y-axis scale labels (ghost text) */}
        {yTicks.map((tickVal) => {
          const y = PADDING + chartHeight - (tickVal / range) * chartHeight;
          return (
            <text
              key={tickVal}
              x={PADDING - Y_AXIS_LABEL_GAP}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="var(--textSecondary)"
            >
              {tickVal}
            </text>
          );
        })}
        {seriesWithColors.map((s, seriesIndex) =>
          s.data.slice(0, categories).map((value, catIndex) => {
            const barHeight = (value / range) * chartHeight;
            const x =
              PADDING +
              catIndex * (barGroupWidth + BAR_GAP) +
              seriesIndex * (barWidth + 4) +
              2;
            const y = PADDING + chartHeight - barHeight;
            const categoryLabel = xAxis[catIndex];
            const seriesName = s.name;
            const tooltipText = `${seriesName} (${categoryLabel}): ${value}`;
            return (
              <g key={`${seriesIndex}-${catIndex}`}>
                <title>{tooltipText}</title>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={s.color}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              </g>
            );
          })
        )}
        {/* X-axis labels */}
        {xAxis.slice(0, categories).map((label, i) => (
          <text
            key={i}
            x={PADDING + i * (barGroupWidth + BAR_GAP) + barGroupWidth / 2}
            y={PADDING + chartHeight + LEGEND_GAP}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text)"
          >
            {label}
          </text>
        ))}
      </svg>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.75rem 1.25rem',
          fontSize: '0.875rem',
          color: 'var(--text)',
        }}
      >
        {seriesWithColors.map((s, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: s.color,
                flexShrink: 0,
              }}
            />
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
