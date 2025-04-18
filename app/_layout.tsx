import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useStore } from '../store';

export default function RootLayout() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    // Only initialize store and database for mobile platforms
    if (Platform.OS !== 'web') {
      initialize().catch(console.error);
    }
  }, [initialize]);

  return <Stack />;
}
