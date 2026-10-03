import type { DerivedChessOverlayTokens } from './chessHighlightDerivation';

/**
 * Material 3 role names. CSS variables are `--md-sys-color-<name>`.
 * Chess overlays are derived in buildThemeTokens from fixed board squares.
 * EU badge colors are merged from euBrandColors and are not seed colors.
 */
export const MATERIAL_ROLE_NAMES = [
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'inverse-primary',
  'primary-fixed',
  'primary-fixed-dim',
  'on-primary-fixed',
  'on-primary-fixed-variant',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'secondary-fixed',
  'secondary-fixed-dim',
  'on-secondary-fixed',
  'on-secondary-fixed-variant',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'tertiary-fixed',
  'tertiary-fixed-dim',
  'on-tertiary-fixed',
  'on-tertiary-fixed-variant',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'background',
  'on-background',
  'surface',
  'surface-dim',
  'surface-bright',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'surface-variant',
  'on-surface',
  'on-surface-variant',
  'outline',
  'outline-variant',
  'inverse-surface',
  'inverse-on-surface',
  'shadow',
  'scrim',
  'surface-tint',
] as const;

/** Success, warning, and info, harmonized from the seed in colors.ts. */
export const CUSTOM_ROLE_NAMES = [
  'success',
  'on-success',
  'success-container',
  'on-success-container',
  'warning',
  'on-warning',
  'warning-container',
  'on-warning-container',
  'info',
  'on-info',
  'info-container',
  'on-info-container',
] as const;

export type MaterialRoleName = (typeof MATERIAL_ROLE_NAMES)[number];
export type CustomRoleName = (typeof CUSTOM_ROLE_NAMES)[number];
export type SchemeCssVar = `md-sys-color-${MaterialRoleName | CustomRoleName}`;
export type SchemeColorTokens = Record<SchemeCssVar, string>;

/**
 * Names already used by components. Values are copies of scheme roles so existing
 * `var(--…)` references keep resolving until later tracks switch to shared classes.
 * `outline` is reserved for focus; neutral strokes use `outline-variant`.
 */
export type LegacyThemeAliases = {
  bg: string;
  surface: string;
  surfaceHigh: string;
  overlay: string;
  overlayLight: string;
  modalOverlay: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  primary: string;
  primaryHover: string;
  primarySubtle: string;
  primaryBorder: string;
  onPrimary: string;
  border: string;
  borderSubtle: string;
  divider: string;
  hoverBg: string;
  activeBg: string;
  focusRing: string;
  error: string;
  errorSubtle: string;
  onError: string;
  success: string;
  successSubtle: string;
  onSuccess: string;
  warning: string;
  warningSubtle: string;
  onWarning: string;
  info: string;
  infoSubtle: string;
  onInfo: string;
  codeBg: string;
  codeBorder: string;
};

/** Fixed chess-diagram colors. Not produced from the UI seed. */
export type ChessContentColors = {
  lightSquare: string;
  darkSquare: string;
  frame: string;
  boardLabel: string;
};

export type ThemeTokens = SchemeColorTokens &
  LegacyThemeAliases &
  ChessContentColors &
  DerivedChessOverlayTokens & {
    shadowSm: string;
    shadowMd: string;
    euBlue: string;
    euGold: string;
  };
