import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Purple / lavender accent. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(295, { chroma: 0.16, primaryL: 0.56 }),
  ...chessByPalette.lavender.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(292, { chroma: 0.14, primaryL: 0.75 }),
  ...darkSemanticBase,
  ...chessByPalette.lavender.dark,
};

export const lavenderPalette = { light, dark } as const;
