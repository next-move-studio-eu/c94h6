import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { normalizeLanguage } from './utils/language';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import ExamplePage from './pages/ExamplePage';
import SlideshowRecorderPage from './pages/SlideshowRecorderPage';
import VideoRecorderPage from './pages/VideoRecorderPage';
import AudioRecorderPage from './pages/AudioRecorderPage';
import DocumentPage from './pages/DocumentPage';
import { RecorderSessionProvider } from './contexts/RecorderSessionContext';
import { ArticleSessionProvider } from './contexts/ArticleSessionContext';
import { isTauriShell, resolveExternalBrowserUrl } from './utils/externalLinks';
import ThemeToggle from './components/ThemeToggle';

function AppShell() {
  const { t } = useTranslation('appShell');
  const language = normalizeLanguage(i18n.resolvedLanguage);
  const location = useLocation();

  useEffect(() => {
    document.title = t('editor.title');
    document.documentElement.lang = language;
  }, [t, language]);

  // In Tauri, open external links in the system browser instead of navigating the webview
  useEffect(() => {
    if (!isTauriShell()) return;

    const openExternal = async (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.type === 'auxclick' && e.button !== 1) return;
      const target = (e.target as Element).closest?.('a');
      if (!target || target.tagName !== 'A') return;
      const href = (target as HTMLAnchorElement).getAttribute('href');
      const url = resolveExternalBrowserUrl(href);
      if (!url) return;
      e.preventDefault();
      e.stopPropagation();
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    };

    document.addEventListener('click', openExternal, true);
    document.addEventListener('auxclick', openExternal, true);
    return () => {
      document.removeEventListener('click', openExternal, true);
      document.removeEventListener('auxclick', openExternal, true);
    };
  }, []);

  const nav = [
    { path: '/', labelKey: 'editor.nav.home' },
    { path: '/article', labelKey: 'editor.nav.article' },
    { path: '/audio', labelKey: 'editor.nav.audio' },
    { path: '/slideshow', labelKey: 'editor.nav.slideshow' },
    { path: '/video', labelKey: 'editor.nav.video' },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col surface">
      <header className="sticky top-0 z-50 surface-container">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {nav.map(({ path, labelKey }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm ${
                  location.pathname === path ? 'btn-tonal' : 'btn-text'
                }`}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex gap-1">
              {(['en', 'cs'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    void i18n.changeLanguage(lang);
                    try {
                      localStorage.setItem('editorLang', lang);
                    } catch (_) {}
                  }}
                  className={`text-sm ${language === lang ? 'btn-tonal' : 'btn-text'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article" element={<ArticlesPage />} />
          <Route path="/examples/:fileName" element={<ExamplePage />} />
          <Route path="/slideshow" element={<SlideshowRecorderPage />} />
          <Route path="/video" element={<VideoRecorderPage />} />
          <Route path="/audio" element={<AudioRecorderPage />} />
          <Route path="/document/:docId" element={<DocumentPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ArticleSessionProvider>
      <RecorderSessionProvider>
        <AppShell />
      </RecorderSessionProvider>
    </ArticleSessionProvider>
  );
}
