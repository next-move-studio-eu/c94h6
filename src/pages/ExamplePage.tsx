import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Info, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../utils/language';

interface ExampleItem {
  fileName: string;
  title: string;
  model: string;
  prompt: string;
  manualWork: string;
  grade?: string;
  evaluation?: string;
}

function getExamplesItems(t: (key: string, options?: Record<string, unknown>) => unknown): ExampleItem[] {
  const items = t('examples.items', { returnObjects: true });
  return Array.isArray(items) ? (items as ExampleItem[]) : [];
}

export default function ExamplePage() {
  const { fileName } = useParams<{ fileName: string }>();
  const { t, i18n } = useTranslation(['examplesPage', 'documentPage']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = getExamplesItems(t);
  const item = fileName ? items.find((entry) => entry.fileName === fileName) : undefined;
  const lang = normalizeLanguage(i18n.resolvedLanguage);

  const handleView = async () => {
    if (!item) return;
    setError(null);
    setLoading(true);
    try {
      const url = `/examples/${item.fileName}-${lang}.zip`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const { parseArticleZip } = await import('../utils/articleZip');
      const { state: newState, errors } = await parseArticleZip(blob);
      if (errors.length > 0) {
        setError(t('examples.loadFailed'));
        return;
      }
      navigate('/article', {
        state: { loadExample: { fileName: item.fileName, lang, state: newState } },
        replace: false,
      });
    } catch (_err) {
      setError(t('examples.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-editor-muted">{t('editor.document.notFound')}</p>
      </div>
    );
  }

  const { title, prompt, manualWork, grade, evaluation, model } = item;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-xl border-2 border-editor-primary/30 bg-editor-surface p-6 shadow-sm ring-1 ring-editor-primary/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6">
          <h1 className="text-3xl font-bold text-editor-primary min-w-0">
            {title}
          </h1>
          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <span
              className="inline-flex items-center justify-center rounded-lg p-2 text-editor-muted hover:bg-editor-primary/10 hover:text-editor-primary transition-colors"
              title={t('examples.languagesInfoTooltip')}
              aria-label={t('examples.languagesInfoTooltip')}
            >
              <Languages className="h-5 w-5" aria-hidden />
            </span>
            <button
              type="button"
              onClick={handleView}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-editor-primary bg-editor-primary px-5 py-3 text-base font-semibold text-editor-on-primary transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-editor-primary focus:ring-offset-2 focus:ring-offset-editor-surface disabled:opacity-60"
            >
              <Eye className="h-5 w-5 shrink-0" />
              {loading ? t('examples.loadingExample') : t('examples.view')}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-base text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        <dl className="space-y-4 text-base">
          <div>
            <dt className="font-semibold text-editor-primary uppercase tracking-wide text-sm">
              {t('examples.modelLabel')}
            </dt>
            <dd className="text-editor-text mt-1 text-lg">{model}</dd>
          </div>
          <div>
            <dt className="font-semibold text-editor-primary uppercase tracking-wide text-sm flex items-center gap-1.5">
              {t('examples.promptLabel')}
              <span
                className="inline-flex text-editor-primary"
                title={t('examples.promptInfoTooltip')}
                aria-label={t('examples.promptInfoTooltip')}
              >
                <Info className="h-4 w-4 shrink-0" aria-hidden />
              </span>
            </dt>
            <dd className="text-editor-text mt-1 text-lg whitespace-pre-wrap break-words leading-relaxed">
              {prompt}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-editor-primary uppercase tracking-wide text-sm">
              {t('examples.manualWorkLabel')}
            </dt>
            <dd className="text-editor-text mt-1 text-lg whitespace-pre-wrap break-words leading-relaxed">
              {manualWork}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-editor-primary uppercase tracking-wide text-sm">
              {t('examples.gradeLabel')}
            </dt>
            <dd className="text-editor-text mt-1 text-lg">
              {grade ? `${grade}/5` : ''}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-editor-primary uppercase tracking-wide text-sm">
              {t('examples.evaluationLabel')}
            </dt>
            <dd className="text-editor-text mt-1 text-lg whitespace-pre-wrap break-words leading-relaxed">
              {evaluation}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
