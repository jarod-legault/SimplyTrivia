import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, Palette, ThemeMode } from './theme';

type ThemeContextValue = {
  palette: Palette;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const initialMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const palette = mode === 'dark' ? darkPalette : lightPalette;

  const value = useMemo(
    () => ({
      palette,
      mode,
      toggleTheme: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setTheme: (nextMode: ThemeMode) => setMode(nextMode),
    }),
    [palette, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
