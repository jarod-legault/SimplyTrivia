import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '~/styles/ThemeProvider';
import { Palette, spacing } from '~/styles/theme';

interface ThemeToggleProps {
  variant?: 'default' | 'compact';
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { palette, mode, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, variant === 'compact' && styles.compactContainer]}>
      {variant === 'default' && (
        <Text style={styles.label}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
      )}
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        thumbColor={isDark ? palette.accent : palette.surface}
        trackColor={{ false: palette.border, true: palette.accentMuted }}
        ios_backgroundColor={palette.border}
      />
    </View>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(1.5),
      backgroundColor: palette.surface,
      borderRadius: spacing(2),
      borderWidth: 1,
      borderColor: palette.border,
    },
    compactContainer: {
      paddingVertical: spacing(0.5),
      paddingHorizontal: spacing(0.75),
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    label: {
      color: palette.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
