import BlockWrapper from '../BlockWrapper';
import type { SmilesBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import type { BlockEditorProps } from './blockEditorShared';
import { useRDKit } from '../../../hooks/useRDKit';
import { useTheme } from '../../../contexts/ThemeContext';
import { buildThemeTokens } from '../../../config/colors';
import { themeSmilesSvg } from '../../../utils/rdkitDrawOptions';

function SmilesPreview({ smiles }: { smiles: string }) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  const { rdkit, ready, error } = useRDKit();
  const { mode, paletteId } = useTheme();
  const textColor = buildThemeTokens(mode, paletteId).text;

  if (!smiles.trim()) {
    return (
      <p className="rounded border border-dashed border-[var(--border)] bg-[var(--surfaceHigh)] px-3 py-6 text-center text-xs text-[var(--textSecondary)]">
        {t('articleEditor.smilesPreviewEnterHint')}
      </p>
    );
  }
  if (error) {
    return (
      <p className="rounded border border-[var(--border)] bg-[var(--surfaceHigh)] px-3 py-4 text-xs text-[var(--textSecondary)]">
        {t('articleEditor.smilesPreviewRdkitUnavailable', { message: error.message })}
      </p>
    );
  }
  if (!ready || !rdkit) {
    return (
      <p className="rounded border border-[var(--border)] bg-[var(--surfaceHigh)] px-3 py-4 text-xs text-[var(--textSecondary)]">
        {t('articleEditor.smilesPreviewLoading')}
      </p>
    );
  }

  const mol = rdkit.get_mol(smiles.trim());
  if (!mol) {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-3 py-4 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        {t('articleEditor.smilesPreviewInvalid')}
      </p>
    );
  }

  try {
    const rawSvg = mol.get_svg();
    const svg = themeSmilesSvg(rawSvg, textColor);
    return (
      <div
        className="flex min-h-[120px] items-center justify-center overflow-auto rounded border border-[var(--border)] bg-[var(--surfaceHigh)] p-3"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  } catch {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-3 py-4 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        {t('articleEditor.smilesPreviewRenderFailed')}
      </p>
    );
  }
}

export function SmilesBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<SmilesBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockSmiles')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.smilesTitle')}
          </label>
          <input
            type="text"
            value={block.title ?? ''}
            onChange={(e) => onUpdate({ ...block, title: e.target.value || undefined })}
            placeholder={t('articleEditor.smilesTitlePlaceholder')}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--textSecondary)]">
            {t('articleEditor.smilesString')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={block.smiles}
            onChange={(e) => onUpdate({ ...block, smiles: e.target.value })}
            placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
            rows={2}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)]"
          />
        </div>
        <SmilesPreview smiles={block.smiles} />
      </div>
    </BlockWrapper>
  );
}
