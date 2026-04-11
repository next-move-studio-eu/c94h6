import type { PaletteTokens } from '../themeTokens';

/** Dark-mode primary family from accent hue. */
export function darkAccentFromHue(
  h: number,
  opts?: { chroma?: number; primaryL?: number }
): Pick<
  PaletteTokens,
  'primary' | 'primaryHover' | 'primarySubtle' | 'primaryBorder' | 'onPrimary' | 'focusRing'
> {
  const L = opts?.primaryL ?? 0.78;
  const c = opts?.chroma ?? 0.17;
  const Lh = Math.max(0.52, L - 0.09);
  return {
    primary: `oklch(${L} ${c} ${h})`,
    primaryHover: `oklch(${Lh} ${c} ${h})`,
    primarySubtle: `oklch(0.3 0.07 ${h})`,
    primaryBorder: `oklch(0.5 0.12 ${h})`,
    onPrimary: 'oklch(0.12 0.02 285)',
    focusRing: `oklch(${L} ${c} ${h})`,
  };
}

/**
 * Shared dark-mode shell: requested surfaces + overlays. Accent tokens are filled per palette.
 */
export const darkShellBase = {
  bg: '#141414',
  surface: '#1C1C1C',
  surfaceHigh: '#242424',
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.30)',
  modalOverlay: 'rgba(0, 0, 0, 0.65)',
  text: 'oklch(0.967 0.001 286.375)',
  textSecondary: 'oklch(0.705 0.015 286.067)',
  textDisabled: 'oklch(0.552 0.016 285.938)',
  border: 'oklch(0.58 0.035 285)',
  borderSubtle: 'oklch(0.6 0.035 285)',
  divider: 'oklch(0.6 0.035 285)',
  hoverBg: '#2e2e2e',
  activeBg: '#383838',
  codeBg: '#1a1a1a',
  codeBorder: 'oklch(0.55 0.03 285)',
  shadowSm:
    '0 1px 3px 0 rgba(0, 0, 0, 0.30), 0 1px 2px -1px rgba(0, 0, 0, 0.20)',
  shadowMd:
    '0 4px 8px -2px rgba(0, 0, 0, 0.40), 0 2px 4px -2px rgba(0, 0, 0, 0.30)',
} as const satisfies Partial<PaletteTokens>;

export const darkSemanticBase: Pick<
  PaletteTokens,
  | 'error'
  | 'errorSubtle'
  | 'onError'
  | 'success'
  | 'successSubtle'
  | 'onSuccess'
  | 'warning'
  | 'warningSubtle'
  | 'onWarning'
  | 'info'
  | 'infoSubtle'
  | 'onInfo'
> = {
  error: 'oklch(0.72 0.19 22)',
  errorSubtle: 'oklch(0.32 0.1 25)',
  onError: 'oklch(0.12 0.02 285)',
  success: 'oklch(0.72 0.16 155)',
  successSubtle: 'oklch(0.3 0.06 160)',
  onSuccess: 'oklch(0.12 0.02 285)',
  warning: 'oklch(0.78 0.17 72)',
  warningSubtle: 'oklch(0.32 0.08 55)',
  onWarning: 'oklch(0.12 0.02 285)',
  info: 'oklch(0.72 0.14 250)',
  infoSubtle: 'oklch(0.32 0.09 265)',
  onInfo: 'oklch(0.12 0.02 285)',
};

