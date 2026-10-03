import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslation('themeToggle');
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      className="btn-icon-tonal relative shrink-0"
      aria-label={isDark ? t('themeToggle.switchToLight') : t('themeToggle.switchToDark')}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5" aria-hidden />
        ) : (
          <Sun className="w-5 h-5" aria-hidden />
        )}
      </motion.div>
    </button>
  );
}
