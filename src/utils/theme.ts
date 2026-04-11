import {
  buildThemeTokens,
  type ColorPaletteId,
  PALETTE_ORDER,
  type ThemeMode,
} from '../config/colors';

const PALETTE_STORAGE_KEY = 'colorPalette';

function flattenTokens(obj: Record<string, unknown>, el: HTMLElement): void {
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string') {
      el.style.setProperty(`--${key}`, value);
    }
  });
}

/** Remove legacy section theme key from localStorage (no longer used). */
function clearLegacyThemeKey(): void {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'root' || t === 'software' || t === 'adventure') {
      localStorage.removeItem('theme');
    }
  } catch {
    // ignore
  }
}

function isPaletteId(value: string): value is ColorPaletteId {
  return (PALETTE_ORDER as readonly string[]).includes(value);
}

function normalizePaletteId(raw: string): ColorPaletteId | null {
  return isPaletteId(raw) ? raw : null;
}

/**
 * Applies semantic tokens as unprefixed CSS variables on :root (--bg, --primary, …),
 * merging EU brand colors from euBrandColors after palette tokens.
 */
export function applyTheme(mode: ThemeMode = 'light', paletteId?: ColorPaletteId): void {
  clearLegacyThemeKey();
  const resolvedPalette: ColorPaletteId = paletteId ?? getCurrentPaletteId();
  const root = document.documentElement;
  const colors = buildThemeTokens(mode, resolvedPalette) as Record<string, unknown>;
  flattenTokens(colors, root);
  root.removeAttribute('data-theme');
  root.setAttribute('data-mode', mode);
  root.setAttribute('data-palette', resolvedPalette);
  saveMode(mode);
  savePaletteId(resolvedPalette);
}

export function saveMode(mode: ThemeMode): void {
  try {
    localStorage.setItem('themeMode', mode);
  } catch (e) {
    console.warn('localStorage is not available', e);
  }
}

export function savePaletteId(paletteId: ColorPaletteId): void {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
  } catch (e) {
    console.warn('localStorage is not available', e);
  }
}

export function getCurrentMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark') {
      return stored as ThemeMode;
    }
  } catch (e) {
    console.warn('localStorage is not available', e);
  }
  const attr = document.documentElement.getAttribute('data-mode');
  if (attr === 'light' || attr === 'dark') return attr;
  return 'light';
}

export function getCurrentPaletteId(): ColorPaletteId {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizePaletteId(stored);
      if (normalized) return normalized;
    }
  } catch (e) {
    console.warn('localStorage is not available', e);
  }
  const attr = document.documentElement.getAttribute('data-palette');
  if (attr) {
    const normalized = normalizePaletteId(attr);
    if (normalized) return normalized;
  }
  return 'default';
}
