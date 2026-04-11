import type { ReactNode } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n from '../i18n';
import { normalizeLanguage } from '../utils/language';

export type Language = 'cs' | 'en';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTranslation(): TranslationContextType {
  const { t: i18nT, i18n: i18nInstance } = useI18nTranslation('legacy');
  const language = normalizeLanguage(i18nInstance.resolvedLanguage) as Language;

  const setLanguage = (lang: Language) => {
    void i18n.changeLanguage(lang);
    try {
      localStorage.setItem('editorLang', lang);
    } catch (_) {}
  };

  return {
    language,
    setLanguage,
    t: (path: string, params?: Record<string, string | number>) => i18nT(path, params),
  };
}
