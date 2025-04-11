import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as ExpoSQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { Question, NewQuestion, QuestionData } from './schema';
import * as schema from './schema';
import { generateUUID } from '../utils/uuid';

// Database connection instance
let db: ReturnType<typeof drizzle> | null = null;
let SQLiteProxy: any;

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

    // Mobile implementation
    await initMobileDatabase();

    // Initialize Drizzle with our proxy
    db = drizzle(SQLiteProxy, { schema });

    // Create tables if they don't exist
    await createTables();

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Initialize database for mobile platforms
 */
const initMobileDatabase = async () => {
  try {
    // Check if database file already exists in document directory
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);

    if (!fileInfo.exists) {
      console.log('Database file not found in document directory, checking bundled assets...');

      try {
        // Try to load database from bundled assets
        console.log('Attempting to copy bundled database from assets...');
        const asset = Asset.fromModule(require('../assets/questions.db'));
        await asset.downloadAsync();

        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: DB_PATH,
          });
          console.log('Successfully copied bundled database from assets');
        } else {
          console.log('No bundled database found in assets, creating new database');
        }
      } catch (error) {
        console.log('No bundled database found or error copying, creating new database:', error);
      }
    } else {
      console.log('Using existing database file from document directory');
    }

    // Open the database using the proper async method
    const database = await ExpoSQLite.openDatabaseAsync(DB_PATH);
    console.log('Database opened successfully');

    // Create our proxy for Expo SQLite
    SQLiteProxy = {
      execute: async (sql: string, params: any[] = []) => {
        try {
          return await new Promise((resolve, reject) => {
            (async () => {
              try {
                const result = await database.runAsync(sql, params);

                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                  resolve(Array.isArray(result) ? result : []);
                } else {
                  resolve([]);
                }
              } catch (err) {
                console.error('Error executing SQL:', err);
                reject(new Error(err instanceof Error ? err.message : String(err)));
              }
            })();
          });
        } catch (error) {
          console.error('SQL error:', error, 'SQL:', sql, 'Params:', params);
          throw error;
        }
      },
    };
  } catch (error) {
    console.error('Error initializing mobile database:', error);
    throw error;
  }
};

/**
 * Create tables if they don't exist
 */
const createTables = async () => {
  const createQuestionsTable = `
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      incorrect_answers TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `;

  try {
    await SQLiteProxy.execute(createQuestionsTable);
    console.log('Tables created or verified');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
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
 * Add a new question
 */
export const addQuestion = async (questionData: QuestionData): Promise<Question | null> => {
  try {
    if (!questionData?.question) {
      throw new Error('Invalid question data');
    }

    const database = await initDatabase();
    console.log('Adding question:', questionData.question);

    const newQuestion: NewQuestion = {
      id: generateUUID(),
      question: questionData.question,
      correctAnswer: questionData.correct_answer,
      incorrectAnswers:
        typeof questionData.incorrect_answers === 'string'
          ? questionData.incorrect_answers
          : JSON.stringify(questionData.incorrect_answers),
      category: questionData.category,
      difficulty: questionData.difficulty,
      createdAt: new Date(),
    };

    await database.insert(schema.questions).values(newQuestion);
    console.log('Question added successfully with ID:', newQuestion.id);
    return newQuestion as Question;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
};

/**
 * Delete a question by ID
 */
export const deleteQuestion = async (id: string): Promise<boolean> => {
  try {
    const database = await initDatabase();
    await database.delete(schema.questions).where(eq(schema.questions.id, id));
    console.log('Question deleted:', id);
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    return false;
  }
};

/**
 * Import multiple questions
 */
export const importQuestions = async (questionsData: QuestionData[]): Promise<Question[]> => {
  if (!questionsData?.length) {
    console.log('No questions to import');
    return [];
  }

  const database = await initDatabase();
  const batchSize = 50;
  const results: Question[] = [];

  try {
    // Process in batches to avoid memory issues
    for (let i = 0; i < questionsData.length; i += batchSize) {
      const batch = questionsData.slice(i, i + batchSize);
      console.log(
        `Processing batch ${i / batchSize + 1} of ${Math.ceil(questionsData.length / batchSize)}`
      );

      const newQuestions: NewQuestion[] = batch.map((data) => ({
        id: generateUUID(),
        question: data.question,
        correctAnswer: data.correct_answer,
        incorrectAnswers:
          typeof data.incorrect_answers === 'string'
            ? data.incorrect_answers
            : JSON.stringify(data.incorrect_answers),
        category: data.category,
        difficulty: data.difficulty,
        createdAt: new Date(),
      }));

      await database.insert(schema.questions).values(newQuestions);
      results.push(...(newQuestions as Question[]));
    }

    console.log(`Successfully imported ${results.length} questions`);
    return results;
  } catch (error) {
    console.error('Error importing questions:', error);
    throw error;
  }
};
