import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import * as schema from '../models/schema';

// Define the database directory and file
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'questions.db');

// Make sure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize the database connection
let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

/**
 * Get the database instance, initializing it if necessary
 */
export const getDB = () => {
  if (!_db) {
    try {
      _sqlite = new Database(DB_PATH);
      _db = drizzle(_sqlite, { schema });

      // Initialize the database schema
      _sqlite.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY NOT NULL,
          question TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          incorrect_answers TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          created_at INTEGER NOT NULL
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
 * Get the raw SQLite database instance
 */
export const getSQLite = () => {
  if (!_sqlite) {
    getDB(); // Initialize if needed
  }
  return _sqlite;
};

/**
 * Find similar questions for duplicate detection
 */
export const findSimilarQuestions = (questionText: string) => {
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
