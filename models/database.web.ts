import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import { Category, Question, DEFAULT_CATEGORIES } from './database.common';
import * as schema from './schema';
import { generateUUID } from '../utils/uuid';

// Define the database directory and file
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'questions.db');

// Make sure the data directory exists
try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create data directory:', err);
}

// Initialize the database connection
let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Get the database instance, initializing it if necessary
 */
export const initDatabase = () => {
  if (!db) {
    try {
      sqlite = new Database(DB_PATH);
      db = drizzle(sqlite, { schema });

      // Initialize the database schema
      sqlite.exec(`
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

      // Populate categories if empty
      const categoriesCount = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as {
        count: number;
      };

      if (categoriesCount.count === 0) {
        populateCategories();
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
      throw err;
    }
  }

  return db;
};

/**
 * Populate the categories table with predefined categories
 */
const populateCategories = () => {
  if (!sqlite) return;

  const insertCategory = sqlite.prepare(`
    INSERT INTO categories (id, main_category, subcategory, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const timestamp = new Date().getTime();

  sqlite.transaction(() => {
    for (const category of DEFAULT_CATEGORIES) {
      insertCategory.run(generateUUID(), category.main, category.sub, timestamp);
    }
  })();
};

/**
 * Get all categories
 */
export const getCategories = (): Category[] => {
  if (!sqlite) {
    initDatabase();
  }
  if (!sqlite) return [];

  const results = sqlite
    .prepare(
      'SELECT id, main_category as mainCategory, subcategory, created_at as createdAt FROM categories ORDER BY main_category, subcategory'
    )
    .all() as Category[];

  return results;
};

/**
 * Get all subcategories for a main category
 */
export const getSubcategories = (mainCategory: string): string[] => {
  if (!sqlite) {
    initDatabase();
  }
  if (!sqlite) return [];

  const results = sqlite
    .prepare('SELECT subcategory FROM categories WHERE main_category = ? ORDER BY subcategory')
    .all(mainCategory) as { subcategory: string }[];

  return results.map((r) => r.subcategory);
};

/**
 * Get all main categories
 */
export const getMainCategories = (): string[] => {
  if (!sqlite) {
    initDatabase();
  }
  if (!sqlite) return [];

  const results = sqlite
    .prepare('SELECT DISTINCT main_category FROM categories ORDER BY main_category')
    .all() as { main_category: string }[];

  return results.map((r) => r.main_category);
};

/**
 * Validate a category/subcategory pair
 */
export const validateCategory = (mainCategory: string, subcategory: string): boolean => {
  if (!sqlite) {
    initDatabase();
  }
  if (!sqlite) return false;

  const result = sqlite
    .prepare('SELECT COUNT(*) as count FROM categories WHERE main_category = ? AND subcategory = ?')
    .get(mainCategory, subcategory) as { count: number };

  return result.count > 0;
};

/**
 * Find similar questions for duplicate detection
 */
export const findSimilarQuestions = (questionText: string): Question[] => {
  if (!sqlite) {
    initDatabase();
  }
  if (!sqlite) return [];

  try {
    // First try a direct match
    const exactMatches = sqlite
      .prepare(`SELECT * FROM questions WHERE LOWER(question) = LOWER(?)`)
      .all(questionText) as Question[];

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // Then try a fuzzy match using LIKE
    const fuzzyMatches = sqlite
      .prepare(
        `SELECT * FROM questions
         WHERE LOWER(question) LIKE LOWER(?)
         LIMIT 5`
      )
      .all(`%${questionText}%`) as Question[];

    return fuzzyMatches;
  } catch (err) {
    console.error('Error checking for similar questions:', err);
    return [];
  }
};

/**
 * Check if a question contains an answer
 */
export const checkQuestionContainsAnswer = (question: string, answer: string): boolean => {
  // Convert both strings to lowercase for case-insensitive comparison
  const cleanQuestion = question.toLowerCase();
  const cleanAnswer = answer.toLowerCase();

  // Check if the answer appears as a whole word in the question
  const wordBoundaryRegex = new RegExp(`\\b${cleanAnswer}\\b`);
  return wordBoundaryRegex.test(cleanQuestion);
};