/**
 * Renders Graphviz DOT source as SVG using @hpcc-js/wasm.
 * Diagram colors follow theme CSS variables; re-renders when theme changes.
 * Color processing (theme injection + SVG post-processing) is in utils/diagramColorUtils.
 */
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getRootThemeColors,
  injectThemeIntoDot,
  applyDotSvgColorPostProcessing,
} from '../../utils/diagramColorUtils';

interface DotDiagramProps {
  /** Graphviz DOT source. */
  content: string;
  /** Optional class for the wrapper. */
  className?: string;
  /** When true, show info icon in top-right with tooltip about color post-processing (editor preview only). */
  showPostprocessInfo?: boolean;
}

export default function DotDiagram({ content, className, showPostprocessInfo }: DotDiagramProps) {
  const { t } = useTranslation('articleBlocks');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState(() => document.documentElement.getAttribute('data-mode') ?? 'light');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeMode(document.documentElement.getAttribute('data-mode') ?? 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!content?.trim()) {
      setSvg(null);
      setError(null);
      return;
    }
    const colors = getRootThemeColors();
    const themedDot = injectThemeIntoDot(content.trim(), colors);
    let cancelled = false;
    (async () => {
      setError(null);
      setSvg(null);
      try {
        const { Graphviz } = await import('@hpcc-js/wasm');
        const g = await Graphviz.load();
        const rawSvg = g.layout(themedDot, 'svg', 'dot');
        const processed = applyDotSvgColorPostProcessing(rawSvg, {
          surface: colors.surface,
          text: colors.text,
          border: colors.border,
        });
        if (!cancelled) setSvg(processed);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('dotDiagram.renderFailed'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content, themeMode, t]);

  if (error) {
    return (
      <div
        className={className}
        style={{
          padding: '1rem',
          border: '1px solid var(--error)',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--errorSubtle)',
          color: 'var(--error)',
          fontSize: '0.875rem',
        }}
      >
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={className} style={{ padding: '1rem', color: 'var(--textSecondary)', fontSize: '0.875rem' }}>
        {t('dotDiagram.loading')}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }} dangerouslySetInnerHTML={{ __html: svg }} />
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
    </div>
  );
}
