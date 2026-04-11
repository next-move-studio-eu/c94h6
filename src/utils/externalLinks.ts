/**
 * Resolves an anchor href to a URL that should open in the system browser (Tauri),
 * or null when navigation should stay in the in-app router / same document.
 */
export function resolveExternalBrowserUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  try {
    const resolved = new URL(trimmed, window.location.origin);
    if (resolved.origin !== window.location.origin) return resolved.href;
  } catch {
    return null;
  }
  return null;
}

export function isTauriShell(): boolean {
  if (typeof window === 'undefined') return false;
  const tauriPlatform = (import.meta as unknown as { env?: { TAURI_ENV_PLATFORM?: string } }).env
    ?.TAURI_ENV_PLATFORM;
  if (Boolean(tauriPlatform)) return true;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}
