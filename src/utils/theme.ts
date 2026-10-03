import { buildThemeTokens, type ThemeMode } from '../config/colors';

function flattenTokens(obj: Record<string, unknown>, el: HTMLElement): void {
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string') {
      el.style.setProperty(`--${key}`, value);
    }
  });
}

/** Remove retired theme and palette keys from localStorage. */
function clearRetiredStorage(): void {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'root' || t === 'software' || t === 'adventure') {
      localStorage.removeItem('theme');
    }
    localStorage.removeItem('colorPalette');
  } catch {
    // ignore
  }
}

/**
 * Applies the light or dark scheme as CSS variables on :root
 * (--md-sys-color-primary, --primary, --bg, …), including EU brand colors.
 */
export function applyTheme(mode: ThemeMode = 'light'): void {
  clearRetiredStorage();
  const root = document.documentElement;
  const colors = buildThemeTokens(mode) as Record<string, unknown>;
  flattenTokens(colors, root);
  root.removeAttribute('data-theme');
  root.removeAttribute('data-palette');
  root.setAttribute('data-mode', mode);
  saveMode(mode);
}

export function saveMode(mode: ThemeMode): void {
  try {
    localStorage.setItem('themeMode', mode);
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
