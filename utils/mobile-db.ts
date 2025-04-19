import { eq, and, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import { generateUUID } from './uuid';
import { Category, Question } from '../models/database.common';
import * as schema from '../models/schema';

const DB_NAME = 'questions.db';

let db: ReturnType<typeof drizzle> | null = null;

const createTables = async (sqlite: SQLite.SQLiteDatabase) => {
  console.log('Creating database tables...');

  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      main_category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(main_category, subcategory)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      incorrect_answers TEXT NOT NULL,
      main_category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (main_category, subcategory)
        REFERENCES categories(main_category, subcategory)
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY NOT NULL,
      question_id TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);
  console.log('Tables created successfully');
};

const importData = async (sqlite: SQLite.SQLiteDatabase) => {
  try {
    // First check if we already have data
    const countResult = (await sqlite.execAsync(
      'SELECT COUNT(*) as count FROM categories;'
    )) as unknown as { count: number }[];

    console.log('Current category count:', countResult);
    if (countResult?.[0]?.count > 0) {
      console.log('Database already contains data, skipping import');
      return;
    }

    // Import categories directly from JSON
    console.log('Importing categories...');
    const categories = require('../data/export.json');
    console.log(`Found ${categories.length} categories to import`);

    // Import categories
    for (const category of categories) {
      await sqlite.execAsync(
        `INSERT OR IGNORE INTO categories (id, main_category, subcategory, created_at)
         VALUES ('${category.id}', '${category.main_category}', '${category.subcategory}', ${category.created_at})`
      );
    }
    console.log(`Imported ${categories.length} categories`);

    // Import questions directly from JSON
    console.log('Importing questions...');
    const questions = require('../data/questions_export.json');
    console.log(`Found ${questions.length} questions to import`);

    // Import questions
    for (const question of questions) {
      await sqlite.execAsync(
        `INSERT OR IGNORE INTO questions (id, question, correct_answer, incorrect_answers, main_category, subcategory, difficulty, created_at)
         VALUES ('${question.id}', '${question.question.replace(/'/g, "''")}', '${question.correct_answer.replace(/'/g, "''")}',
                '${question.incorrect_answers.replace(/'/g, "''")}', '${question.main_category}', '${question.subcategory}',
                '${question.difficulty}', ${question.created_at})`
      );
    }
    console.log(`Imported ${questions.length} questions`);
    console.log('Data import completed successfully');
  } catch (importError) {
    console.error('Error during data import:', importError);
    throw importError;
  }
};

export const initDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing database...');

    // Try to close and delete any existing database
    try {
      const existing = SQLite.openDatabaseSync(DB_NAME);
      await existing.closeAsync();
      console.log('Closed existing database');
    } catch {
      // Ignore errors - database might not exist
    }

    // Create a fresh database
    const sqlite = SQLite.openDatabaseSync(DB_NAME);
    console.log('Opened new database connection');

    // Create tables
    await createTables(sqlite);

    // Import data from the source database
    await importData(sqlite);

    // Initialize Drizzle
    db = drizzle(sqlite, { schema });
    console.log('Database initialized successfully with Drizzle');

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

    // Use the existing Drizzle connection for diagnostic queries
    try {
      console.log('Running diagnostic queries...');
      const tables = await database
        .select({ tables: sql<string>`GROUP_CONCAT(name)` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table'`);
      console.log('Available tables:', tables[0]?.tables);

      const catSchema = await database
        .select({ sql: sql<string>`sql` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = 'categories'`);
      console.log('Categories table schema:', catSchema[0]?.sql);
    } catch (diagError) {
      console.error('Diagnostic queries failed:', diagError);
    }

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
