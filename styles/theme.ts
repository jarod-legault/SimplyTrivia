export const palette = {
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
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
