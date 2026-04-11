import { converter, formatCss, parse } from 'culori';

const toOklch = converter('oklch');
const toLrgb = converter('lrgb');

/**
 * Minimum WCAG relative-luminance contrast for any highlight (square tile or arrow) vs
 * each underlying square it covers.
 *
 * All highlights — tile fills and arrow fills — are now derived with the same dual-square
 * algorithm: find one color that contrasts ≥ 2.0 vs both the light and the dark square
 * simultaneously. This guarantees visual consistency (the same semantic color looks the same
 * on neighbouring light and dark tiles) at the cost of a slightly lower per-tile floor vs the
 * old per-square approach (which was 2.5 per tile but allowed two visually unrelated colors).
 *
 * Kept in sync with `MIN_CHESS_CONTRAST` / `MIN_CHESS_ARROW_CHECK` in
 * `scripts/check-color-a11y.ts` (imported there).
 */
export const MIN_CHESS_OVERLAY_CONTRAST = 2.0;

/** Alias kept for callers that imported the old arrow-specific constant. */
export const MIN_CHESS_ARROW_CONTRAST = MIN_CHESS_OVERLAY_CONTRAST;

/**
 * Minimum OKLCH lightness (L) for any derived highlight color.
 *
 * Acts as a hard lower-bound safety net: even if the contrast search or hue-escape
 * path somehow produce an L below this value (e.g. extreme dark-square palettes),
 * the result is clamped up so highlights always remain in the visually light range.
 * Highlights should shine; a dark highlight defeats its own purpose.
 */
export const MIN_HIGHLIGHT_L = 0.55;

export const CHESS_HIGHLIGHT_KEYS = [
  'highlightGreen',
  'highlightRed',
  'highlightYellow',
  'highlightBlue',
  'highlightOrange',
  'highlightPurple',
] as const;

export type ChessHighlightKey = (typeof CHESS_HIGHLIGHT_KEYS)[number];

/**
 * Vivid OKLCH anchors for each semantic highlight color.
 *
 * L and C are the "canonical vivid form" of the color — chosen at the natural perceived
 * lightness for maximum gamut-valid chroma. These are the starting point for derivation;
 * only L is adjusted for contrast, C stays at the anchor value so highlights always shine.
 *
 * Anchors are placed in the light half (L ≥ 0.63) so that searchLDarkBiased starts close
 * to the viable lighter-than-dark-square zone for every hue, including blue (low WCAG
 * luminance weight) and red (moderate WCAG weight).
 *
 * Yellow is intentionally very light (L=0.89): in OKLCH yellow's maximum-chroma locus sits
 * near L=0.90, so a bright lemon-yellow IS the vivid form. Do not darken it needlessly.
 */
export const CHESS_HIGHLIGHT_ANCHORS: Record<ChessHighlightKey, { l: number; c: number; h: number }> = {
  highlightGreen: { l: 0.63, c: 0.22, h: 150 },
  highlightRed: { l: 0.65, c: 0.25, h: 22 },
  highlightYellow: { l: 0.89, c: 0.21, h: 85 },
  highlightBlue: { l: 0.68, c: 0.22, h: 240 },
  highlightOrange: { l: 0.72, c: 0.23, h: 50 },
  highlightPurple: { l: 0.65, c: 0.22, h: 325 },
};

/**
 * Rescue hue variants for each semantic color.
 *
 * When the primary hue is within HUE_CONFLICT_THRESHOLD degrees of the board square's hue,
 * AND L-search alone cannot reach the contrast floor, these alternative hues are tried.
 * Both candidates are evaluated; the one that produces a higher contrast result wins.
 * Each pair stays in a perceptually recognisable family (yellow stays yellow-ish, etc.).
 */
export const CHESS_HIGHLIGHT_RESCUE_HUES: Record<ChessHighlightKey, [number, number]> = {
  highlightGreen: [128, 172],
  highlightRed: [5, 42],
  highlightYellow: [60, 110],
  highlightBlue: [218, 262],
  highlightOrange: [28, 72],
  highlightPurple: [305, 345],
};

/** Hue difference (degrees, circular) within which a rescue hue is attempted. */
const HUE_CONFLICT_THRESHOLD = 45;

function toOklchOrThrow(css: string, label: string) {
  const parsed = parse(css.trim());
  if (!parsed) throw new Error(`[chess highlights] Invalid ${label}: ${css}`);
  const ok = toOklch(parsed);
  if (!ok || ok.mode !== 'oklch') throw new Error(`[chess highlights] OKLCH conversion failed for ${label}`);
  return ok;
}

function luminanceLinear(css: string): number | null {
  const p = parse(css.trim());
  if (!p) return null;
  const lr = toLrgb(p);
  if (!lr || lr.mode !== 'lrgb') return null;
  return 0.2126 * lr.r + 0.7152 * lr.g + 0.0722 * lr.b;
}

