import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette, Palette, ThemeMode } from './theme';

type ThemeContextValue = {
  palette: Palette;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  const value = useMemo(
    () => ({
      palette,
      mode,
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
