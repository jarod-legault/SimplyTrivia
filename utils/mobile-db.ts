import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';

import { generateUUID } from './uuid';
import * as schema from '../models/schema';

// For use in React components
export const useDatabase = () => {
  const sqlite = useSQLiteContext();
  return drizzle(sqlite, { schema });
};

// For use outside React components
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDatabase = async () => {
  if (!dbInstance) {
    const db = SQLite.openDatabaseSync('questions.db');
    dbInstance = drizzle(db, { schema });
  }
  return dbInstance;
};

export const getCategories = async () => {
  try {
    const database = await getDatabase();
    const categories = await database.select().from(schema.categories);
    return categories;
  } catch (error) {
    console.error('Error in getCategories:', error);
    throw error;
  }
};

export const getQuestions = async (mainCategory?: string, subcategory?: string) => {
  const database = await getDatabase();
  const baseQuery = database.select().from(schema.questions);

  if (mainCategory && subcategory) {
    return baseQuery.where(
      eq(schema.questions.mainCategory, mainCategory) &&
        eq(schema.questions.subcategory, subcategory)
    );
  }

  if (mainCategory) {
    return baseQuery.where(eq(schema.questions.mainCategory, mainCategory));
  }

  return baseQuery;
};

export const saveResponse = async (questionId: string, isCorrect: boolean) => {
  const database = await getDatabase();
  await database.insert(schema.responses).values({
    id: generateUUID(),
    questionId,
    isCorrect,
    createdAt: new Date(),
  });
};
