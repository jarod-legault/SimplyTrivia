import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDB } from './server-db';
import * as schema from '../models/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const QUESTIONS_DIR = path.join(DATA_DIR, 'questions');

interface ManifestFile {
  lastUpdate: string;
  categories: {
    timestamp: string;
    count: number;
  };
  questionFiles: {
    [key: string]: {
      timestamp: string;
      questionCount: number;
      mainCategory: string;
    };
  };
}

interface JsonQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string;
  mainCategory: string;
  subcategory: string;
  difficulty: string;
  createdAt: string;
}

interface JsonCategory {
  id: string;
  mainCategory: string;
  subcategory: string;
  createdAt: number;
}

/**
 * Normalize a date value for consistent comparison
 */
const normalizeDate = (date: any): string | null => {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  } catch {
    console.error('Invalid date value:', date);
    return null;
  }
};

/**
 * Verify that manifest.json is valid and consistent
 */
export const verifyManifest = async (): Promise<boolean> => {
  try {
    const manifestPath = path.join(DATA_DIR, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json does not exist');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ManifestFile;
    const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf-8'));

    // Verify category count matches
    if (manifest.categories.count !== categories.length) {
      throw new Error(
        `Category count mismatch: manifest has ${manifest.categories.count}, found ${categories.length}`
      );
    }

    // Verify each question file exists and counts match
    for (const [fileName, info] of Object.entries(manifest.questionFiles)) {
      const filePath = path.join(QUESTIONS_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Question file ${fileName} is missing`);
      }

      const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (questions.length !== info.questionCount) {
        throw new Error(
          `Question count mismatch in ${fileName}: manifest has ${info.questionCount}, file has ${questions.length}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Manifest verification failed:', error);
    return false;
  }
};

/**
 * Verify that categories.json is valid and consistent with the database
 */
export const verifyCategoryConsistency = async (): Promise<boolean> => {
  try {
    const db = getDB();
    const categoriesPath = path.join(DATA_DIR, 'categories.json');

    if (!fs.existsSync(categoriesPath)) {
      throw new Error('categories.json does not exist');
    }

    const jsonCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')) as JsonCategory[];
    const dbCategories = await db.select().from(schema.categories);

    // Verify counts match
    if (dbCategories.length !== jsonCategories.length) {
      throw new Error(
        `Category count mismatch: DB has ${dbCategories.length}, JSON has ${jsonCategories.length}`
      );
    }

    // Create maps for easy lookup
    const dbMap = new Map(dbCategories.map((c) => [c.id, c]));
    const jsonMap = new Map(jsonCategories.map((c) => [c.id, c]));

    // Verify each category exists in both places and contents match
    for (const [id, dbCategory] of dbMap) {
      const jsonCategory = jsonMap.get(id);
      if (!jsonCategory) {
        throw new Error(`Category ${id} exists in DB but not in JSON`);
      }

      // Compare fields
      if (
        dbCategory.mainCategory !== jsonCategory.mainCategory ||
        dbCategory.subcategory !== jsonCategory.subcategory
      ) {
        throw new Error(
          `Category ${id} data mismatch: DB has ${dbCategory.mainCategory}/${dbCategory.subcategory}, JSON has ${jsonCategory.mainCategory}/${jsonCategory.subcategory}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Category consistency verification failed:', error);
    return false;
  }
};

/**
 * Verify a specific category's questions file is consistent with the database
 */
export const verifyQuestionFileConsistency = async (mainCategory: string): Promise<boolean> => {
  try {
    const db = getDB();
    const fileName = `${mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    const filePath = path.join(QUESTIONS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Question file ${fileName} does not exist`);
    }

    const jsonQuestions = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JsonQuestion[];
    const dbQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.mainCategory, mainCategory));

    // Verify counts match
    if (dbQuestions.length !== jsonQuestions.length) {
      throw new Error(
        `Question count mismatch for ${mainCategory}: DB has ${dbQuestions.length}, JSON has ${jsonQuestions.length}`
      );
    }

    // Create maps for easy lookup
    const dbMap = new Map(dbQuestions.map((q) => [q.id, q]));
    const jsonMap = new Map(jsonQuestions.map((q) => [q.id, q]));

    // Verify each question exists in both places and contents match
    for (const [id, dbQuestion] of dbMap) {
      const jsonQuestion = jsonMap.get(id);
      if (!jsonQuestion) {
        throw new Error(`Question ${id} exists in DB but not in JSON`);
      }

      // Compare fields
      const dbFields = Object.entries(dbQuestion);
      for (const [field, value] of dbFields) {
        const jsonValue = (jsonQuestion as any)[field];
        const normalizedDbValue = field === 'createdAt' ? normalizeDate(value) : value;
        const normalizedJsonValue = field === 'createdAt' ? normalizeDate(jsonValue) : jsonValue;

        if (JSON.stringify(normalizedDbValue) !== JSON.stringify(normalizedJsonValue)) {
          throw new Error(`Question ${id} field "${field}" mismatch in ${mainCategory}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Question file consistency verification failed for ${mainCategory}:`, error);
    return false;
  }
};

/**
 * Verify all JSON files are consistent with the database
 */
export const verifyAllFiles = async (): Promise<boolean> => {
  try {
    // Verify manifest first
    if (!(await verifyManifest())) {
      return false;
    }

    // Verify categories
    if (!(await verifyCategoryConsistency())) {
      return false;
    }

    // Get all main categories
    const categories = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf-8')
    ) as JsonCategory[];
    const mainCategories = [...new Set(categories.map((c) => c.mainCategory))];

    // Verify each category's questions file
    for (const mainCategory of mainCategories) {
      if (!(await verifyQuestionFileConsistency(mainCategory))) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('File verification failed:', error);
    return false;
  }
};
