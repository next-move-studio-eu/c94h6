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
      className="relative p-2 rounded-full transition-colors hover:bg-editor-primary/10 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-editor-primary"
      aria-label={isDark ? t('themeToggle.switchToLight') : t('themeToggle.switchToDark')}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-editor-text" aria-hidden />
        ) : (
          <Sun className="w-5 h-5 text-editor-text" aria-hidden />
        )}
      </motion.div>
    </button>
  );
}
