import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyTheme, getCurrentMode, getCurrentPaletteId } from '../utils/theme';
import { type ColorPaletteId, type ThemeMode } from '../config/colors';

interface ThemeContextType {
  mode: ThemeMode;
  paletteId: ColorPaletteId;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setPaletteId: (id: ColorPaletteId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, mode: modeProp }: { children: ReactNode; mode?: ThemeMode }) {
  const [modeState, setModeState] = useState<ThemeMode>(() => {
    const savedMode = getCurrentMode();
    return savedMode || 'light';
  });

  const [paletteIdState, setPaletteIdState] = useState<ColorPaletteId>(() => getCurrentPaletteId());

  const mode = modeProp ?? modeState;
  const paletteId = modeProp !== undefined ? getCurrentPaletteId() : paletteIdState;

  useEffect(() => {
    if (modeProp !== undefined) return;

    applyTheme(mode, paletteId);
  }, [mode, paletteId, modeProp]);

  const setMode = (newMode: ThemeMode) => {
    if (modeProp !== undefined) return;
    setModeState(newMode);
  };

  const toggleMode = () => {
    if (modeProp !== undefined) return;
    setModeState((m) => (m === 'light' ? 'dark' : 'light'));
  };

  const setPaletteId = (id: ColorPaletteId) => {
    if (modeProp !== undefined) return;
    setPaletteIdState(id);
  };

  return (
    <ThemeContext.Provider value={{ mode, paletteId, setMode, toggleMode, setPaletteId }}>
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
