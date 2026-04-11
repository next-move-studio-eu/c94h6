import { useTranslation } from 'react-i18next';

export default function ArticlePage() {
  const { t } = useTranslation('placeholderPages');
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-editor-text mb-2">
        {t('editor.nav.article')}
      </h1>
      <p className="text-editor-muted">{t('editor.placeholder.article')}</p>
    </div>
  );
}
