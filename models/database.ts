import { Database } from '@nozbe/watermelondb';
// Only import LokiJS adapter for web
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { Platform } from 'react-native';

import Question from './Question';
import schema from './schema';
// Only import SQLite adapter for native platforms
let SQLiteAdapter: any = null;
let FileSystem: any = null;
let ensureDatabaseDirectoryExists: any = null;

// Conditionally import modules that are not compatible with web
if (Platform.OS !== 'web') {
  // Dynamic imports for native-only modules
  SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  FileSystem = require('expo-file-system');
  ensureDatabaseDirectoryExists = require('./setupDatabase').ensureDatabaseDirectoryExists;
}

// First, create the adapter to your database
const getDatabaseAdapter = async () => {
  if (Platform.OS === 'web') {
    // For web, use LokiJS adapter
    return new LokiJSAdapter({
      schema,
      useWebWorker: false, // Try disabling web worker which might cause issues
      useIncrementalIndexedDB: true,
    });
  } else {
    // For mobile (iOS, Android), ensure database directory exists
    await ensureDatabaseDirectoryExists();

    const dbDirectory = `${FileSystem.documentDirectory}watermelon`;

    return new SQLiteAdapter({
      schema,
      dbName: 'simplytrivia.db',
      // Optional migrations
      migrations: [],
      // Using JSI for fastest performance on recent React Native versions
      jsi: true,
      // Setting the database location using Expo's FileSystem
      dbLocation: dbDirectory,
    });
  }
};

// Database initialization function with improved error handling
let databaseInstance: Database | null = null;
let isInitializing = false;
let initPromise: Promise<Database> | null = null;

export const initializeDatabase = async (): Promise<Database> => {
  // Return existing instance if already initialized
  if (databaseInstance) {
    return databaseInstance;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Set flag and create promise to prevent multiple initializations
  isInitializing = true;

  initPromise = (async () => {
    try {
      console.log('Creating database adapter...');
      const adapter = await getDatabaseAdapter();

      console.log('Initializing database...');
      databaseInstance = new Database({
        adapter,
        modelClasses: [Question],
      });

      console.log('Database initialized successfully!');
      return databaseInstance;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Reset initialization state so it can be tried again
      databaseInstance = null;
      initPromise = null;
      isInitializing = false;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
};

// Define interfaces for our data structures
interface QuestionData {
  question: string;
  correct_answer: string;
  incorrect_answers: string | string[];
  category: string;
  difficulty: string;
}

// Helper functions for database operations
export const getQuestions = async (): Promise<Question[]> => {
  const database = await initializeDatabase();
  return await database.collections.get<Question>('questions').query().fetch();
};

export const addQuestion = async (questionData: QuestionData): Promise<Question> => {
  const database = await initializeDatabase();
  return await database.write(async () => {
    const { question, correct_answer, incorrect_answers, category, difficulty } = questionData;

    return await database.collections.get<Question>('questions').create((q: Question) => {
      q.question = question;
      q.correctAnswer = correct_answer;
      q.incorrectAnswers =
        typeof incorrect_answers === 'string'
          ? incorrect_answers
          : JSON.stringify(incorrect_answers);
      q.category = category;
      q.difficulty = difficulty;
      q.createdAt = new Date();
    });
  });
};

export const deleteQuestion = async (id: string): Promise<void> => {
  const database = await initializeDatabase();
  return await database.write(async () => {
    const question = await database.collections.get<Question>('questions').find(id);
    await question.markAsDeleted();
    await question.destroyPermanently();
  });
};

export const importQuestions = async (questionsData: QuestionData[]): Promise<Question[]> => {
  const database = await initializeDatabase();

  // Guard clause - prevent processing empty data
  if (!questionsData || questionsData.length === 0) {
    console.log('No questions to import');
    return [];
  }

  // Process in batches of 50 to avoid memory issues
  const batchSize = 50;
  const results: Question[] = [];

  try {
    // Process data in batches
    for (let i = 0; i < questionsData.length; i += batchSize) {
      const batch = questionsData.slice(i, i + batchSize);

      const batchResults = await database.write(async () => {
        return await Promise.all(
          batch.map(async (questionData) => {
            try {
              return await database.collections.get<Question>('questions').create((q: Question) => {
                q.question = questionData.question;
                q.correctAnswer = questionData.correct_answer;
                q.incorrectAnswers =
                  typeof questionData.incorrect_answers === 'string'
                    ? questionData.incorrect_answers
                    : JSON.stringify(questionData.incorrect_answers);
                q.category = questionData.category;
                q.difficulty = questionData.difficulty;
                q.createdAt = new Date();
              });
            } catch (error: any) {
              console.error('Error creating question:', error);
              return null;
            }
          })
        );
      });

      results.push(...batchResults.filter((result): result is Question => result !== null));
    }

    return results;
  } catch (error: any) {
    console.error('Error importing questions:', error);
    throw error;
  }
};
