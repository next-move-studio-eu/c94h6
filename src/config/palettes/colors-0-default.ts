import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Default amber accent. Audiences: general / chess content. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(70, { chroma: 0.188, primaryL: 0.769 }),
  ...chessByPalette.default.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(84, { chroma: 0.189, primaryL: 0.828 }),
  ...darkSemanticBase,
  ...chessByPalette.default.dark,
};

export const defaultPalette = { light, dark } as const;
