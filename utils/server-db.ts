import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import { DB_DIR, SERVER_DB_PATH } from '../config/database';
import * as schema from '../models/schema';

// Early environment check to prevent module from loading in browser
if (typeof window !== 'undefined') {
  throw new Error('This module is intended for server-side use only');
}

// Make sure the data directory exists
try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create data directory:', err);
}

// Initialize the database connection
let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

/**
 * Check if code is running in a Node.js environment
 */
const isNode = () => {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
};

/**
 * Get the database instance, initializing it if necessary
 */
export const getDB = () => {
  if (!isNode()) {
    throw new Error('Database operations are only supported in Node.js environment');
  }

  if (!_db) {
    try {
      _sqlite = new Database(SERVER_DB_PATH);
      _db = drizzle(_sqlite, { schema });

      // Initialize the database schema
      _sqlite.exec(`
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
    } catch (err) {
      console.error('Failed to initialize database:', err);
      throw err;
    }
  }

  return _db;
};

/**
 * Get all categories
 */
export const getAllCategories = () => {
  if (!_sqlite) {
    getDB();
  }
  if (!_sqlite) return [];

  const results = _sqlite
    .prepare(
      'SELECT id, main_category as mainCategory, subcategory, created_at as createdAt FROM categories ORDER BY main_category, subcategory'
    )
    .all();

  return results;
};

/**
 * Validate a category/subcategory pair
 */
export const validateCategory = (mainCategory: string, subcategory: string): boolean => {
  if (!_sqlite) {
    getDB();
  }
  if (!_sqlite) return false;

  const result = _sqlite
    .prepare('SELECT COUNT(*) as count FROM categories WHERE main_category = ? AND subcategory = ?')
    .get(mainCategory, subcategory) as { count: number };

  return result.count > 0;
};

/**
 * Get all subcategories for a main category
 */
export const getSubcategories = (mainCategory: string): string[] => {
  if (!_sqlite) {
    getDB();
  }
  if (!_sqlite) return [];

  const results = _sqlite
    .prepare('SELECT subcategory FROM categories WHERE main_category = ? ORDER BY subcategory')
    .all(mainCategory) as { subcategory: string }[];

  return results.map((r) => r.subcategory);
};

/**
 * Get all main categories
 */
export const getMainCategories = (): string[] => {
  if (!_sqlite) {
    getDB();
  }
  if (!_sqlite) return [];

  const results = _sqlite
    .prepare('SELECT DISTINCT main_category FROM categories ORDER BY main_category')
    .all() as { main_category: string }[];

  return results.map((r) => r.main_category);
};

/**
 * Get the raw SQLite database instance
 */
export const getSQLite = () => {
  if (!isNode()) {
    throw new Error('Database operations are only supported in Node.js environment');
  }

  if (!_sqlite) {
    getDB(); // Initialize if needed
  }
  return _sqlite;
};

/**
 * Find similar questions for duplicate detection
 */
export const findSimilarQuestions = (questionText: string) => {
  if (!isNode()) {
    throw new Error('Database operations are only supported in Node.js environment');
  }

  const sqlite = getSQLite();
  if (!sqlite) {
    console.error('SQLite database not initialized');
    return [];
  }

  try {
    // First try a direct match
    const exactMatches = sqlite
      .prepare(`SELECT * FROM questions WHERE LOWER(question) = LOWER(?)`)
      .all(questionText);

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
      .all(`%${questionText}%`);

    return fuzzyMatches;
  } catch (err) {
    console.error('Error checking for similar questions:', err);
    return [];
  }
};

/**
 * Save question to backup JSON file for historical tracking
 */
export const saveQuestionToBackupFile = (question: any) => {
  if (!isNode()) {
    throw new Error('File system operations are only supported in Node.js environment');
  }

  try {
    const backupDir = path.join(process.cwd(), 'data', 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, 'questions_backup.json');
    let questions = [];

    // Read existing backup file if it exists
    if (fs.existsSync(backupFile)) {
      const content = fs.readFileSync(backupFile, 'utf-8');
      try {
        questions = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing backup file:', e);
        questions = [];
      }
    }

    // Add the new question
    questions.push({
      ...question,
      backupTimestamp: new Date().toISOString(),
    });

    // Write back to the file
    fs.writeFileSync(backupFile, JSON.stringify(questions, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to backup question:', err);
    return false;
  }
};

/**
 * Check if a question contains its answer
 */
export const checkQuestionContainsAnswer = (question: string, answer: string): boolean => {
  // Convert both to lowercase for case-insensitive comparison
  const normalizedQuestion = question.toLowerCase();
  const normalizedAnswer = answer.toLowerCase();

  // Clean up the strings by removing punctuation and extra spaces
  const cleanQuestion = normalizedQuestion
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanAnswer = normalizedAnswer
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split answer into words
  const answerWords = cleanAnswer.split(' ');

  // For very short answers (1-2 words), check if the exact phrase appears
  if (answerWords.length <= 2) {
    return cleanQuestion.includes(cleanAnswer);
  }

  // For longer answers, check if a significant portion of the answer appears in sequence
  const significantLength = Math.ceil(answerWords.length * 0.75); // 75% of the answer words
  for (let i = 0; i <= answerWords.length - significantLength; i++) {
    const phrase = answerWords.slice(i, i + significantLength).join(' ');
    if (cleanQuestion.includes(phrase)) {
      return true;
    }
  }

  return false;
};
