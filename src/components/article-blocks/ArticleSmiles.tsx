import { useRDKit } from '../../hooks/useRDKit';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { buildThemeTokens } from '../../config/colors';
import { themeSmilesSvg } from '../../utils/rdkitDrawOptions';

export interface ArticleSmilesProps {
  smiles: string;
  title?: string;
}

export default function ArticleSmiles({ smiles, title }: ArticleSmilesProps) {
  const { rdkit, ready, error } = useRDKit();
  const { mode } = useTheme();
  const { t } = useTranslation('articleBlocks');
  const textColor = buildThemeTokens(mode).text;

  let body: React.ReactNode;
  if (!smiles.trim()) {
    body = <p className="text-sm text-[var(--textSecondary)]">{t('articleSmiles.noString')}</p>;
  } else if (error) {
    body = (
      <p className="text-sm text-[var(--textSecondary)]">
        {t('articleSmiles.viewerUnavailable')}{' '}
        <code className="rounded surface-container-highest px-1">{smiles}</code>
      </p>
    );
  } else if (!ready || !rdkit) {
    body = <p className="text-sm text-[var(--textSecondary)]">{t('articleSmiles.loading')}</p>;
  } else {
    const mol = rdkit.get_mol(smiles.trim());
    if (!mol) {
      body = (
        <p className="text-sm text-[var(--textSecondary)]">
          {t('articleSmiles.invalidSmiles')}{' '}
          <code className="rounded surface-container-highest px-1">{smiles}</code>
        </p>
      );
    } else {
      try {
        const rawSvg = mol.get_svg();
        const svg = themeSmilesSvg(rawSvg, textColor);
        body = (
          <div
            className="flex justify-center overflow-auto py-2"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        );
      } catch {
        body = (
          <p className="text-sm text-[var(--textSecondary)]">
            {t('articleSmiles.smilesLabel')}{' '}
            <code className="rounded surface-container-highest px-1">{smiles}</code>
          </p>
        );
      }
    }
  }

  return (
    <div className="my-6">
      {title != null && title !== '' && (
        <p className="mb-2 text-center text-sm font-medium text-[var(--text)]">{title}</p>
      )}
      {body}
    </div>
  );
}
