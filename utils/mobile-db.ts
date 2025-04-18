import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { generateUUID } from './uuid';
import { Category, Question } from '../models/database.common';
import * as schema from '../models/schema';

const DB_NAME = 'questions.db';
const DB_PATH = FileSystem.documentDirectory + DB_NAME;

let db: ReturnType<typeof drizzle> | null = null;

export const initDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    const info = await FileSystem.getInfoAsync(DB_PATH);
    if (!info.exists) {
      console.log('Database does not exist, copying from bundled assets...');
      try {
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

    const sqlite = SQLite.openDatabaseSync(DB_NAME);
    db = drizzle(sqlite, { schema });

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const database = await initDatabase();
    console.log('Fetching categories from database...');
    const result = await database.select().from(schema.categories);
    console.log(`Found ${result.length} categories`);
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getQuestions = async (
  mainCategory?: string,
  subcategory?: string
): Promise<Question[]> => {
  try {
    const database = await initDatabase();

    if (mainCategory && subcategory) {
      return await database
        .select()
        .from(schema.questions)
        .where(
          and(
            eq(schema.questions.mainCategory, mainCategory),
            eq(schema.questions.subcategory, subcategory)
          )
        );
    }

    return await database.select().from(schema.questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

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
