export type AppLanguage = 'cs' | 'en';

export function normalizeLanguage(value?: string): AppLanguage {
  if (!value) return 'en';
  const normalized = value.toLowerCase();
  return normalized === 'cs' ? 'cs' : 'en';
}

export function detectLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem('editorLang');
    if (stored === 'cs' || stored === 'en') {
      return stored;
    }
  } catch (_) {}

  return normalizeLanguage(navigator.language.split('-')[0]);
}
