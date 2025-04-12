import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';

import { generateUUID } from './uuid';
import * as schema from '../models/schema';

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
      _sqlite = new Database(DB_PATH);
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
      `);

      // Populate categories if empty
      const categoriesCount = _sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as {
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

  return _db;
};

/**
 * Populate the categories table with predefined categories
 */
const populateCategories = () => {
  if (!_sqlite) return;

  const categories = [
    // Pop Culture
    { main: 'Pop Culture', sub: 'Movies' },
    { main: 'Pop Culture', sub: 'Television' },
    { main: 'Pop Culture', sub: 'Music' },
    { main: 'Pop Culture', sub: 'Broadway musicals' },
    { main: 'Pop Culture', sub: 'Video Games' },
    { main: 'Pop Culture', sub: 'Board Games' },
    { main: 'Pop Culture', sub: 'Comics' },
    { main: 'Pop Culture', sub: 'Books & Literature' },
    { main: 'Pop Culture', sub: 'Celebrities' },
    { main: 'Pop Culture', sub: 'Internet Culture, Memes, & Viral Content' },

    // Science & Nature
    { main: 'Science & Nature', sub: 'Biology' },
    { main: 'Science & Nature', sub: 'Chemistry' },
    { main: 'Science & Nature', sub: 'Physics' },
    { main: 'Science & Nature', sub: 'Astronomy & Space' },
    { main: 'Science & Nature', sub: 'Earth Science' },
    { main: 'Science & Nature', sub: 'Animals & Wildlife' },
    { main: 'Science & Nature', sub: 'Plants & Botany' },

    // History
    { main: 'History', sub: 'Ancient History' },
    { main: 'History', sub: 'Medieval History' },
    { main: 'History', sub: 'Modern History' },
    { main: 'History', sub: 'Wars & Conflicts' },
    { main: 'History', sub: 'Historical Figures' },
    { main: 'History', sub: 'Inventions & Discoveries' },
    { main: 'History', sub: 'World Leaders' },
    { main: 'History', sub: 'Archaeological Finds' },

    // Geography
    { main: 'Geography', sub: 'Countries & Capitals' },
    { main: 'Geography', sub: 'Landmarks & Monuments' },
    { main: 'Geography', sub: 'Rivers, Lakes & Oceans' },
    { main: 'Geography', sub: 'Mountains & Volcanoes' },
    { main: 'Geography', sub: 'Cities Around the World' },
    { main: 'Geography', sub: 'Maps & Borders' },
    { main: 'Geography', sub: 'World Cultures' },

    // Sports & Games
    { main: 'Sports & Games', sub: 'Olympic Games' },
    { main: 'Sports & Games', sub: 'American/Canadian Football' },
    { main: 'Sports & Games', sub: 'Football/Soccer' },
    { main: 'Sports & Games', sub: 'Baseball' },
    { main: 'Sports & Games', sub: 'Basketball' },
    { main: 'Sports & Games', sub: 'Hockey' },
    { main: 'Sports & Games', sub: 'Cricket' },
    { main: 'Sports & Games', sub: 'Boxing / Martial Arts' },

    // Art & Culture
    { main: 'Art & Culture', sub: 'Painting & Drawing' },
    { main: 'Art & Culture', sub: 'Sculpture' },
    { main: 'Art & Culture', sub: 'Architecture' },
    { main: 'Art & Culture', sub: 'Museums & Galleries' },

    // Food & Drink
    { main: 'Food & Drink', sub: 'Cuisine Around the World' },
    { main: 'Food & Drink', sub: 'Cooking & Ingredients' },
    { main: 'Food & Drink', sub: 'Beverages & Cocktails' },
    { main: 'Food & Drink', sub: 'Wine & Beer' },

    // Technology
    { main: 'Technology', sub: 'Computers & Internet' },
    { main: 'Technology', sub: 'Social Media' },
    { main: 'Technology', sub: 'Famous Inventions' },
    { main: 'Technology', sub: 'Tech Companies' },
    { main: 'Technology', sub: 'Tech History' },

    // Language & Words
    { main: 'Language & Words', sub: 'Idioms & Expressions' },
    { main: 'Language & Words', sub: 'Famous Quotes' },
    { main: 'Language & Words', sub: 'Slang & Colloquialisms' },
    { main: 'Language & Words', sub: 'Grammar & Vocabulary' },

    // Miscellaneous
    { main: 'Miscellaneous', sub: 'Weird Facts' },
    { main: 'Miscellaneous', sub: 'World Records' },
    { main: 'Miscellaneous', sub: 'Holiday Traditions' },
    { main: 'Miscellaneous', sub: 'Advertising & Brands' },
  ];

  const insertCategory = _sqlite.prepare(`
    INSERT INTO categories (id, main_category, subcategory, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const timestamp = new Date().getTime();

  _sqlite.transaction(() => {
    for (const category of categories) {
      insertCategory.run(generateUUID(), category.main, category.sub, timestamp);
    }
  })();
};

/**
 * Get all categories
 */
export const getAllCategories = () => {
  if (!_sqlite) {
    getDB();
  }
  if (!_sqlite) return [];

  return _sqlite.prepare('SELECT * FROM categories ORDER BY main_category, subcategory').all();
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
