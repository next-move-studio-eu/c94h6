import type { DerivedChessOverlayTokens } from './chessHighlightDerivation';

/**
 * Semantic color token shape (includes EU keys on full theme merge).
 * Palette modules omit EU; applyTheme merges euBrandColors.
 * Chess square/arrow overlays are derived in buildThemeTokens from lightSquare, darkSquare, selectedHue.
 */
export type ThemeTokens = {
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
  lightSquare: string;
  darkSquare: string;
  frame: string;
  /** Rank/file letters on the chess board frame (dark on light frame in light UI, light on dark frame in dark UI). */
  boardLabel: string;
} & DerivedChessOverlayTokens & {
  shadowSm: string;
  shadowMd: string;
  euBlue: string;
  euGold: string;
};

/** Palette slices omit EU and omit derived chess overlays; `selectedHue` drives overlay OKLCH hues next to board squares. */
export type PaletteTokens = Omit<ThemeTokens, 'euBlue' | 'euGold' | keyof DerivedChessOverlayTokens> & {
  selectedHue: number;
};
