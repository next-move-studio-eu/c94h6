import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PALETTE_ORDER, type ColorPaletteId } from '../config/colors';
import { useTheme } from '../contexts/ThemeContext';

export default function PaletteSelect() {
  const { paletteId, setPaletteId } = useTheme();
  const { t } = useTranslation('themeToggle');

  const indexCount = PALETTE_ORDER.length;
  const currentIndex = PALETTE_ORDER.indexOf(paletteId);
  const i = currentIndex >= 0 ? currentIndex : 0;
  const currentName = t(`themeToggle.palette.${paletteId}`);

  const cyclePalette = () => {
    const nextIndex = (i + 1) % indexCount;
    setPaletteId(PALETTE_ORDER[nextIndex] as ColorPaletteId);
  };

  const ariaLabel = t('themeToggle.paletteCycleAriaLabel', { current: currentName });

  return (
    <button
      type="button"
      onClick={cyclePalette}
      className="relative p-2 rounded-full transition-colors hover:bg-editor-primary/10 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-editor-primary"
      aria-label={ariaLabel}
      title={currentName}
    >
      <Palette className="w-5 h-5 text-editor-text" aria-hidden />
    </button>
  );
}
