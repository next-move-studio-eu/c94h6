/**
 * Color utilities for presenting DOT diagram blocks with
 * theme-aware colors. Handles CSS variable resolution, color parsing (hex, rgb, CSS names),
 * OKLCH luminosity adjustment for light/dark contrast, and SVG color post-processing.
 *
 * OKLCH (perceptual color space) is used instead of HSL because its L channel is
 * perceptually uniform — L=0.70 looks equally bright regardless of hue. This lets us
 * pick absolute luminosity targets per visual role rather than relative offsets.
 */

export interface DiagramThemeColors {
  bg: string;
  surfaceHigh: string;
  text: string;
  border: string;
  surface: string;
}

/** Unwrap simple var(--token) references on :root (no fallback argument). */
function unwrapVarChain(initial: string, root: HTMLElement, maxDepth: number): string {
  let raw = initial.trim();
  let depth = 0;
  while (raw.startsWith('var(') && depth < maxDepth) {
    const m = /^var\(\s*([^),]+)/.exec(raw);
    if (!m) break;
    const next = getComputedStyle(root).getPropertyValue(m[1].trim()).trim();
    if (!next) break;
    raw = next;
    depth++;
  }
  return raw;
}

/**
 * Resolve a CSS variable to a hex color Graphviz and parseColor() understand.
 * Tokens may be OKLCH or other modern syntax; getPropertyValue alone returns those literals,
 * which Graphviz rejects (black canvas). We always resolve through computed style → RGB → hex.
 */
export function getResolvedCssVar(name: string): string {
  const root = document.documentElement;
  let raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return '#888888';
  raw = unwrapVarChain(raw, root, 12);

  const directRgb = parseColor(raw);
  if (directRgb) return rgbToHex(directRgb[0], directRgb[1], directRgb[2]);

  try {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.backgroundColor = raw;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).backgroundColor;
    document.body.removeChild(div);
    const rgb = parseColor(computed);
    if (rgb) return rgbToHex(rgb[0], rgb[1], rgb[2]);
  } catch {
    /* ignore */
  }
  return '#888888';
}

/** Read root theme colors from CSS variables. */
export function getRootThemeColors(): DiagramThemeColors {
  return {
    bg:          getResolvedCssVar('--bg'),
    surfaceHigh: getResolvedCssVar('--surfaceHigh'),
    text:        getResolvedCssVar('--text'),
    border:      getResolvedCssVar('--border'),
    surface:     getResolvedCssVar('--surface'),
  };
}

/** Parse color string to [r, g, b] 0–255 or null. Supports #hex, rgb(), rgba(), and space syntax. */
export function parseColor(s: string): [number, number, number] | null {
  if (!s || s === 'none') return null;
  const t = s.trim();
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(t);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return [r, g, b];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(t);
  if (rgb) return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  const rgba = /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/.exec(t);
  if (rgba) return [parseInt(rgba[1], 10), parseInt(rgba[2], 10), parseInt(rgba[3], 10)];
  const rgbS = /^rgba?\s*\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*[\d.]+\s*)?\)$/.exec(t);
  if (rgbS) return [parseInt(rgbS[1], 10), parseInt(rgbS[2], 10), parseInt(rgbS[3], 10)];
  // Handle oklch() — colors.ts uses CSS Color Level 4 OKLCH tokens; oklchToRgb is hoisted below.
  const oklchM = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)$/.exec(t);
  if (oklchM) {
    const L = oklchM[1].endsWith('%') ? parseFloat(oklchM[1]) / 100 : parseFloat(oklchM[1]);
    return oklchToRgb(Math.max(0, Math.min(1, L)), parseFloat(oklchM[2]), parseFloat(oklchM[3]));
  }
  return null;
}

const cssColorCache = new Map<string, [number, number, number]>();
/** Resolve any CSS color (including names like "yellow", "pink") to RGB via a temporary element. Cached. */
export function resolveCssColor(s: string): [number, number, number] | null {
  if (!s || s === 'none') return null;
  const key = s.trim();
  const cached = cssColorCache.get(key);
  if (cached) return cached;
  try {
    const div = document.createElement('div');
    div.style.color = key;
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    const rgb = parseColor(computed);
    if (rgb) cssColorCache.set(key, rgb);
    return rgb;
  } catch {
    return null;
  }
}

