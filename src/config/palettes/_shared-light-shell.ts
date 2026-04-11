import type { PaletteTokens } from '../themeTokens';

export const lightStaticBase: Pick<
  PaletteTokens,
  | 'bg'
  | 'surface'
  | 'surfaceHigh'
  | 'overlay'
  | 'overlayLight'
  | 'modalOverlay'
  | 'text'
  | 'textSecondary'
  | 'textDisabled'
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
  | 'codeBg'
  | 'shadowSm'
  | 'shadowMd'
> = {
  bg: 'oklch(0.97 0.001 286)',        // Velmi světlý podklad
  surface: 'oklch(1 0 0)',           // Čistě bílá
  surfaceHigh: 'oklch(0.95 0.001 286)',
  overlay: 'rgba(0, 0, 0, 0.50)',
  overlayLight: 'rgba(0, 0, 0, 0.20)',
  modalOverlay: 'rgba(0, 0, 0, 0.50)',
  text: 'oklch(0.21 0.006 285.885)',
  textSecondary: 'oklch(0.45 0.02 286)',
  textDisabled: 'oklch(0.705 0.015 286.067)',
  error: 'oklch(0.52 0.22 25)',
  errorSubtle: 'oklch(0.971 0.013 17.38)',
  onError: 'oklch(1 0 0)',
  success: 'oklch(0.45 0.14 162)',
  successSubtle: 'oklch(0.979 0.021 166.113)',
  onSuccess: 'oklch(1 0 0)',
  warning: 'oklch(0.45 0.2 41)',
  warningSubtle: 'oklch(0.98 0.016 73.684)',
  onWarning: 'oklch(1 0 0)',
  info: 'oklch(0.48 0.18 255)',
  infoSubtle: 'oklch(0.97 0.014 254.604)',
  onInfo: 'oklch(1 0 0)',
  codeBg: 'oklch(0.93 0.003 286.32)',
  shadowSm:
    '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  shadowMd:
    '0 4px 8px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
};

/** Primary / border family from accent hue (light mode). */
export function lightAccentFromHue(
  h: number,
  opts?: { chroma?: number; primaryL?: number; onPrimaryLight?: boolean }
): Pick<
  PaletteTokens,
  | 'primary'
  | 'primaryHover'
  | 'primarySubtle'
  | 'primaryBorder'
  | 'onPrimary'
  | 'border'
  | 'borderSubtle'
  | 'divider'
  | 'hoverBg'
  | 'activeBg'
  | 'focusRing'
  | 'codeBorder'
> {
  const L = opts?.primaryL ?? 0.55;
  const c = opts?.chroma ?? 0.19;
  const Lh = Math.max(0.35, L - 0.1);
  const onPk =
    opts?.onPrimaryLight || L < 0.72
      ? 'oklch(0.99 0.01 286)'
      : 'oklch(0.21 0.006 285.885)';
  return {
    primary: `oklch(${L} ${c} ${h})`,
    primaryHover: `oklch(${Lh} ${Math.min(c, 0.17)} ${h})`,
    primarySubtle: `oklch(0.94 0.05 ${h})`,
    primaryBorder: `oklch(0.82 0.1 ${h})`,
    onPrimary: onPk,
    border: `oklch(0.58 0.04 ${h})`,
    borderSubtle: `oklch(0.55 0.04 ${h})`,
    divider: `oklch(0.58 0.04 ${h})`,
    hoverBg: `oklch(0.93 0.03 ${h})`,
    activeBg: `oklch(0.9 0.04 ${h})`,
    focusRing: `oklch(${L} ${c} ${h})`,
    codeBorder: `oklch(0.5 0.04 ${h})`,
  };
}
