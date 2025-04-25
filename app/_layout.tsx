import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useStore } from '../store';

const initializeDatabase = async (db: any) => {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
};

export default function RootLayout() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    // Only initialize store for mobile platforms
    if (Platform.OS !== 'web') {
      initialize().catch(console.error);
    }
  }, [initialize]);

  if (Platform.OS === 'web') {
    return <Stack />;
  }

  return (
    <SQLiteProvider
      databaseName="questions.db"
      assetSource={{ assetId: require('../assets/database/questions.db') }}
      onInit={initializeDatabase}>
      <Stack />
    </SQLiteProvider>
  );
}
