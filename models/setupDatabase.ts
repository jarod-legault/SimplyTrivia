import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Ensure database directory exists (needed for mobile platforms)
export async function ensureDatabaseDirectoryExists() {
  if (Platform.OS !== 'web') {
    const dbDirectory = `${FileSystem.documentDirectory}watermelon`;
    const dirInfo = await FileSystem.getInfoAsync(dbDirectory);

    if (!dirInfo.exists) {
      console.log('Creating database directory...');
      await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });
    }
  }
}