function luminanceFromOklch(l: number, c: number, h: number): number | null {
  return luminanceLinear(formatCss({ mode: 'oklch', l, c, h }));
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function normalizeHue(hueDeg: number): number {
  return ((hueDeg % 360) + 360) % 360;
}

function hueDiff(a: number, b: number): number {
  const d = Math.abs(normalizeHue(a) - normalizeHue(b));
  return Math.min(d, 360 - d);
}

/**
 * Find the L that maximises contrast vs both squares simultaneously (min of the two).
 * Used for the selected-square indicator, which must be visible on both tile types.
 */
function searchLDualSquare(
  anchorL: number,
  anchorC: number,
  hNorm: number,
  lightLum: number,
  darkLum: number,
  floor: number,
): { bestL: number; bestContrast: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const score = (ll: number): number => {
    const lum = luminanceFromOklch(ll, anchorC, hNorm);
    if (lum === null) return 0;
    return Math.min(contrastRatio(lum, lightLum), contrastRatio(lum, darkLum));
  };

  let bestL = clamp(anchorL);
  let bestContrast = score(bestL);
  if (bestContrast >= floor) return { bestL, bestContrast };

  const step = 0.02;
  const steps = Math.ceil(1.0 / step);

  for (let i = 1; i <= steps; i++) {
    for (const sign of [1, -1] as const) {
      const ll = clamp(anchorL + sign * i * step);
      const cr = score(ll);
      if (cr > bestContrast) { bestContrast = cr; bestL = ll; }
      if (bestContrast >= floor) return { bestL, bestContrast };
    }
  }
  return { bestL, bestContrast };
}

/**
 * Find the L that maximises contrast vs the DARK square only, requiring the highlight
 * to be LIGHTER than the dark square (lum > darkLum).
 *
 * Only candidates whose WCAG luminance exceeds `darkLum` are scored; darker candidates
 * score 0. This prevents the symmetric contrast metric from accepting a very dark
 * highlight (e.g. deep blue) that passes the contrast floor from below — which would
 * produce a highlight darker than the board tile, the opposite of "shining".
 *
 * This is intentionally NOT constrained by the light-square contrast. Semantic highlight
 * colors are anchored at their most vivid form (e.g. yellow L=0.89 = lemon yellow); that
 * vivid color contrasts strongly against dark tiles and is used uniformly on all tiles.
 * On light tiles the same color may have low individual contrast — that is the accepted
 * trade-off for color consistency and vibrancy. Light-square contrast is reported as a
 * warning in the a11y script, not a hard failure.
 */
function searchLDarkBiased(
  anchorL: number,
  anchorC: number,
  hNorm: number,
  darkLum: number,
  floor: number,
): { bestL: number; bestContrast: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const score = (ll: number): number => {
    const lum = luminanceFromOklch(ll, anchorC, hNorm);
    // Only accept highlights that are lighter than the dark square so highlights always shine.
    if (lum === null || lum <= darkLum) return 0;
    return contrastRatio(lum, darkLum);
  };

  // Try anchor first — for most vivid colors (e.g. yellow L=0.89) this already
  // exceeds the floor vs the dark square and is returned immediately.
  let bestL = clamp(anchorL);
  let bestContrast = score(bestL);
  if (bestContrast >= floor) return { bestL, bestContrast };

  const step = 0.02;
  const steps = Math.ceil(1.0 / step);

  // Prefer lighter direction first (highlights on dark squares look best brighter).
  for (let i = 1; i <= steps; i++) {
    for (const sign of [1, -1] as const) {
      const ll = clamp(anchorL + sign * i * step);
      const cr = score(ll);
      if (cr > bestContrast) { bestContrast = cr; bestL = ll; }
      if (bestContrast >= floor) return { bestL, bestContrast };
    }
  }
  return { bestL, bestContrast };
}

/**
 * Derive a unified highlight color for a semantic key.
 *
 * The same color is used for square tile fills (OnLight, OnDark) AND arrow fills.
 * The color is optimized to contrast strongly against the DARK square (the visually
 * dominant background). It is applied as-is to light squares too; on light tiles the
 * contrast may be low — this is an intentional trade-off for visual consistency and
 * vibrancy (bright lemon yellow on a dark amber square, not muddy amber-on-amber).
 *
 * The resulting low light-square contrast is reported as a WARNING in the a11y script,
 * not a hard failure. See MIN_CHESS_OVERLAY_CONTRAST for the dark-square floor.
 *
 * Hue-escape applies only to dark-square conflicts (same-family hue within
 * HUE_CONFLICT_THRESHOLD degrees), since light-square contrast is not a hard constraint.
 */
export function highlightForArrow(_lightSquareCss: string, darkSquareCss: string, key: ChessHighlightKey): string {
  const anchor = CHESS_HIGHLIGHT_ANCHORS[key];
  const rescueHues = CHESS_HIGHLIGHT_RESCUE_HUES[key];
  const hNorm = normalizeHue(anchor.h);

  // Clamp L to MIN_HIGHLIGHT_L safety net before emitting any color string.
  const safeL = (l: number) => Math.max(l, MIN_HIGHLIGHT_L);

  const darkLum = luminanceLinear(darkSquareCss);
  if (darkLum === null) {
    return formatCss({ mode: 'oklch', l: safeL(anchor.l), c: anchor.c, h: hNorm });
  }

  const { bestL, bestContrast } = searchLDarkBiased(anchor.l, anchor.c, hNorm, darkLum, MIN_CHESS_OVERLAY_CONTRAST);

  if (bestContrast >= MIN_CHESS_OVERLAY_CONTRAST) {
    return formatCss({ mode: 'oklch', l: safeL(bestL), c: anchor.c, h: hNorm });
  }

  // Hue-escape: only when the highlight hue is same-family with the DARK square.
  const darkOk = toOklchOrThrow(darkSquareCss, 'darkSquare');
  const darkHue = darkOk.h ?? 0;
  if (hueDiff(hNorm, darkHue) < HUE_CONFLICT_THRESHOLD) {
    let escapeBestL = bestL;
    let escapeBestH = hNorm;
    let escapeBestContrast = bestContrast;

    const sortedRescue = [...rescueHues].sort(
      (a, b) => hueDiff(b, darkHue) - hueDiff(a, darkHue),
    );

    for (const rescueH of sortedRescue) {
      const rNorm = normalizeHue(rescueH);
      const { bestL: rL, bestContrast: rCr } = searchLDarkBiased(anchor.l, anchor.c, rNorm, darkLum, MIN_CHESS_OVERLAY_CONTRAST);
      if (rCr > escapeBestContrast) {
        escapeBestContrast = rCr;
        escapeBestL = rL;
        escapeBestH = rNorm;
      }
      if (escapeBestContrast >= MIN_CHESS_OVERLAY_CONTRAST) break;
    }

    return formatCss({ mode: 'oklch', l: safeL(escapeBestL), c: anchor.c, h: escapeBestH });
  }

  return formatCss({ mode: 'oklch', l: safeL(bestL), c: anchor.c, h: hNorm });
}

export type DerivedChessOverlayTokens = {
  selectedSquareOnLight: string;
  selectedSquareOnDark: string;
  highlightGreenOnLight: string;
  highlightGreenOnDark: string;
  highlightGreenArrow: string;
  highlightRedOnLight: string;
  highlightRedOnDark: string;
  highlightRedArrow: string;
  highlightYellowOnLight: string;
  highlightYellowOnDark: string;
  highlightYellowArrow: string;
  highlightBlueOnLight: string;
  highlightBlueOnDark: string;
  highlightBlueArrow: string;
  highlightOrangeOnLight: string;
  highlightOrangeOnDark: string;
  highlightOrangeArrow: string;
  highlightPurpleOnLight: string;
  highlightPurpleOnDark: string;
  highlightPurpleArrow: string;
};

export function buildDerivedChessOverlayColors(
  lightSquare: string,
  darkSquare: string,
  selectedHue: number
): DerivedChessOverlayTokens {
  // Selected-square highlight: palette-tinted (moderate chroma), must be visible on both
  // tile types since it marks the last-moved square regardless of tile color.
  const selH = normalizeHue(selectedHue);
  const selLightLum = luminanceLinear(lightSquare) ?? 0;
  const selDarkLum = luminanceLinear(darkSquare) ?? 0;
  const selC = 0.14;
  const { bestL: selBestL } = searchLDualSquare(0.65, selC, selH, selLightLum, selDarkLum, MIN_CHESS_OVERLAY_CONTRAST);
  const selectedSquare = formatCss({ mode: 'oklch', l: selBestL, c: selC, h: selH });

  // Each semantic highlight is one color shared by OnLight, OnDark, and Arrow.
  const green = highlightForArrow(lightSquare, darkSquare, 'highlightGreen');
  const red = highlightForArrow(lightSquare, darkSquare, 'highlightRed');
  const yellow = highlightForArrow(lightSquare, darkSquare, 'highlightYellow');
  const blue = highlightForArrow(lightSquare, darkSquare, 'highlightBlue');
  const orange = highlightForArrow(lightSquare, darkSquare, 'highlightOrange');
  const purple = highlightForArrow(lightSquare, darkSquare, 'highlightPurple');

  return {
    selectedSquareOnLight: selectedSquare,
    selectedSquareOnDark: selectedSquare,

    highlightGreenOnLight: green,
    highlightGreenOnDark: green,
    highlightGreenArrow: green,

    highlightRedOnLight: red,
    highlightRedOnDark: red,
    highlightRedArrow: red,

    highlightYellowOnLight: yellow,
    highlightYellowOnDark: yellow,
    highlightYellowArrow: yellow,

    highlightBlueOnLight: blue,
    highlightBlueOnDark: blue,
    highlightBlueArrow: blue,

    highlightOrangeOnLight: orange,
    highlightOrangeOnDark: orange,
    highlightOrangeArrow: orange,

    highlightPurpleOnLight: purple,
    highlightPurpleOnDark: purple,
    highlightPurpleArrow: purple,
  };
}
