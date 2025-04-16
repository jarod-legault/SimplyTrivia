import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useStore } from '../store';

export default function RootLayout() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    initialize().catch(console.error);
  }, [initialize]);

  return <Stack />;
}
