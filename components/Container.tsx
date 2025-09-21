import { ReactNode, useMemo } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import { useTheme } from '~/styles/ThemeProvider';
import { Palette, spacing } from '~/styles/theme';

export const Container = ({ children }: { children: ReactNode }) => {
  const { palette, mode } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const barStyle = mode === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={barStyle} backgroundColor={palette.background} />
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
};

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
      backgroundColor: palette.backgroundAlt,
      paddingHorizontal: spacing(2),
    },
  });
