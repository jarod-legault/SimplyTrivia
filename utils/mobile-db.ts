import { eq, and, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

// Import JSON files
import { generateUUID } from './uuid';
import categories from '../data/categories.json';
import manifest from '../data/manifest.json';
import artCulture from '../data/questions/art-culture.json';
import foodDrink from '../data/questions/food-drink.json';
import geography from '../data/questions/geography.json';
import history from '../data/questions/history.json';
import languageWords from '../data/questions/language-words.json';
import miscellaneous from '../data/questions/miscellaneous.json';
import popCulture from '../data/questions/pop-culture.json';
import scienceNature from '../data/questions/science-nature.json';
import sportsGames from '../data/questions/sports-games.json';
import technology from '../data/questions/technology.json';
import { Category, Question } from '../models/database.common';
import * as schema from '../models/schema';

const questionFiles = {
  'art-culture.json': artCulture,
  'food-drink.json': foodDrink,
  'geography.json': geography,
  'history.json': history,
  'language-words.json': languageWords,
  'miscellaneous.json': miscellaneous,
  'pop-culture.json': popCulture,
  'science-nature.json': scienceNature,
  'sports-games.json': sportsGames,
  'technology.json': technology,
};

const DB_NAME = 'questions.db';

let db: ReturnType<typeof drizzle> | null = null;

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

interface CategoryUpdate {
  mainCategory: string;
  subcategory: string;
  action: 'add' | 'update' | 'delete';
}

interface QuestionFileUpdate {
  mainCategory: string;
  fileName: string;
  questionCount: number;
  action: 'update';
}

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

const writeJsonToFile = async (data: any, targetPath: string): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(targetPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing JSON to ${targetPath}:`, error);
    throw error;
  }
};

const initializeJsonFiles = async (): Promise<void> => {
  console.log('Initializing JSON files...');
  const dataDir = FileSystem.documentDirectory + 'data';
  const questionsDir = dataDir + '/questions';

  // Ensure directories exist
  console.log('Creating directories...');
  await ensureDirectoryExists(dataDir);
  await ensureDirectoryExists(questionsDir);

  // Write manifest.json
  console.log('Writing manifest.json...');
  await writeJsonToFile(manifest, dataDir + '/manifest.json');

  // Write categories.json
  console.log('Writing categories.json...');
  await writeJsonToFile(categories, dataDir + '/categories.json');

  // Write question files
  for (const [fileName, data] of Object.entries(questionFiles)) {
    console.log(`Writing question file: ${fileName}...`);
    await writeJsonToFile(data, questionsDir + '/' + fileName);
  }
  console.log('JSON files initialization complete');
};

const createTables = async (sqlite: SQLite.SQLiteDatabase) => {
  console.log('Creating database tables...');

  await sqlite.execAsync(`
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

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  console.log('Tables created successfully');
};

const getStoredTimestamp = async (
  sqlite: SQLite.SQLiteDatabase,
  key: string
): Promise<string | null> => {
  try {
    const result = await sqlite.execAsync(`SELECT value FROM metadata WHERE key = '${key}'`);
    return (result as unknown as [{ value: string }][])?.[0]?.[0]?.value || null;
  } catch (error) {
    console.error('Error getting stored timestamp:', error);
    return null;
  }
};

const updateStoredTimestamp = async (
  sqlite: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> => {
  try {
    await sqlite.execAsync(
      `INSERT OR REPLACE INTO metadata (key, value) VALUES ('${key}', '${value}')`
    );
  } catch (error) {
    console.error('Error updating stored timestamp:', error);
    throw error;
  }
};

const checkManifestTimestamps = async (sqlite: SQLite.SQLiteDatabase): Promise<boolean> => {
  try {
    const manifestJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/manifest.json'
    );
    const manifest = JSON.parse(manifestJson) as ManifestFile;

    const storedCategoriesTimestamp = await getStoredTimestamp(sqlite, 'categories_timestamp');
    if (!storedCategoriesTimestamp || storedCategoriesTimestamp < manifest.categories.timestamp) {
      console.log('Categories need update');
      return true;
    }

    for (const info of Object.values(manifest.questionFiles)) {
      const storedTimestamp = await getStoredTimestamp(
        sqlite,
        `questions_${info.mainCategory}_timestamp`
      );
      if (!storedTimestamp || storedTimestamp < info.timestamp) {
        console.log(`Questions for ${info.mainCategory} need update`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking manifest timestamps:', error);
    throw error;
  }
};

export const checkCategoryUpdates = async (
  sqlite: SQLite.SQLiteDatabase
): Promise<CategoryUpdate[]> => {
  try {
    const categoriesJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/categories.json'
    );
    const newCategories = JSON.parse(categoriesJson) as Category[];

    // Get current categories from database
    const currentCategoriesRows = (await sqlite.execAsync(
      'SELECT id, main_category, subcategory FROM categories'
    )) as unknown as [{ id: string; main_category: string; subcategory: string }][];
    const currentCategories = currentCategoriesRows?.[0] || [];

    const updates: CategoryUpdate[] = [];

    // Create maps for easier comparison
    const currentMap = new Map(
      currentCategories.map((c) => [`${c.main_category}:${c.subcategory}`, c])
    );
    const newMap = new Map(newCategories.map((c) => [`${c.mainCategory}:${c.subcategory}`, c]));

    // Find categories to add or update
    for (const category of newCategories) {
      const key = `${category.mainCategory}:${category.subcategory}`;
      if (!currentMap.has(key)) {
        updates.push({
          mainCategory: category.mainCategory,
          subcategory: category.subcategory,
          action: 'add',
        });
      }
    }

    // Find categories to delete
    for (const category of currentCategories) {
      const key = `${category.main_category}:${category.subcategory}`;
      if (!newMap.has(key)) {
        updates.push({
          mainCategory: category.main_category,
          subcategory: category.subcategory,
          action: 'delete',
        });
      }
    }

    return updates;
  } catch (error) {
    console.error('Error checking category updates:', error);
    throw error;
  }
};

export const checkQuestionFileUpdates = async (
  sqlite: SQLite.SQLiteDatabase
): Promise<QuestionFileUpdate[]> => {
  try {
    // Load manifest.json
    const manifestJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/manifest.json'
    );
    const manifest = JSON.parse(manifestJson) as ManifestFile;
    const updates: QuestionFileUpdate[] = [];

    // Check each question file in manifest
    for (const [fileName, info] of Object.entries(manifest.questionFiles)) {
      const storedTimestamp = await getStoredTimestamp(
        sqlite,
        `questions_${info.mainCategory}_timestamp`
      );

      // If no timestamp stored or timestamp is older than manifest, file needs update
      if (!storedTimestamp || storedTimestamp < info.timestamp) {
        // Get current question count for this category
        const result = (await sqlite.execAsync(
          `SELECT COUNT(*) as count FROM questions WHERE main_category = '${info.mainCategory}'`
        )) as unknown as [{ count: number }][];

        const currentCount = result?.[0]?.[0]?.count ?? 0;

        // If counts don't match or timestamp is old, update needed
        if (
          currentCount !== info.questionCount ||
          !storedTimestamp ||
          storedTimestamp < info.timestamp
        ) {
          updates.push({
            mainCategory: info.mainCategory,
            fileName,
            questionCount: info.questionCount,
            action: 'update',
          });
        }
      }
    }

    return updates;
  } catch (error) {
    console.error('Error checking question file updates:', error);
    throw error;
  }
};

export const applyCategoryUpdates = async (
  sqlite: SQLite.SQLiteDatabase,
  updates: CategoryUpdate[]
): Promise<void> => {
  if (updates.length === 0) {
    return;
  }

  try {
    // Load current manifest and categories
    const manifestJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/manifest.json'
    );
    const manifest = JSON.parse(manifestJson) as ManifestFile;
    const categoriesJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/categories.json'
    );
    const categories = JSON.parse(categoriesJson) as Category[];

    // Start transaction
    await sqlite.execAsync('BEGIN TRANSACTION');

    try {
      for (const update of updates) {
        if (update.action === 'delete') {
          // Delete the category and its questions
          await sqlite.execAsync(
            `DELETE FROM questions WHERE main_category = '${update.mainCategory}' AND subcategory = '${update.subcategory}'`
          );
          await sqlite.execAsync(
            `DELETE FROM categories WHERE main_category = '${update.mainCategory}' AND subcategory = '${update.subcategory}'`
          );

          // If this was the last subcategory for this main category, we should delete
          // any questions file metadata from manifest
          const remainingCategories = categories.filter(
            (c) => c.mainCategory === update.mainCategory
          );
          if (remainingCategories.length === 0) {
            const fileName = `${update.mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
            if (manifest.questionFiles[fileName]) {
              delete manifest.questionFiles[fileName];
            }
          }
        } else if (update.action === 'add') {
          // Find the category in the JSON file
          const newCategory = categories.find(
            (c) => c.mainCategory === update.mainCategory && c.subcategory === update.subcategory
          );
          if (!newCategory) {
            throw new Error(
              `Category ${update.mainCategory}/${update.subcategory} not found in categories.json`
            );
          }

          // Add the new category
          await sqlite.execAsync(
            `INSERT INTO categories (id, main_category, subcategory, created_at)
             VALUES ('${newCategory.id}', '${newCategory.mainCategory}', '${newCategory.subcategory}',
             ${new Date(newCategory.createdAt).getTime()})`
          );
        }
      }

      // Update the stored timestamp
      await updateStoredTimestamp(sqlite, 'categories_timestamp', manifest.categories.timestamp);

      // Commit transaction
      await sqlite.execAsync('COMMIT');
      console.log('Category updates applied successfully');
    } catch (error) {
      await sqlite.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error applying category updates:', error);
    throw error;
  }
};

export const applyQuestionFileUpdates = async (
  sqlite: SQLite.SQLiteDatabase,
  updates: QuestionFileUpdate[]
): Promise<void> => {
  if (updates.length === 0) {
    return;
  }

  try {
    // Load manifest file
    const manifestJson = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'data/manifest.json'
    );
    const manifest = JSON.parse(manifestJson) as ManifestFile;

    // Process each question file update
    for (const update of updates) {
      console.log(`Updating questions for ${update.mainCategory}...`);

      // Read the question file
      const questions = JSON.parse(
        await FileSystem.readAsStringAsync(
          FileSystem.documentDirectory + `data/questions/${update.fileName}`
        )
      );

      // Start transaction for this category's questions
      await sqlite.execAsync('BEGIN TRANSACTION');

      try {
        // Delete existing questions for this category
        await sqlite.execAsync(
          `DELETE FROM questions WHERE main_category = '${update.mainCategory}'`
        );

        // Import new questions
        for (const question of questions) {
          await sqlite.execAsync(
            `INSERT INTO questions (id, question, correct_answer, incorrect_answers,
              main_category, subcategory, difficulty, created_at)
             VALUES ('${question.id}', '${question.question.replace(/'/g, "''")}',
             '${question.correctAnswer.replace(/'/g, "''")}',
             '${question.incorrectAnswers.replace(/'/g, "''")}',
             '${question.mainCategory}', '${question.subcategory}',
             '${question.difficulty}', ${new Date(question.createdAt).getTime()})`
          );
        }

        // Update timestamp for this category
        await updateStoredTimestamp(
          sqlite,
          `questions_${update.mainCategory}_timestamp`,
          manifest.questionFiles[update.fileName].timestamp
        );

        // Commit transaction
        await sqlite.execAsync('COMMIT');
        console.log(
          `Successfully updated ${questions.length} questions for ${update.mainCategory}`
        );
      } catch (error) {
        await sqlite.execAsync('ROLLBACK');
        throw error;
      }
    }
  } catch (error) {
    console.error('Error applying question file updates:', error);
    throw error;
  }
};

const importData = async (sqlite: SQLite.SQLiteDatabase) => {
  try {
    // First check if we already have data
    const countResult = (await sqlite.execAsync(
      'SELECT COUNT(*) as count FROM categories;'
    )) as unknown as { count: number }[];

    // Check manifest timestamps if we have existing data
    if (countResult?.[0]?.count > 0) {
      const needsUpdate = await checkManifestTimestamps(sqlite);
      if (!needsUpdate) {
        console.log('Database is up to date with manifest');
        return;
      }
    }

    // Load manifest and data files
    const manifest = JSON.parse(
      await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'data/manifest.json')
    ) as ManifestFile;

    // Import categories
    console.log('Importing categories...');
    const categories = JSON.parse(
      await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'data/categories.json')
    );
    console.log(`Found ${categories.length} categories to import`);

    // Start transaction for categories
    await sqlite.execAsync('BEGIN TRANSACTION');
    try {
      // Clear existing categories
      await sqlite.execAsync('DELETE FROM categories');

      // Import new categories
      for (const category of categories) {
        await sqlite.execAsync(
          `INSERT INTO categories (id, main_category, subcategory, created_at)
           VALUES ('${category.id}', '${category.mainCategory}', '${category.subcategory}',
           ${new Date(category.createdAt).getTime()})`
        );
      }

      // Update categories timestamp
      await updateStoredTimestamp(sqlite, 'categories_timestamp', manifest.categories.timestamp);
      await sqlite.execAsync('COMMIT');
    } catch (error) {
      await sqlite.execAsync('ROLLBACK');
      throw error;
    }

    console.log('Categories imported successfully');

    // Import questions by category
    for (const [_fileName, info] of Object.entries(manifest.questionFiles)) {
      console.log(`Importing questions for ${info.mainCategory}...`);
      const questions = JSON.parse(
        await FileSystem.readAsStringAsync(
          FileSystem.documentDirectory + `data/questions/${_fileName}`
        )
      );

      // Start transaction for this category's questions
      await sqlite.execAsync('BEGIN TRANSACTION');
      try {
        // Delete existing questions for this category
        await sqlite.execAsync(
          `DELETE FROM questions WHERE main_category = '${info.mainCategory}'`
        );

        // Import new questions
        for (const question of questions) {
          await sqlite.execAsync(
            `INSERT INTO questions (id, question, correct_answer, incorrect_answers,
              main_category, subcategory, difficulty, created_at)
             VALUES ('${question.id}', '${question.question.replace(/'/g, "''")}',
             '${question.correctAnswer.replace(/'/g, "''")}',
             '${question.incorrectAnswers.replace(/'/g, "''")}',
             '${question.mainCategory}', '${question.subcategory}',
             '${question.difficulty}', ${new Date(question.createdAt).getTime()})`
          );
        }

        // Update timestamp for this category
        await updateStoredTimestamp(
          sqlite,
          `questions_${info.mainCategory}_timestamp`,
          info.timestamp
        );
        await sqlite.execAsync('COMMIT');
      } catch (error) {
        await sqlite.execAsync('ROLLBACK');
        throw error;
      }

      console.log(`Imported ${questions.length} questions for ${info.mainCategory}`);
    }

    console.log('Data import completed successfully');
  } catch (importError) {
    console.error('Error during data import:', importError);
    throw importError;
  }
};

export const initDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing database...');

    // Initialize JSON files first
    await initializeJsonFiles();

    // Try to close and delete any existing database
    try {
      const existing = SQLite.openDatabaseSync(DB_NAME);
      await existing.closeAsync();
      console.log('Closed existing database');
    } catch {
      // Ignore errors - database might not exist
    }

    // Create a fresh database
    const sqlite = SQLite.openDatabaseSync(DB_NAME);
    console.log('Opened new database connection');

    // Create tables
    await createTables(sqlite);

    // Import data from the source database
    await importData(sqlite);

    // Initialize Drizzle
    db = drizzle(sqlite, { schema });
    console.log('Database initialized successfully with Drizzle');

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const database = await initDatabase();
    console.log('Fetching categories from database...');

    // Use the existing Drizzle connection for diagnostic queries
    try {
      console.log('Running diagnostic queries...');
      const tables = await database
        .select({ tables: sql<string>`GROUP_CONCAT(name)` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table'`);
      console.log('Available tables:', tables[0]?.tables);

      const catSchema = await database
        .select({ sql: sql<string>`sql` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = 'categories'`);
      console.log('Categories table schema:', catSchema[0]?.sql);
    } catch (diagError) {
      console.error('Diagnostic queries failed:', diagError);
    }

    const result = await database.select().from(schema.categories);
    console.log(`Found ${result.length} categories`);
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getQuestions = async (
  mainCategory?: string,
  subcategory?: string
): Promise<Question[]> => {
  try {
    const database = await initDatabase();

    if (mainCategory && subcategory) {
      return await database
        .select()
        .from(schema.questions)
        .where(
          and(
            eq(schema.questions.mainCategory, mainCategory),
            eq(schema.questions.subcategory, subcategory)
          )
        );
    }

    return await database.select().from(schema.questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const saveResponse = async (questionId: string, isCorrect: boolean): Promise<void> => {
  try {
    const database = await initDatabase();
    await database.insert(schema.responses).values({
      id: generateUUID(),
      questionId,
      isCorrect,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving response:', error);
    throw error;
  }
};
