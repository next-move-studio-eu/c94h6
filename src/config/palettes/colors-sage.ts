import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Sage / olive accent — yellow-green, distinct from forest teal. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(132, { chroma: 0.1, primaryL: 0.5 }),
  ...chessByPalette.sage.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(130, { chroma: 0.09, primaryL: 0.72 }),
  ...darkSemanticBase,
  ...chessByPalette.sage.dark,
};

export const sagePalette = { light, dark } as const;
