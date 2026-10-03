import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bird, BookA, ChessPawn, FileBraces, PenLine, Castle, CookingPot, Leaf, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import promptComponentsEn from '../md/prompt-components-en.md?raw';
import promptComponentsCs from '../md/prompt-components-cs.md?raw';
import promptTranslationEn from '../md/prompt-translation-en.md?raw';
import promptTranslationCs from '../md/prompt-translation-cs.md?raw';
import articlePhotoScript from '../scripts/article_photo.sh?raw';
import slideshowPhotoScript from '../scripts/slideshow_photo.sh?raw';
import av1Script from '../scripts/av1.sh?raw';
import i18n from '../i18n';
import { normalizeLanguage } from '../utils/language';

const WEBSITE_URL = 'https://www.nextmovestudio.eu';

const promptsByLang = {
  components: { en: promptComponentsEn, cs: promptComponentsCs },
  translation: { en: promptTranslationEn, cs: promptTranslationCs },
} as const;

const helperScripts = [
  { id: 'article_photo' as const, name: 'article_photo.sh', content: articlePhotoScript },
  { id: 'slideshow_photo' as const, name: 'slideshow_photo.sh', content: slideshowPhotoScript },
  { id: 'av1' as const, name: 'av1.sh', content: av1Script },
] as const;

const exampleButtons: { path: string; Icon: typeof Castle; titleKey: string }[] = [
  { path: '/examples/history', Icon: Castle, titleKey: 'editor.home.exampleHistory' },
  { path: '/examples/cook', Icon: CookingPot, titleKey: 'editor.home.exampleCook' },
  { path: '/examples/biology', Icon: Leaf, titleKey: 'editor.home.exampleBiology' },
  { path: '/examples/tech', Icon: ShieldCheck, titleKey: 'editor.home.exampleTech' },
  { path: '/examples/language', Icon: BookA, titleKey: 'editor.home.exampleLanguage' },
  { path: '/examples/stork', Icon: Bird, titleKey: 'editor.home.exampleStork' },
  { path: '/examples/chess', Icon: ChessPawn, titleKey: 'editor.home.exampleChess' },
];

export default function HomePage() {
  const { t } = useTranslation('homePage');
  const contentLang = normalizeLanguage(i18n.resolvedLanguage);
  const [copiedWhich, setCopiedWhich] = useState<'components' | 'translation' | null>(null);
  const [copiedScript, setCopiedScript] = useState<(typeof helperScripts)[number]['id'] | null>(null);

  const copyPrompt = async (which: 'components' | 'translation') => {
    const text = promptsByLang[which][contentLang];
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhich(which);
      setTimeout(() => setCopiedWhich(null), 2000);
    } catch (_) {
      setCopiedWhich(null);
    }
  };

  const copyScript = async (script: (typeof helperScripts)[number]) => {
    try {
      await navigator.clipboard.writeText(script.content);
      setCopiedScript(script.id);
      setTimeout(() => setCopiedScript(null), 2000);
    } catch (_) {
      setCopiedScript(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 space-y-8 pb-28">
      <header>
        <h1 className="text-2xl font-semibold text-editor-text mb-2 flex items-center gap-3 flex-wrap">
          {t('editor.home.headlinePrefix')}
          <Link to="/document/our-format" className="text-editor-primary underline underline-offset-2 hover:no-underline font-semibold focus-ring">
            c94h6
          </Link>
        </h1>
        <ul className="text-editor-text mb-2 list-disc list-inside space-y-1">
          <li>{t('editor.home.bullet1')}</li>
          <li>{t('editor.home.bullet2')}</li>
          <li>
            <Link to="/document/capabilities" className="text-editor-primary underline underline-offset-2 hover:no-underline focus-ring">
              {t('editor.home.capabilitiesLink')}
            </Link>
          </li>
        </ul>
        <p className="text-editor-text">
          <strong>{t('editor.home.freeAndOpenSource')}</strong>
        </p>
      </header>

      {/* Independent publishing — punk section: off-grid, no big providers */}
      <section className="relative overflow-visible p-4 rounded-xl surface-container-highest">
        <h2 className="text-lg font-semibold text-editor-text flex items-center justify-end gap-2 mb-4">
          {t('editor.home.independentPublishingTitle')}
          <PenLine className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        </h2>
        <div className="flex items-stretch justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-editor-muted uppercase tracking-wide mb-1.5">
                  {t('editor.home.independentPublishingCategoryLLM')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyPrompt('components')}
                    className="btn-tonal text-sm"
                  >
                    {copiedWhich === 'components' ? t('editor.home.copied') : t('editor.home.specFormatForLLM')}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyPrompt('translation')}
                    className="btn-text text-sm"
                  >
                    {copiedWhich === 'translation' ? t('editor.home.copied') : t('editor.home.translationRulesForLLM')}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-editor-muted uppercase tracking-wide mb-1.5">
                  {t('editor.home.independentPublishingCategoryScripts')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {helperScripts.map((script) => (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => copyScript(script)}
                      className="btn-tonal font-mono text-sm"
                    >
                      {script.name}
                      {copiedScript === script.id ? (
                        <span className="text-editor-primary text-xs font-medium">{t('editor.home.copied')}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-editor-muted uppercase tracking-wide mb-1.5">
                  {t('editor.home.independentPublishingCategoryExamples')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleButtons.map(({ path, Icon, titleKey }) => (
                    <Link
                      key={path}
                      to={path}
                      className="btn-icon-tonal"
                      aria-label={t(titleKey)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col justify-end overflow-visible">
            <Link
              to="/document/why"
              className="btn-filled flex-col gap-1.5 w-24 h-24 p-2 text-xs font-semibold uppercase"
              style={{ transform: 'rotate(175deg)' }}
            >
              <FileBraces className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <span>{t('editor.home.whyButton')}</span>
            </Link>
          </div>
        </div>
      </section>

      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-50 surface-container">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col items-center justify-center gap-1 text-center text-sm">
          <p>
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-editor-text hover:text-editor-primary transition-colors focus-ring"
            >
              {t('editor.home.byline')}
            </a>
          </p>
          <p className="text-editor-muted">
            {t('editor.home.helpWithSites')}
          </p>
          <p>
            <Link to="/document/as-is" className="text-editor-text hover:text-editor-primary transition-colors focus-ring">
              {t('editor.nav.asIs')}
            </Link>
            {' · '}
            <Link to="/document/credits" className="text-editor-text hover:text-editor-primary transition-colors focus-ring">
              {t('editor.nav.credits')}
            </Link>
            {' · '}
            <Link to="/document/gdpr" className="text-editor-text hover:text-editor-primary transition-colors focus-ring">
              {t('editor.nav.gdpr')}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
