/**
 * Helpers for RDKit SVG: theme with text color and no background.
 * RDKit draws a white rect and uses element-specific colors (e.g. O, S);
 * we post-process the SVG to apply our color and remove the background.
 */
import { formatHex, parse } from 'culori';

/**
 * Normalize hex to #rrggbb for SVG (RDKit uses 6-digit hex in output).
 */
function normalizeHex(hex: string): string {
  const h = hex.replace(/^#/, '');
  if (h.length === 3) {
    const r = h[0] + h[0], g = h[1] + h[1], b = h[2] + h[2];
    return '#' + r + g + b;
  }
  return h.length === 6 ? '#' + h : '#18181b';
}

/**
 * Theme tokens use oklch / CSS colors; SVG recoloring needs a concrete #rrggbb string.
 * Without this, non-hex values fall through normalizeHex() to a dark gray default.
 */
function resolveThemeTextToHex(themeColor: string): string {
  const parsed = parse(themeColor);
  if (parsed != null) {
    const hex = formatHex(parsed);
    if (hex.length === 7 && hex.startsWith('#')) {
      return hex;
    }
  }
  return normalizeHex(themeColor);
}

const TRANSPARENT_PLACEHOLDER = '__FILL_NONE__';

/** CSS/SVG color names RDKit may use for atoms (e.g. S, O). All get replaced with theme color. */
const NAMED_COLORS =
  'gold|yellow|orange|brown|red|blue|green|cyan|magenta|purple|pink|black|grey|gray|white|navy|teal|lime|olive|maroon|coral|salmon|tan|khaki|violet|indigo|silver';

/**
 * Post-process RDKit SVG: single color from theme (text color), no background.
 * Replaces all fill/stroke with the resolved theme color and makes the background rect transparent.
 */
export function themeSmilesSvg(svg: string, themeTextColor: string): string {
  const color = resolveThemeTextToHex(themeTextColor);

  // 1) Mark white background as transparent (so we don't recolor it)
  let out = svg.replace(/\bfill:#fff(fff)?\b/gi, TRANSPARENT_PLACEHOLDER);
  out = out.replace(/\bfill:\s*white\b/gi, TRANSPARENT_PLACEHOLDER);
  out = out.replace(/\bfill=["']white["']/gi, TRANSPARENT_PLACEHOLDER);

  // 2) Hex in style (fill:#abc, stroke:#def)
  out = out.replace(/\bfill:#[0-9a-fA-F]{3,8}\b/g, `fill:${color}`);
  out = out.replace(/\bstroke:#[0-9a-fA-F]{3,8}\b/g, `stroke:${color}`);
  // 3) Hex in attributes fill="#abc" or fill='#abc'
  out = out.replace(/\bfill=["']#[0-9a-fA-F]{3,8}["']/g, `fill="${color}"`);
  out = out.replace(/\bstroke=["']#[0-9a-fA-F]{3,8}["']/g, `stroke="${color}"`);
  // 4) RGB in style
  out = out.replace(/\bfill:rgb\([^)]+\)/g, `fill:${color}`);
  out = out.replace(/\bstroke:rgb\([^)]+\)/g, `stroke:${color}`);
  out = out.replace(/\bfill:\s*rgb\([^)]+\)/g, `fill:${color}`);
  out = out.replace(/\bstroke:\s*rgb\([^)]+\)/g, `stroke:${color}`);
  // 5) Named colors in style (e.g. fill:gold, stroke:yellow)
  const namedRe = new RegExp(`\\b(fill|stroke):(${NAMED_COLORS})\\b`, 'gi');
  out = out.replace(namedRe, `$1:${color}`);
  // 6) Named colors in attributes fill="gold" or fill='gold'
  const namedAttrRe = new RegExp(`\\b(fill|stroke)=["'](${NAMED_COLORS})["']`, 'gi');
  out = out.replace(namedAttrRe, (_, attr) => `${attr}="${color}"`);
  // 7) Catch-all: any remaining fill="..." or stroke="..." that isn't "none" or our color
  out = out.replace(/\bfill="([^"]+)"/g, (_, v) => (v === 'none' || v === color ? `fill="${v}"` : `fill="${color}"`));
  out = out.replace(/\bstroke="([^"]+)"/g, (_, v) => (v === 'none' || v === color ? `stroke="${v}"` : `stroke="${color}"`));
  out = out.replace(/\bfill='([^']+)'/g, (_, v) => (v === 'none' || v === color ? `fill='${v}'` : `fill='${color}'`));
  out = out.replace(/\bstroke='([^']+)'/g, (_, v) => (v === 'none' || v === color ? `stroke='${v}'` : `stroke='${color}'`));

  // 8) Restore transparent background
  out = out.split(TRANSPARENT_PLACEHOLDER).join('fill:none');

  return out;
}
