import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

// Database connection instance
let db: ReturnType<typeof drizzle> | null = null;

// Constants for database files
const DB_FILENAME = 'questions.db';
const DB_PATH = FileSystem.documentDirectory + DB_FILENAME;

/**
 * Initialize the database
 */
export const initDatabase = async () => {
  if (db) return db;

  console.log('Initializing database...');

  try {
    if (Platform.OS === 'web') {
      throw new Error('Database operations are not supported in web version');
    }

    // Check if database file exists in document directory
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);

    // Delete existing database file to force a fresh copy
    if (fileInfo.exists) {
      console.log('Deleting existing database file to ensure fresh copy...');
      await FileSystem.deleteAsync(DB_PATH);
    }

    console.log('Copying database from bundled assets...');
    try {
      // Try to load database from bundled assets
      const asset = Asset.fromModule(require('../data/questions.db'));
      await asset.downloadAsync();

      if (asset.localUri) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: DB_PATH,
        });
        console.log('Successfully copied bundled database from data folder');
      } else {
        throw new Error('Database file not found in data folder');
      }
    } catch (error) {
      console.error('Failed to load or copy database:', error);
      throw new Error(
        'Could not find or load the required database file. The app requires a pre-populated questions database to function.'
      );
    }

    // Open the database using the proper path
    const sqlite = SQLite.openDatabaseSync(DB_PATH);
    db = drizzle(sqlite, { schema });

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Get all categories
 */
export const getCategories = async () => {
  try {
    const database = await initDatabase();
    console.log('Fetching categories from database...');
    const result = await database.select().from(schema.categories);
    console.log(`Found ${result.length} categories`);
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get all questions
 */
export const getQuestions = async () => {
  try {
    const database = await initDatabase();
    console.log('Fetching questions from database...');
    const result = await database.select().from(schema.questions);
    console.log(`Found ${result.length} questions`);
    return result;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};
