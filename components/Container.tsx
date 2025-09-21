import { ReactNode } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import { palette, spacing } from '~/styles/theme';

export const Container = ({ children }: { children: ReactNode }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
