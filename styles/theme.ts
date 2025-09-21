export type ThemeMode = 'light' | 'dark';

export type Palette = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentMuted: string;
  easy: string;
  medium: string;
  hard: string;
  success: string;
  error: string;
  border: string;
};

export const darkPalette: Palette = {
  background: '#0F0A1E',
  backgroundAlt: '#120D25',
  surface: '#1C1439',
  surfaceElevated: '#2B1D55',
  surfaceHighlight: '#342466',
  textPrimary: '#F6F3FF',
  textSecondary: '#CFC8E6',
  accent: '#8F6CFF',
  accentMuted: '#6D5ED8',
  easy: '#2DBE7E',
  medium: '#4AA8FF',
  hard: '#F39C57',
  success: '#2DBE7E',
  error: '#FF6B6B',
  border: '#2B1D55',
};

export const lightPalette: Palette = {
  background: '#F4F5FF',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#ECEEFC',
  surfaceHighlight: '#D9DFFC',
  textPrimary: '#1C1439',
  textSecondary: '#4A4D6A',
  accent: '#4A35A8',
  accentMuted: '#7F71D8',
  easy: '#2DBE7E',
  medium: '#1E7BEF',
  hard: '#F39C57',
  success: '#2DBE7E',
  error: '#E94444',
  border: '#C9CEEE',
};

export const spacing = (multiplier = 1) => multiplier * 8;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};
