import type { PaletteTokens } from '../themeTokens';

/** Must match `PALETTE_ORDER` in `colors.ts`. */
type ChessPaletteId =
  | 'default'
  | 'wine'
  | 'sage'
  | 'forest'
  | 'ocean'
  | 'lavender'
  | 'rose';

/**
 * Light UI: `frame` is a mid-light band (L~0.69–0.76) — lighter than the old dark rim but dark enough
 * vs `lightSquare` for `frame vs lightSquare` (a11y). Labels use `labelOnLightFrame`.
 * Dark UI: `frame` stays dark; labels use `labelOnDarkFrame`.
 */
const labelOnLightFrame = (h: number, L = 0.3, c = 0.07) => `oklch(${L} ${c} ${h})`;
const labelOnDarkFrame = (h: number, L = 0.94, c = 0.03) => `oklch(${L} ${c} ${h})`;

/**
 * Chess board base colors + selection hue. Square/arrow highlight fills are derived in `buildThemeTokens`
 * from `lightSquare`, `darkSquare`, and `selectedHue` (see `chessHighlightDerivation.ts`).
 */
export type ChessTokens = Pick<
  PaletteTokens,
  'lightSquare' | 'darkSquare' | 'frame' | 'boardLabel' | 'selectedHue'
>;

const defaultLight: ChessTokens = {
  lightSquare: 'oklch(0.85 0.07 92)',
  darkSquare: 'oklch(0.58 0.09 55)',
  frame: 'oklch(0.7 0.06 88)',
  boardLabel: labelOnLightFrame(70),
  selectedHue: 70,
};

const defaultDark: ChessTokens = {
  lightSquare: 'oklch(0.76 0.08 85)',
  darkSquare: 'oklch(0.54 0.09 50)',
  frame: 'oklch(0.4 0.07 48)',
  boardLabel: labelOnDarkFrame(48),
  selectedHue: 70,
};

/** Per-palette chess colors; overlays use semantic highlight hues + square L/C. */
export const chessByPalette: Record<ChessPaletteId, { light: ChessTokens; dark: ChessTokens }> = {
  default: { light: defaultLight, dark: defaultDark },

  wine: {
    light: {
      lightSquare: 'oklch(0.86 0.06 25)',
      darkSquare: 'oklch(0.57 0.11 18)',
      frame: 'oklch(0.7 0.055 22)',
      boardLabel: labelOnLightFrame(20),
      selectedHue: 18,
    },
    dark: {
      lightSquare: 'oklch(0.76 0.07 22)',
      darkSquare: 'oklch(0.56 0.095 16)',
      frame: 'oklch(0.38 0.08 18)',
      boardLabel: labelOnDarkFrame(18),
      selectedHue: 18,
    },
  },

  rose: {
    light: {
      lightSquare: 'oklch(0.86 0.08 355)',
      darkSquare: 'oklch(0.57 0.11 345)',
      frame: 'oklch(0.71 0.062 350)',
      boardLabel: labelOnLightFrame(348),
      selectedHue: 350,
    },
    dark: {
      lightSquare: 'oklch(0.76 0.09 350)',
      darkSquare: 'oklch(0.55 0.11 345)',
      frame: 'oklch(0.38 0.095 348)',
      boardLabel: labelOnDarkFrame(348),
      selectedHue: 348,
    },
  },

  lavender: {
    light: {
      lightSquare: 'oklch(0.85 0.08 300)',
      darkSquare: 'oklch(0.57 0.1 292)',
      frame: 'oklch(0.7 0.062 295)',
      boardLabel: labelOnLightFrame(295),
      selectedHue: 295,
    },
    dark: {
      lightSquare: 'oklch(0.75 0.09 295)',
      darkSquare: 'oklch(0.54 0.1 290)',
      frame: 'oklch(0.38 0.085 292)',
      boardLabel: labelOnDarkFrame(292),
      selectedHue: 292,
    },
  },

  ocean: {
    light: {
      lightSquare: 'oklch(0.84 0.075 252)',
      darkSquare: 'oklch(0.57 0.095 248)',
      frame: 'oklch(0.7 0.062 250)',
      boardLabel: labelOnLightFrame(250),
      selectedHue: 250,
    },
    dark: {
      lightSquare: 'oklch(0.75 0.085 250)',
      darkSquare: 'oklch(0.54 0.1 248)',
      frame: 'oklch(0.38 0.09 252)',
      boardLabel: labelOnDarkFrame(252),
      selectedHue: 250,
    },
  },

  forest: {
    light: {
      lightSquare: 'oklch(0.86 0.065 165)',
      darkSquare: 'oklch(0.58 0.09 172)',
      frame: 'oklch(0.71 0.056 168)',
      boardLabel: labelOnLightFrame(172),
      selectedHue: 175,
    },
    dark: {
      lightSquare: 'oklch(0.76 0.075 172)',
      darkSquare: 'oklch(0.53 0.095 168)',
      frame: 'oklch(0.39 0.08 175)',
      boardLabel: labelOnDarkFrame(175),
      selectedHue: 172,
    },
  },

  sage: {
    light: {
      lightSquare: 'oklch(0.87 0.055 125)',
      darkSquare: 'oklch(0.58 0.08 135)',
      frame: 'oklch(0.72 0.048 132)',
      boardLabel: labelOnLightFrame(132),
      selectedHue: 132,
    },
    dark: {
      lightSquare: 'oklch(0.77 0.065 130)',
      darkSquare: 'oklch(0.53 0.09 135)',
      frame: 'oklch(0.39 0.075 132)',
      boardLabel: labelOnDarkFrame(132),
      selectedHue: 132,
    },
  },

};
