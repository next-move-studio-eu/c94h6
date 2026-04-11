import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Teal / forest green accent. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(175, { chroma: 0.14, primaryL: 0.52 }),
  ...chessByPalette.forest.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(172, { chroma: 0.12, primaryL: 0.74 }),
  ...darkSemanticBase,
  ...chessByPalette.forest.dark,
};

export const forestPalette = { light, dark } as const;
