import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyTheme, getCurrentMode } from '../utils/theme';
import { type ThemeMode } from '../config/colors';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, mode: modeProp }: { children: ReactNode; mode?: ThemeMode }) {
  const [modeState, setModeState] = useState<ThemeMode>(() => {
    const savedMode = getCurrentMode();
    return savedMode || 'light';
  });

  const mode = modeProp ?? modeState;

  useEffect(() => {
    if (modeProp !== undefined) return;
    applyTheme(mode);
  }, [mode, modeProp]);

  const setMode = (newMode: ThemeMode) => {
    if (modeProp !== undefined) return;
    setModeState(newMode);
  };

  const toggleMode = () => {
    if (modeProp !== undefined) return;
    setModeState((m) => (m === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
