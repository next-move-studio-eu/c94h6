import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Deep burgundy / wine accent. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(18, { chroma: 0.14, primaryL: 0.52 }),
  ...chessByPalette.wine.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(16, { chroma: 0.12, primaryL: 0.72 }),
  ...darkSemanticBase,
  ...chessByPalette.wine.dark,
};

export const winePalette = { light, dark } as const;
