/**
 * Renders a simple pie chart from data slices. Slice colors are theme-adjusted
 * via diagramColorUtils (darken in dark mode, lighten in light mode), same as DOT diagram nodes.
 */
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { themeAdjustDiagramColor } from '../../utils/diagramColorUtils';

export interface PieSliceData {
  label: string;
  value: number;
  color: string;
}

interface PieDiagramProps {
  /** Title shown above the chart. */
  name: string;
  data: PieSliceData[];
  className?: string;
  /** When true, show info icon with tooltip about color post-processing (editor preview only). */
  showPostprocessInfo?: boolean;
}
const PADDING = 8;
const INNER_SIZE = 200;
const SIZE = INNER_SIZE + 2 * PADDING;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = Math.min(INNER_SIZE, INNER_SIZE) / 2 * 0.9;

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * SVG arc: angle in degrees, 0 = 3 o'clock, angles increase clockwise (math convention).
 * In SVG, y is down so "angle up" = counter-clockwise. Use sweep-flag 0 so the arc
 * from (x0,y0) to (x1,y1) is the one centered at (cx,cy).
 */
function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = deg2rad(startDeg);
  const end = deg2rad(endDeg);
  const x0 = cx + r * Math.cos(start);
  const y0 = cy - r * Math.sin(start);
  const x1 = cx + r * Math.cos(end);
  const y1 = cy - r * Math.sin(end);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 0 ${x1} ${y1} Z`;
}

export default function PieDiagram({ name, data, className, showPostprocessInfo }: PieDiagramProps) {
  const { t } = useTranslation('articleBlocks');
  const [, setThemeMode] = useState(() => document.documentElement.getAttribute('data-mode') ?? 'light');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeMode(document.documentElement.getAttribute('data-mode') ?? 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
  }, []);

  const total = data.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0);
  const slices = total > 0
    ? data
        .filter((s) => (Number(s.value) || 0) > 0)
        .map((s) => ({
          ...s,
          value: Number(s.value) || 0,
          color: themeAdjustDiagramColor(s.color),
        }))
    : [];

  let acc = 0;
  const segments = slices.map((s) => {
    const startDeg = (acc / total) * 360;
    acc += s.value;
    const endDeg = (acc / total) * 360;
    return { ...s, startDeg, endDeg };
  });

  if (slices.length === 0) {
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
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ flexShrink: 0, display: 'block' }}
        aria-hidden
      >
        {segments.map((seg, i) => (
          <g key={i}>
            <title>{`${seg.label}: ${seg.value}`}</title>
            <path
              d={slicePath(CX, CY, R, seg.startDeg, seg.endDeg)}
              fill={seg.color}
              stroke="var(--border)"
              strokeWidth={1}
            />
          </g>
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
        {segments.map((seg, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: seg.color,
                flexShrink: 0,
              }}
            />
            <span>
              {seg.label}: {seg.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
