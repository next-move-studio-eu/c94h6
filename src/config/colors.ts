/** Theme tokens for c94h6; palette set may align with presentation on nextmovestudio.eu. */
/**
 * Semantic color token registry. Palette slices live under ./palettes/;
 * EU badge colors are merged from euBrandColors.ts in applyTheme only.
 */
import { euBrandColors } from './euBrandColors';
import { defaultPalette } from './palettes/colors-0-default';
import { winePalette } from './palettes/colors-wine';
import { rosePalette } from './palettes/colors-rose';
import { lavenderPalette } from './palettes/colors-lavender';
import { oceanPalette } from './palettes/colors-ocean';
import { forestPalette } from './palettes/colors-forest';
import { sagePalette } from './palettes/colors-sage';
import { buildDerivedChessOverlayColors } from './chessHighlightDerivation';
import type { PaletteTokens, ThemeTokens } from './themeTokens';

export type { PaletteTokens, ThemeTokens } from './themeTokens';

/** Order for palette switcher UI — one colour per ~50° hue step across the spectrum. */
export const PALETTE_ORDER = [
  'default',
  'wine',
  'sage',
  'forest',
  'ocean',
  'lavender',
  'rose',
] as const;

export type ColorPaletteId = (typeof PALETTE_ORDER)[number];

export const paletteSchemes = {
  default: defaultPalette,
  wine: winePalette,
  sage: sagePalette,
  forest: forestPalette,
  ocean: oceanPalette,
  lavender: lavenderPalette,
  rose: rosePalette,
} as const satisfies Record<ColorPaletteId, { light: PaletteTokens; dark: PaletteTokens }>;

export type ThemeMode = 'light' | 'dark';

export function buildThemeTokens(mode: ThemeMode, paletteId: ColorPaletteId): ThemeTokens {
  const slice = paletteSchemes[paletteId][mode];
  const { selectedHue, ...paletteWithoutHue } = slice;
  const derived = buildDerivedChessOverlayColors(slice.lightSquare, slice.darkSquare, selectedHue);
  return {
    ...paletteWithoutHue,
    ...derived,
    ...euBrandColors,
  };
}

/** Full tokens for default palette (backward compatibility). */
export const colorSchemes = {
  light: buildThemeTokens('light', 'default'),
  dark: buildThemeTokens('dark', 'default'),
} as const;