/** Parse color (hex/rgb) or resolve CSS color names; preserves hue for post-processing. */
export function parseColorOrResolve(s: string): [number, number, number] | null {
  return parseColor(s) ?? resolveCssColor(s);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// OKLCH perceptual color space
// ---------------------------------------------------------------------------
// OKLCH (L = perceptual lightness, C = chroma, H = hue angle) is perceptually
// uniform: shifting L by the same amount produces the same perceived brightness
// change regardless of hue. This is superior to HSL whose L channel is not
// uniform (orange at L=0.5 looks much brighter than blue at L=0.5).
//
// Conversion path: sRGB → Linear RGB → XYZ-D65 → OKLab → OKLCH
// Reference: https://bottosson.github.io/posts/oklab/

function linearizeChannel(c: number): number {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function gammaEncodeChannel(c: number): number {
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** sRGB [0-255] → OKLCH [L ∈ 0-1, C ∈ 0-~0.4, H ∈ 0-360]. */
export function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const lr = linearizeChannel(r);
  const lg = linearizeChannel(g);
  const lb = linearizeChannel(b);

  // Linear RGB → LMS cone responses (cube-root compressed)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  // LMS → OKLab
  const L =  0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a =  1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bk = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

  const C = Math.sqrt(a * a + bk * bk);
  const H = C > 0.0001 ? ((Math.atan2(bk, a) * 180) / Math.PI + 360) % 360 : 0;
  return [L, C, H];
}

/** OKLCH → sRGB [0-255], with sRGB gamut clamp. */
export function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → LMS (cube of inverse matrix)
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.2914855480 * b;
  const lr = l * l * l;
  const mr = m * m * m;
  const sr = s * s * s;

  // LMS → Linear RGB
  const ri =  4.0767416621 * lr - 3.3077115913 * mr + 0.2309699292 * sr;
  const gi = -1.2684380046 * lr + 2.6097574011 * mr - 0.3413193965 * sr;
  const bi = -0.0041960863 * lr - 0.7034186147 * mr + 1.7076147010 * sr;

  return [
    Math.round(gammaEncodeChannel(ri) * 255),
    Math.round(gammaEncodeChannel(gi) * 255),
    Math.round(gammaEncodeChannel(bi) * 255),
  ];
}

// ---------------------------------------------------------------------------
// OKLCH luminosity target constants
// ---------------------------------------------------------------------------
// Diagrams now sit directly on the page background (bg), not on surfaceHigh.
// These absolute OKLCH L targets are chosen for each visual role so that
// colors are readable and clearly differentiated on both light and dark pages.
//
// The author's H (hue) and C (chroma) are preserved; only L is replaced.
// Out-of-gamut results are clamped to sRGB by gammaEncodeChannel (above).

/**
 * Colored fills: DOT node boxes, bar chart bars, pie slices.
 * Light mode: vivid and clearly visible on the near-white surface.
 * Dark mode: subdued, close to surface — hue is preserved but boxes do not appear as
 * bright islands. This keeps TEXT_L_DARK (0.90) accessible everywhere without
 * any per-node adaptive logic (contrast ~6.9:1 on fills at L 0.30).
 */
export const FILLS_L_LIGHT   = 0.70;
export const FILLS_L_DARK    = 0.30;

/** Thin structural lines: DOT edges & arrows, axis lines, node outlines. Darker/lighter than fills. */
export const STROKES_L_LIGHT = 0.42;
export const STROKES_L_DARK  = 0.80;

/** Diagram text labels. High contrast against the page background. */
export const TEXT_L_LIGHT    = 0.22;
export const TEXT_L_DARK     = 0.90;

// ---------------------------------------------------------------------------
// Core postprocessing helper
// ---------------------------------------------------------------------------

/**
 * Shift an RGB color to a target OKLCH luminosity while preserving hue and chroma.
 * Returns hex. If the color cannot be parsed, returns the original string.
 */
export function setOklchLuminosity(rgb: [number, number, number], targetL: number): string {
  const [, C, H] = rgbToOklch(rgb[0], rgb[1], rgb[2]);
  const [r, g, b] = oklchToRgb(Math.max(0, Math.min(1, targetL)), C, H);
  return rgbToHex(r, g, b);
}

/**
 * Adjust a fill color for diagram use (bar/pie series, DOT nodes):
 * shift to FILLS target for the current mode, preserving hue and chroma.
 */
export function themeAdjustDiagramColor(color: string): string {
  const isDark = document.documentElement.getAttribute('data-mode') === 'dark';
  const rgb = parseColorOrResolve(color);
  if (!rgb) return color;
  return setOklchLuminosity(rgb, isDark ? FILLS_L_DARK : FILLS_L_LIGHT);
}

/** Get fill or stroke from element or first ancestor that has it (Graphviz may put fill on parent <g>). */
export function getEffectiveColor(el: Element, attr: 'fill' | 'stroke'): string | null {
  let e: Element | null = el;
  while (e) {
    const v = e.getAttribute(attr);
    if (v && v !== 'none') return v;
    const style = (e as SVGElement).style;
    if (style?.getPropertyValue) {
      const fromStyle = style.getPropertyValue(attr).trim();
      if (fromStyle && fromStyle !== 'none') return fromStyle;
    }
    e = e.parentElement;
  }
  return null;
}

// ---------------------------------------------------------------------------
// DOT diagram specific
// ---------------------------------------------------------------------------

/** Injects root-theme graph/node/edge attributes into DOT source (hpcc-js Graphviz).
 *  Graph bgcolor is transparent so the SVG has no full-bleed plate; prose surface shows through.
 *  Node/edge defaults still use theme colors; post-processing adjusts fill L for readable `theme.text`. */
export function injectThemeIntoDot(dot: string, colors: DiagramThemeColors): string {
  const escaped = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
  const themeStmt = ` graph [bgcolor=${escaped('transparent')} fontcolor=${escaped(colors.text)}]; node [color=${escaped(colors.border)} fontcolor=${escaped(colors.text)} fillcolor=${escaped(colors.surface)}]; edge [color=${escaped(colors.border)} fontcolor=${escaped(colors.text)}]; `;
  const idx = dot.indexOf('{');
  if (idx === -1) return dot;
  return dot.slice(0, idx + 1) + themeStmt + dot.slice(idx + 1);
}

/** Theme subset used for SVG post-processing. */
export interface DotSvgThemeColors {
  /** The surface color the diagram sits on (article prose container = --surface). */
  surface: string;
  text: string;
  border: string;
}

/**
 * Apply color post-processing to DOT-rendered SVG using OKLCH:
 * (1) graph canvas (outer plate) → no fill; cluster panels → `theme.surface`,
 * (2) node box fills → FILLS L target (hue/chroma preserved) so `theme.text` reads on nodes,
 * (3) edges & arrows → STROKES L target,
 * (4) text / tspan → exact `theme.text`, stroke removed (Graphviz often sets black stroke → “double” glyphs).
 */
export function applyDotSvgColorPostProcessing(
  svgString: string,
  theme: DotSvgThemeColors
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const surfaceRgb = parseColor(theme.surface);
  const textRgb = parseColor(theme.text);
  const borderRgb = parseColor(theme.border);
  if (!surfaceRgb) return svgString;

  // Determine dark/light mode from the surface the diagram sits on
  const [surfaceL] = rgbToOklch(surfaceRgb[0], surfaceRgb[1], surfaceRgb[2]);
  const isDark = surfaceL < 0.5;

  const fillsL   = isDark ? FILLS_L_DARK   : FILLS_L_LIGHT;
  const strokesL = isDark ? STROKES_L_DARK : STROKES_L_LIGHT;

  // Fallback hex when the element has no parseable color
  const defaultStrokeHex = borderRgb
    ? setOklchLuminosity(borderRgb, strokesL)
    : textRgb
      ? setOklchLuminosity(textRgb, isDark ? TEXT_L_DARK : TEXT_L_LIGHT)
      : isDark
        ? '#e6e6e6'
        : '#1a1a1a';

  let graphBackgroundSet = false;
  const clusterBackgroundSet = new Set<Element>();

  /** Graphviz often wraps the canvas in an extra <g>; require ancestor graph, not parent id. */
  function isGraphBackground(el: Element): boolean {
    if (graphBackgroundSet) return false;
    const graphG = el.closest('g[id^="graph"]');
    if (!graphG) return false;
    if (el.closest('g[id^="node"]')) return false;
    if (el.closest('g[id^="edge"]')) return false;
    if (el.closest('g[id^="cluster"]')) return false;
    const tag = el.tagName.toLowerCase();
    const fill = el.getAttribute('fill');
    return (tag === 'polygon' || tag === 'rect') && !!fill && fill !== 'none';
  }

  function findCluster(el: Element): Element | null {
    return el.closest('g[id^="cluster"], g[class~="cluster"]');
  }

  function isGroupBackground(el: Element): boolean {
    const clusterG = findCluster(el);
    if (!clusterG) return false;
    if (clusterBackgroundSet.has(clusterG)) return false;
    if (el.closest('g[id^="node"]')) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'polygon' || tag === 'rect';
  }

  function applyColor(
    el: Element,
    attr: 'fill' | 'stroke',
    kind: 'background' | 'box' | 'stroke',
    fallbackHex: string,
    effectiveRaw?: string | null
  ) {
    const raw = effectiveRaw ?? el.getAttribute(attr);
    if (raw?.startsWith('url(')) return;
    if (kind === 'background') {
      el.setAttribute(attr, theme.surface);
      return;
    }
    const rgb = raw && raw !== 'none' ? parseColorOrResolve(raw) : parseColorOrResolve(fallbackHex);
    if (!rgb) return;
    const targetL = kind === 'box' ? fillsL : strokesL;
    el.setAttribute(attr, setOklchLuminosity(rgb, targetL));
  }

  /** Body / labels use app primary text; do not OKLCH-shift (avoids doubled black with Graphviz stroke). */
  function applyThemedLabel(el: Element) {
    el.setAttribute('fill', theme.text);
    el.setAttribute('stroke', 'none');
    el.removeAttribute('stroke-width');
    el.removeAttribute('stroke-opacity');
  }

  function walk(el: Element) {
    const tag = el.tagName.toLowerCase();
    const fillRaw = el.getAttribute('fill');
    const fillEffective = getEffectiveColor(el, 'fill');
    const strokeEffective = getEffectiveColor(el, 'stroke');
    const inNode = el.closest('g[id^="node"]');
    const inEdge = el.closest('g[id^="edge"]');
    const isText = tag === 'text';
    const isTspan = tag === 'tspan';

    if (isGraphBackground(el)) {
      if (fillRaw && fillRaw !== 'none') {
        el.setAttribute('fill', 'none');
        graphBackgroundSet = true;
      }
      for (let i = 0; i < el.children.length; i++) walk(el.children[i] as Element);
      return;
    }
    if (isGroupBackground(el)) {
      el.setAttribute('fill', theme.surface);
      const clusterG = findCluster(el);
      if (clusterG) clusterBackgroundSet.add(clusterG);
      for (let i = 0; i < el.children.length; i++) walk(el.children[i] as Element);
      return;
    }

    const isNodeShape =
      (tag === 'polygon' || tag === 'ellipse' || tag === 'path' || tag === 'rect') &&
      inNode &&
      fillEffective &&
      fillEffective !== 'none';

    if (isNodeShape) {
      applyColor(el, 'fill', 'box', theme.surface, fillEffective);
      if (strokeEffective && strokeEffective !== 'none')
        applyColor(el, 'stroke', 'stroke', defaultStrokeHex, strokeEffective);
    } else if (isText || isTspan) {
      applyThemedLabel(el);
    } else if (inEdge || tag === 'path' || (tag === 'polygon' && inEdge)) {
      if (fillEffective && fillEffective !== 'none')
        applyColor(el, 'fill', 'stroke', defaultStrokeHex, fillEffective);
      if (strokeEffective && strokeEffective !== 'none')
        applyColor(el, 'stroke', 'stroke', defaultStrokeHex, strokeEffective);
    } else {
      const inGraph = el.closest('g[id^="graph"]');
      const isOtherShape = tag === 'polygon' || tag === 'ellipse' || tag === 'rect' || tag === 'path';
      // Leftover shapes under the graph root (e.g. canvas with odd nesting): clear plate fill, not OKLCH gray.
      if (inGraph && !inNode && !inEdge && !el.closest('g[id^="cluster"]') && isOtherShape) {
        const canvasFill = tag === 'polygon' || tag === 'rect';
        if (canvasFill && fillEffective && fillEffective !== 'none') {
          el.setAttribute('fill', 'none');
        } else if (fillEffective && fillEffective !== 'none') {
          applyColor(el, 'fill', 'stroke', defaultStrokeHex, fillEffective);
        }
        if (strokeEffective && strokeEffective !== 'none')
          applyColor(el, 'stroke', 'stroke', defaultStrokeHex, strokeEffective);
      }
    }

    for (let i = 0; i < el.children.length; i++) walk(el.children[i] as Element);
  }

  const root = doc.documentElement;
  if (root) walk(root);
  return new XMLSerializer().serializeToString(doc);
}
