import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDB, getAllCategories } from './server-db';
import { Category } from '../models/database.common';
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

    console.log('JSON files initialization complete!');
    return true;
  } catch (error) {
    console.error('Error initializing JSON files:', error);
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
