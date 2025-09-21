import { Stack } from 'expo-router';

import { ThemeProvider } from '~/styles/ThemeProvider';

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ title: '' }} />
    </ThemeProvider>
  );
}
