import type { PaletteTokens } from '../themeTokens';
import {
  darkAccentFromHue,
  darkSemanticBase,
  darkShellBase,
} from './_shared-dark-shell';
import { chessByPalette } from './chess-by-palette';
import { lightAccentFromHue, lightStaticBase } from './_shared-light-shell';

/** Blue accent — calm / “ocean”. */
const light: PaletteTokens = {
  ...lightStaticBase,
  ...lightAccentFromHue(252, { chroma: 0.19, primaryL: 0.58 }),
  ...chessByPalette.ocean.light,
};

const dark: PaletteTokens = {
  ...darkShellBase,
  ...darkAccentFromHue(250, { chroma: 0.16, primaryL: 0.76 }),
  ...darkSemanticBase,
  ...chessByPalette.ocean.dark,
};

export const oceanPalette = { light, dark } as const;
