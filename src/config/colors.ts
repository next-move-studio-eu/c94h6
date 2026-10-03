export const SEED_COLOR = '#3F51B5'; // Material indigo. Change this to retheme.

import {
  Hct,
  SchemeTonalSpot,
  argbFromHex,
  customColor,
  hexFromArgb,
} from '@material/material-color-utilities';
import { buildDerivedChessOverlayColors } from './chessHighlightDerivation';
import { euBrandColors } from './euBrandColors';
import {
  MATERIAL_ROLE_NAMES,
  type CustomRoleName,
  type MaterialRoleName,
  type SchemeColorTokens,
  type ThemeTokens,
} from './themeTokens';

export type { ThemeTokens } from './themeTokens';

export type ThemeMode = 'light' | 'dark';

const SEED_ARGB = argbFromHex(SEED_COLOR);

/**
 * Semantic source colors. customColor harmonizes each hue toward SEED_COLOR,
 * then picks the standard container tones (40/100/90/10 light, 80/20/30/90 dark).
 */
const CUSTOM_SOURCES = {
  success: '#146C2E',
  warning: '#7D5800',
  info: '#00639B',
} as const satisfies Record<'success' | 'warning' | 'info', string>;

/** Library method name for each Material role. */
const ROLE_METHOD = {
  primary: 'primary',
  'on-primary': 'onPrimary',
  'primary-container': 'primaryContainer',
  'on-primary-container': 'onPrimaryContainer',
  'inverse-primary': 'inversePrimary',
  'primary-fixed': 'primaryFixed',
  'primary-fixed-dim': 'primaryFixedDim',
  'on-primary-fixed': 'onPrimaryFixed',
  'on-primary-fixed-variant': 'onPrimaryFixedVariant',
  secondary: 'secondary',
  'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer',
  'on-secondary-container': 'onSecondaryContainer',
  'secondary-fixed': 'secondaryFixed',
  'secondary-fixed-dim': 'secondaryFixedDim',
  'on-secondary-fixed': 'onSecondaryFixed',
  'on-secondary-fixed-variant': 'onSecondaryFixedVariant',
  tertiary: 'tertiary',
  'on-tertiary': 'onTertiary',
  'tertiary-container': 'tertiaryContainer',
  'on-tertiary-container': 'onTertiaryContainer',
  'tertiary-fixed': 'tertiaryFixed',
  'tertiary-fixed-dim': 'tertiaryFixedDim',
  'on-tertiary-fixed': 'onTertiaryFixed',
  'on-tertiary-fixed-variant': 'onTertiaryFixedVariant',
  error: 'error',
  'on-error': 'onError',
  'error-container': 'errorContainer',
  'on-error-container': 'onErrorContainer',
  background: 'background',
  'on-background': 'onBackground',
  surface: 'surface',
  'surface-dim': 'surfaceDim',
  'surface-bright': 'surfaceBright',
  'surface-container-lowest': 'surfaceContainerLowest',
  'surface-container-low': 'surfaceContainerLow',
  'surface-container': 'surfaceContainer',
  'surface-container-high': 'surfaceContainerHigh',
  'surface-container-highest': 'surfaceContainerHighest',
  'surface-variant': 'surfaceVariant',
  'on-surface': 'onSurface',
  'on-surface-variant': 'onSurfaceVariant',
  outline: 'outline',
  'outline-variant': 'outlineVariant',
  'inverse-surface': 'inverseSurface',
  'inverse-on-surface': 'inverseOnSurface',
  shadow: 'shadow',
  scrim: 'scrim',
  'surface-tint': 'surfaceTint',
} as const satisfies Record<MaterialRoleName, string>;

/**
 * Published M3 neutral-palette tone stops at standard contrast.
 * Used only when this library build has no DynamicColor for that surface role.
 */
const SURFACE_CONTAINER_TONES: Partial<Record<MaterialRoleName, { light: number; dark: number }>> = {
  surface: { light: 98, dark: 6 },
  'surface-dim': { light: 87, dark: 6 },
  'surface-bright': { light: 98, dark: 24 },
  'surface-container-lowest': { light: 100, dark: 4 },
  'surface-container-low': { light: 96, dark: 10 },
  'surface-container': { light: 94, dark: 12 },
  'surface-container-high': { light: 92, dark: 17 },
  'surface-container-highest': { light: 90, dark: 22 },
};

/** Last-move highlight hue. Warm gold, so it still reads on the cool squares. */
const CHESS_SELECTED_HUE = 70;

/**
 * Soft-indigo chess board, sampled from the scheme secondary palette.
 * Tones are explicit so the light square stays lighter than the dark square in both themes.
 * Dark mode steps the squares down and drops the frame below both.
 * Highlight fills are still derived in chessHighlightDerivation.ts.
 */
function chessBoardColors(scheme: SchemeTonalSpot, mode: ThemeMode) {
  const square = (tone: number) => hexFromArgb(scheme.secondaryPalette.tone(tone));
  const label = (tone: number) => hexFromArgb(scheme.neutralPalette.tone(tone));
  if (mode === 'dark') {
    return {
      lightSquare: square(75),
      darkSquare: square(45),
      frame: square(30),
      boardLabel: label(90),
      selectedHue: CHESS_SELECTED_HUE,
    };
  }
  return {
    lightSquare: square(85),
    darkSquare: square(50),
    frame: square(70),
    boardLabel: label(20),
    selectedHue: CHESS_SELECTED_HUE,
  };
}

