import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDB, getAllCategories } from './server-db';
import { Category, Question } from '../models/database.common';
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

async function verifyDataConsistency(dbQuestions: any[], jsonQuestions: any[]) {
  // First verify the counts match
  if (dbQuestions.length !== jsonQuestions.length) {
    throw new Error(
      `Count mismatch: DB has ${dbQuestions.length} questions, JSON has ${jsonQuestions.length} questions`
    );
  }

  // Create maps for easy lookup
  const dbMap = new Map(dbQuestions.map((q) => [q.id, q]));
  const jsonMap = new Map(jsonQuestions.map((q) => [q.id, q]));

  const normalizeDate = (date: any) => {
    if (!date) return null;
    try {
      // Handle both string dates and Date objects
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString();
    } catch (e) {
      console.error('Invalid date value:', date);
      return null;
    }
  };

  // Verify each question exists in both places and contents match
  for (const [id, dbQuestion] of dbMap) {
    const jsonQuestion = jsonMap.get(id);
    if (!jsonQuestion) {
      throw new Error(`Question ${id} exists in DB but not in JSON`);
    }

    // Normalize timestamps for comparison
    const dbQuestionNormalized = {
      ...dbQuestion,
      createdAt: normalizeDate(dbQuestion.createdAt),
      updatedAt: normalizeDate(dbQuestion.updatedAt),
    };

    const jsonQuestionNormalized = {
      ...jsonQuestion,
      createdAt: normalizeDate(jsonQuestion.createdAt),
      updatedAt: normalizeDate(jsonQuestion.updatedAt),
    };

    // Compare the normalized objects
    for (const field of Object.keys(dbQuestionNormalized)) {
      if (
        JSON.stringify(dbQuestionNormalized[field]) !==
        JSON.stringify(jsonQuestionNormalized[field])
      ) {
        console.warn(
          `Question ${id} field "${field}" mismatch:`,
          '\nDB:',
          dbQuestionNormalized[field],
          '\nJSON:',
          jsonQuestionNormalized[field]
        );
      }
    }
  }

  console.log('Data consistency verification completed');
  return true;
}

const initializeJsonFiles = async () => {
  try {
    // Create questions directory if it doesn't exist
    if (!fs.existsSync(QUESTIONS_DIR)) {
      fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
    }

    const db = getDB();
    const now = new Date().toISOString();

    // Get all categories
    console.log('Fetching categories...');
    const categories = getAllCategories() as Category[];

    // Generate categories.json
    console.log('Generating categories.json...');
    fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2));

    // Initialize manifest
    const manifest: ManifestFile = {
      lastUpdate: now,
      categories: {
        timestamp: now,
        count: categories.length,
      },
      questionFiles: {},
    };

    // Generate question files for each main category
    console.log('Generating question files by category...');
    const uniqueMainCategories = [...new Set(categories.map((c: Category) => c.mainCategory))];

    for (const mainCategory of uniqueMainCategories) {
      const questions = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.mainCategory, mainCategory));

      const fileName = `${mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      const filePath = path.join(QUESTIONS_DIR, fileName);

      // Write questions to category-specific file
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

      // Update manifest
      manifest.questionFiles[fileName] = {
        timestamp: now,
        questionCount: questions.length,
        mainCategory,
      };

      console.log(`Generated ${fileName} with ${questions.length} questions`);
    }

    // Write manifest file
    console.log('Writing manifest.json...');
    fs.writeFileSync(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Verify data consistency
    console.log('Verifying data consistency...');
    const dbQuestions = await db.select().from(schema.questions);

    // Read and combine all category question files
    const jsonQuestions = uniqueMainCategories.flatMap((mainCategory) => {
      const fileName = `${mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      const filePath = path.join(QUESTIONS_DIR, fileName);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });

    await verifyDataConsistency(dbQuestions, jsonQuestions);

    console.log('JSON files initialization and verification complete!');
    return true;
  } catch (error) {
    console.error('Error during initialization:', error);
    throw error;
  }
};

// Run the initialization if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
  initializeJsonFiles()
    .then(() => {
      console.log('Successfully initialized JSON files');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize JSON files:', error);
      process.exit(1);
    });
}

export { initializeJsonFiles };
