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
  const { mode } = useTheme();
  const textColor = buildThemeTokens(mode).text;

  if (!smiles.trim()) {
    return (
      <p className="surface-container-high rounded-xl px-3 py-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
        {t('articleEditor.smilesPreviewEnterHint')}
      </p>
    );
  }
  if (error) {
    return (
      <p className="rounded-lg bg-[var(--md-sys-color-error-container)] px-3 py-4 text-xs text-[var(--md-sys-color-on-error-container)]">
        {t('articleEditor.smilesPreviewRdkitUnavailable', { message: error.message })}
      </p>
    );
  }
  if (!ready || !rdkit) {
    return (
      <p className="surface-container-high rounded-xl px-3 py-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        {t('articleEditor.smilesPreviewLoading')}
      </p>
    );
  }

  const mol = rdkit.get_mol(smiles.trim());
  if (!mol) {
    return (
      <p className="rounded-lg bg-[var(--md-sys-color-error-container)] px-3 py-4 text-xs text-[var(--md-sys-color-on-error-container)]">
        {t('articleEditor.smilesPreviewInvalid')}
      </p>
    );
  }

  try {
    const rawSvg = mol.get_svg();
    const svg = themeSmilesSvg(rawSvg, textColor);
    return (
      <div
        className="surface-container-high flex min-h-[120px] items-center justify-center overflow-auto rounded-xl p-3"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  } catch {
    return (
      <p className="rounded-lg bg-[var(--md-sys-color-error-container)] px-3 py-4 text-xs text-[var(--md-sys-color-on-error-container)]">
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
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.smilesTitle')}
          </label>
          <input
            type="text"
            value={block.title ?? ''}
            onChange={(e) => onUpdate({ ...block, title: e.target.value || undefined })}
            placeholder={t('articleEditor.smilesTitlePlaceholder')}
            className="field-filled focus-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {t('articleEditor.smilesString')} <span className="text-[var(--md-sys-color-error)]">*</span>
          </label>
          <textarea
            value={block.smiles}
            onChange={(e) => onUpdate({ ...block, smiles: e.target.value })}
            placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
            rows={2}
            className="field-filled focus-ring resize-y font-mono"
          />
        </div>
        <SmilesPreview smiles={block.smiles} />
      </div>
    </BlockWrapper>
  );
}
