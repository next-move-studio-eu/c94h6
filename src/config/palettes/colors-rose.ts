import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Pink / rose accent — playful. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(350, { chroma: 0.17, primaryL: 0.73 }),
  ...chessByPalette.rose.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(348, { chroma: 0.14, primaryL: 0.76 }),
  ...darkSemanticBase,
  ...chessByPalette.rose.dark,
};

export const rosePalette = { light, dark } as const;
