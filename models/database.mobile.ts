import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { Category, Question } from './database.common';
import * as schema from './schema';
import { generateUUID } from '../utils/uuid';

const DB_NAME = 'questions.db';
const DB_PATH = FileSystem.documentDirectory + DB_NAME;

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database
 */
export const initDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    // Check if database exists
    const info = await FileSystem.getInfoAsync(DB_PATH);
    if (!info.exists) {
      console.log('Database does not exist, copying from bundled assets...');
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
    }

    // Open the database using the proper path
    const sqlite = SQLite.openDatabaseSync(DB_NAME);
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
export const getCategories = async (): Promise<Category[]> => {
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
export const getQuestions = async (): Promise<Question[]> => {
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

/**
 * Get a single question by ID
 */
export const getQuestionById = async (id: string): Promise<Question | null> => {
  try {
    const database = await initDatabase();
    const result = await database
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, id));
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
};

/**
 * Save a response to a question
 */
export const saveResponse = async (questionId: string, isCorrect: boolean): Promise<void> => {
  try {
    const database = await initDatabase();
    await database.insert(schema.responses).values({
      id: generateUUID(),
      questionId,
      isCorrect,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving response:', error);
    throw error;
  }
};
