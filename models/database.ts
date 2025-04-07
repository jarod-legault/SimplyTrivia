import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as ExpoSQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import * as SQLjs from 'sql.js';

import { Question, NewQuestion, QuestionData } from './schema';
import * as schema from './schema';
import { generateUUID } from '../utils/uuid';

// Declare platform-specific imports
let SQLiteInited = false;
let SQLiteProxy: any;

// Database connection instance
let db: ReturnType<typeof drizzle> | null = null;

// Constants for database files
const DB_FILENAME = 'questions.db';
const DB_PATH = FileSystem.documentDirectory + DB_FILENAME;

/**
 * Initialize the database based on platform
 */
export const initDatabase = async () => {
  if (db) return db;

  console.log('Initializing database...');

  try {
    if (Platform.OS === 'web') {
      if (!SQLiteInited) {
        // Initialize SQL.js
        const SQL_JS = await SQLjs.default();

        // Create a new database
        const database = new SQL_JS.Database();

        // Create our proxy for SQL.js
        SQLiteProxy = {
          execute: (sql: string, params: any[] = []) => {
            try {
              // For queries that return data
              if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = database.prepare(sql);
                stmt.bind(params);

                const results = [];
                while (stmt.step()) {
                  results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
              } else {
                // For queries that modify data
                database.run(sql, params);
                return [];
              }
            } catch (error) {
              console.error('SQL error:', error, 'SQL:', sql, 'Params:', params);
              throw error;
            }
          },
        };

        SQLiteInited = true;
      }
    } else {
      // Mobile implementation
      await initMobileDatabase();
    }

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
  if (SQLiteInited) return;

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
          // Use promise-based approach to handle SQL execution
          return new Promise((resolve, reject) => {
            // Using a simplified transaction approach
            (async () => {
              try {
                // Use the proper method for executing SQL statements
                const result = await database.runAsync(sql, params);

                // Extract rows based on whether this is a SELECT query
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                  // Return the rows directly as an array
                  resolve(Array.isArray(result) ? result : []);
                } else {
                  // For non-SELECT queries, just return an empty array
                  resolve([]);
                }
              } catch (err) {
                console.error('Error executing SQL:', err);
                reject(err);
              }
            })();
          });
        } catch (error) {
          console.error('SQL error:', error, 'SQL:', sql, 'Params:', params);
          throw error;
        }
      },
    };

    SQLiteInited = true;
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

    // Verify question was added
    const result = await database
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, newQuestion.id));

    if (result.length === 0) {
      throw new Error('Failed to add question');
    }

    console.log('Question added successfully with ID:', result[0].id);
    return result[0];
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

      // Fetch inserted questions using proper Drizzle ORM syntax
      const questionIds = newQuestions.map((q) => q.id);
      const inserted = await database
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.id, questionIds[0])); // Get first one as a fallback

      // If multiple questions, try to get them all (using SQL directly if needed)
      if (questionIds.length > 1) {
        try {
          // Use a direct SQL query as a workaround
          const placeholders = questionIds.map(() => '?').join(',');
          const sql = `SELECT * FROM questions WHERE id IN (${placeholders})`;
          const result = await SQLiteProxy.execute(sql, questionIds);
          if (result && Array.isArray(result) && result.length > 0) {
            results.push(...result);
          } else {
            results.push(...inserted);
          }
        } catch (error) {
          console.error('Failed to fetch multiple questions:', error);
          results.push(...inserted);
        }
      } else {
        results.push(...inserted);
      }
    }

    console.log(`Successfully imported ${results.length} questions`);
    return results;
  } catch (error) {
    console.error('Error importing questions:', error);
    throw error;
  }
};