const SHADOW = {
  light: {
    shadowSm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    shadowMd: '0 4px 8px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    shadowSm: '0 1px 3px 0 rgba(0, 0, 0, 0.30), 0 1px 2px -1px rgba(0, 0, 0, 0.20)',
    shadowMd: '0 4px 8px -2px rgba(0, 0, 0, 0.40), 0 2px 4px -2px rgba(0, 0, 0, 0.30)',
  },
} as const;

function readMaterialRole(scheme: SchemeTonalSpot, role: MaterialRoleName): string {
  const colors = scheme.colors as unknown as Record<string, unknown>;
  const method = colors[ROLE_METHOD[role]];
  if (typeof method === 'function') {
    const dynamic = (method as () => { getArgb?: (s: SchemeTonalSpot) => number } | undefined).call(colors);
    if (dynamic && typeof dynamic.getArgb === 'function') {
      return hexFromArgb(dynamic.getArgb(scheme));
    }
  }
  const fallback = SURFACE_CONTAINER_TONES[role];
  if (fallback) {
    const tone = scheme.isDark ? fallback.dark : fallback.light;
    return hexFromArgb(scheme.neutralPalette.tone(tone));
  }
  throw new Error(`Missing Material color role: ${role}`);
}

function withAlpha(hex: string, alpha: string): string {
  const base = hex.startsWith('#') ? hex.slice(0, 7) : `#${hex.slice(0, 6)}`;
  return `${base}${alpha}`;
}

function schemeColors(scheme: SchemeTonalSpot): SchemeColorTokens {
  const vars: Partial<SchemeColorTokens> = {};
  for (const role of MATERIAL_ROLE_NAMES) {
    vars[`md-sys-color-${role}`] = readMaterialRole(scheme, role);
  }
  (Object.keys(CUSTOM_SOURCES) as Array<keyof typeof CUSTOM_SOURCES>).forEach((name) => {
    const group = customColor(SEED_ARGB, {
      name,
      value: argbFromHex(CUSTOM_SOURCES[name]),
      blend: true,
    });
    const side = scheme.isDark ? group.dark : group.light;
    const color: CustomRoleName = name;
    const onColor: CustomRoleName = `on-${name}`;
    const container: CustomRoleName = `${name}-container`;
    const onContainer: CustomRoleName = `on-${name}-container`;
    vars[`md-sys-color-${color}`] = hexFromArgb(side.color);
    vars[`md-sys-color-${onColor}`] = hexFromArgb(side.onColor);
    vars[`md-sys-color-${container}`] = hexFromArgb(side.colorContainer);
    vars[`md-sys-color-${onContainer}`] = hexFromArgb(side.onColorContainer);
  });
  return vars as SchemeColorTokens;
}

export function buildThemeTokens(mode: ThemeMode): ThemeTokens {
  const isDark = mode === 'dark';
  const scheme = new SchemeTonalSpot(Hct.fromInt(SEED_ARGB), isDark, 0);
  const roles = schemeColors(scheme);
  const chess = chessBoardColors(scheme, mode);
  const derived = buildDerivedChessOverlayColors(chess.lightSquare, chess.darkSquare, chess.selectedHue);
  const scrim = roles['md-sys-color-scrim'];
  const overlayAlpha = isDark ? 'a6' : '80';
  const overlayLightAlpha = isDark ? '4d' : '33';

  return {
    ...roles,
    bg: roles['md-sys-color-surface'],
    surface: roles['md-sys-color-surface-container-low'],
    surfaceHigh: roles['md-sys-color-surface-container-high'],
    overlay: withAlpha(scrim, overlayAlpha),
    overlayLight: withAlpha(scrim, overlayLightAlpha),
    modalOverlay: withAlpha(scrim, overlayAlpha),
    text: roles['md-sys-color-on-surface'],
    textSecondary: roles['md-sys-color-on-surface-variant'],
    textDisabled: roles['md-sys-color-outline-variant'],
    primary: roles['md-sys-color-primary'],
    primaryHover: hexFromArgb(scheme.primaryPalette.tone(isDark ? 70 : 30)),
    primarySubtle: roles['md-sys-color-primary-container'],
    primaryBorder: hexFromArgb(scheme.primaryPalette.tone(isDark ? 60 : 80)),
    onPrimary: roles['md-sys-color-on-primary'],
    border: roles['md-sys-color-outline-variant'],
    borderSubtle: roles['md-sys-color-outline-variant'],
    divider: roles['md-sys-color-outline-variant'],
    hoverBg: roles['md-sys-color-surface-container-high'],
    activeBg: roles['md-sys-color-surface-container-highest'],
    focusRing: roles['md-sys-color-outline'],
    error: roles['md-sys-color-error'],
    errorSubtle: roles['md-sys-color-error-container'],
    onError: roles['md-sys-color-on-error'],
    success: roles['md-sys-color-success'],
    successSubtle: roles['md-sys-color-success-container'],
    onSuccess: roles['md-sys-color-on-success'],
    warning: roles['md-sys-color-warning'],
    warningSubtle: roles['md-sys-color-warning-container'],
    onWarning: roles['md-sys-color-on-warning'],
    info: roles['md-sys-color-info'],
    infoSubtle: roles['md-sys-color-info-container'],
    onInfo: roles['md-sys-color-on-info'],
    codeBg: roles['md-sys-color-surface-container'],
    codeBorder: roles['md-sys-color-outline-variant'],
    lightSquare: chess.lightSquare,
    darkSquare: chess.darkSquare,
    frame: chess.frame,
    boardLabel: chess.boardLabel,
    ...derived,
    ...euBrandColors,
    ...SHADOW[mode],
  };
}

export const colorSchemes = {
  light: buildThemeTokens('light'),
  dark: buildThemeTokens('dark'),
} as const;
