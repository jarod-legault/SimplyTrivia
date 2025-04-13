import cors from 'cors';
import { eq, desc, sql } from 'drizzle-orm';
import express, { Request, Response, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { PORT } from './config';
import * as schema from './models/schema';
import { QuestionData } from './models/schema';
import { saveQuestionToBackupFile, removeQuestionFromBackups } from './utils/backup';
import {
  getDB,
  findSimilarQuestions,
  getAllCategories,
  getSubcategories,
  validateCategory,
} from './utils/server-db';
import { generateUUID } from './utils/uuid';

interface DeleteParams extends ParamsDictionary {
  id: string;
}

interface UpdateParams extends ParamsDictionary {
  id: string;
}

const app = express();
const port = PORT;

app.use(cors());
app.use(express.json());

// Get all questions with pagination
app.get('/api/questions', (async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10; // Changed from 20 to 10
    const offset = (page - 1) * limit;

    // Get total count first
    const totalCount = (await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.questions)) as { count: number }[];

    // Get paginated questions
    const questions = await db
      .select()
      .from(schema.questions)
      .orderBy(desc(schema.questions.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Add new question(s)
app.post('/api/questions', (async (
  req: Request<object, object, QuestionData | QuestionData[]>,
  res: Response
) => {
  try {
    console.log('Received POST /api/questions request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const db = getDB();
    const questionsData = Array.isArray(req.body) ? req.body : [req.body];
    console.log('Processing', questionsData.length, 'questions');

    const added = [];
    const duplicates = [];
    const errors = [];

    for (const data of questionsData) {
      try {
        console.log('Processing question:', data.question);

        // Validate question data structure
        if (!data.question || !data.correct_answer || !data.incorrect_answers || !data.difficulty) {
          console.log('Validation failed: Missing required fields');
          errors.push({
            question: data.question || 'Unknown question',
            error:
              'Missing required fields: question, correct_answer, incorrect_answers, or difficulty',
          });
          continue;
        }

        // Validate incorrect answers count
        const incorrectAnswers = Array.isArray(data.incorrect_answers)
          ? data.incorrect_answers
          : JSON.parse(data.incorrect_answers);

        if (!Array.isArray(incorrectAnswers) || incorrectAnswers.length !== 7) {
          console.log('Validation failed: Incorrect number of answers');
          errors.push({
            question: data.question,
            error: `Questions must have exactly 7 incorrect answers. Found ${
              Array.isArray(incorrectAnswers) ? incorrectAnswers.length : 0
            }`,
          });
          continue;
        }

        // Validate category/subcategory
        if (!validateCategory(data.main_category, data.subcategory)) {
          console.log('Validation failed: Invalid category combination');
          errors.push({
            question: data.question,
            error: `Invalid category combination: ${data.main_category}/${data.subcategory}`,
          });
          continue;
        }

        // Check for duplicates
        const similarQuestions = findSimilarQuestions(data.question);
        if (similarQuestions.length > 0) {
          console.log('Found similar questions:', similarQuestions.length);
          duplicates.push({ newQuestion: data, similarQuestions });
          continue;
        }

        // Transform input data to match schema
        const newQuestion = {
          id: generateUUID(),
          question: data.question,
          correctAnswer: data.correct_answer,
          incorrectAnswers: JSON.stringify(incorrectAnswers),
          mainCategory: data.main_category,
          subcategory: data.subcategory,
          difficulty: data.difficulty,
          createdAt: new Date(),
        };

        // Add the question to the database
        console.log('Adding question to database');
        await db.insert(schema.questions).values(newQuestion);
        added.push(newQuestion);
        console.log('Question added successfully');

        // Save to backup file
        console.log('Saving to backup file');
        saveQuestionToBackupFile({
          ...data,
          id: newQuestion.id,
          created_at: newQuestion.createdAt,
        });
      } catch (err) {
        console.error('Error processing question:', err);
        errors.push({
          question: data.question || 'Unknown question',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    console.log('Request complete:', {
      added: added.length,
      duplicates: duplicates.length,
      errors: errors.length,
    });

    res.json({
      success: true,
      added: added.length,
      duplicates: duplicates.length,
      errors: errors.length,
      addedData: added,
      duplicatesData: duplicates,
      errorsData: errors,
    });
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Check for duplicates
app.post('/api/questions/check-duplicates', (async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question text is required',
      });
    }

    const similarQuestions = findSimilarQuestions(question);
    res.json({
      success: true,
      hasDuplicates: similarQuestions.length > 0,
      duplicateCount: similarQuestions.length,
      duplicates: similarQuestions,
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Handle duplicate question approval/rejection
app.post('/api/questions/handle-duplicate', (async (req: Request, res: Response) => {
  try {
    const { question, approved } = req.body;
    const db = getDB();

    if (!question) {
      res.status(400).json({
        success: false,
        error: 'Question data is required',
      });
      return;
    }

    if (typeof approved !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Approved status must be a boolean',
      });
      return;
    }

    if (approved) {
      // If approved, add the question despite being a duplicate
      try {
        // Transform input data to match schema
        const incorrectAnswers = Array.isArray(question.incorrect_answers)
          ? question.incorrect_answers
          : JSON.parse(question.incorrect_answers);

        const newQuestion = {
          id: generateUUID(),
          question: question.question,
          correctAnswer: question.correct_answer,
          incorrectAnswers: JSON.stringify(incorrectAnswers),
          mainCategory: question.main_category,
          subcategory: question.subcategory,
          difficulty: question.difficulty,
          createdAt: new Date(),
        };

        // Insert into database
        await db.insert(schema.questions).values(newQuestion);

        // Save to backup
        await saveQuestionToBackupFile({
          ...question,
          id: newQuestion.id,
          created_at: newQuestion.createdAt,
        });

        res.json({
          success: true,
          message: 'Duplicate question approved and added',
        });
        return;
      } catch (error) {
        console.error('Error adding approved duplicate:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to add approved duplicate question',
        });
        return;
      }
    }

    // If not approved (rejected), just return success
    res.json({
      success: true,
      message: 'Duplicate question rejected',
    });
  } catch (error) {
    console.error('Error handling duplicate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Delete question by ID
app.delete('/api/questions/:id', (async (req: Request<DeleteParams>, res: Response) => {
  try {
    const db = getDB();

    // Check if question exists
    const question = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, req.params.id));

    if (!question || question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    // Delete from database
    await db.delete(schema.questions).where(eq(schema.questions.id, req.params.id));

    // Remove from backup files
    await removeQuestionFromBackups(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler<DeleteParams>);

// Update question by ID
app.put('/api/questions/:id', (async (
  req: Request<UpdateParams, object, QuestionData>,
  res: Response
) => {
  try {
    const db = getDB();

    // Check if question exists
    const question = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, req.params.id));

    if (!question || question.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    // Validate question data structure
    if (
      !req.body.question ||
      !req.body.correct_answer ||
      !req.body.incorrect_answers ||
      !req.body.difficulty
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: question, correct_answer, incorrect_answers, or difficulty',
      });
    }

    // Validate incorrect answers count
    const incorrectAnswers = Array.isArray(req.body.incorrect_answers)
      ? req.body.incorrect_answers
      : JSON.parse(req.body.incorrect_answers);

    if (!Array.isArray(incorrectAnswers) || incorrectAnswers.length !== 7) {
      return res.status(400).json({
        success: false,
        error: `Questions must have exactly 7 incorrect answers. Found ${
          Array.isArray(incorrectAnswers) ? incorrectAnswers.length : 0
        }`,
      });
    }

    // Validate category/subcategory
    if (!validateCategory(req.body.main_category, req.body.subcategory)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category combination: ${req.body.main_category}/${req.body.subcategory}`,
      });
    }

    // Transform input data to match schema
    const updatedQuestion = {
      question: req.body.question,
      correctAnswer: req.body.correct_answer,
      incorrectAnswers: JSON.stringify(incorrectAnswers),
      mainCategory: req.body.main_category,
      subcategory: req.body.subcategory,
      difficulty: req.body.difficulty,
    };

    // Update the question
    await db
      .update(schema.questions)
      .set(updatedQuestion)
      .where(eq(schema.questions.id, req.params.id));

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        id: req.params.id,
        ...updatedQuestion,
      },
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler<UpdateParams>);

// Get all categories
app.get('/api/categories', (async (_req: Request, res: Response) => {
  try {
    const categories = getAllCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Get subcategories for a main category
app.get('/api/categories/:mainCategory/subcategories', (async (req: Request, res: Response) => {
  try {
    const { mainCategory } = req.params;
    const subcategories = getSubcategories(mainCategory);
    res.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Add new category
app.post('/api/categories', (async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { mainCategory, subcategory } = req.body;

    if (!mainCategory || !subcategory) {
      return res.status(400).json({
        success: false,
        error: 'Main category and subcategory are required',
      });
    }

    // Check if category already exists
    const existing = await db
      .select()
      .from(schema.categories)
      .where(
        sql`${schema.categories.mainCategory} = ${mainCategory} AND ${schema.categories.subcategory} = ${subcategory}`
      );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category combination already exists',
      });
    }

    // Add the category
    const newCategory = {
      id: generateUUID(),
      mainCategory,
      subcategory,
      createdAt: new Date(),
    };

    await db.insert(schema.categories).values(newCategory);

    res.json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

// Delete category
app.delete('/api/categories/:id', (async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { id } = req.params;

    // Check if category exists
    const category = await db.select().from(schema.categories).where(eq(schema.categories.id, id));

    if (!category || category.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Check if there are any questions using this category
    const questions = await db
      .select()
      .from(schema.questions)
      .where(
        sql`${schema.questions.mainCategory} = ${category[0].mainCategory} AND ${schema.questions.subcategory} = ${category[0].subcategory}`
      );

    if (questions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category that has ${questions.length} questions. Delete the questions first.`,
      });
    }

    // Delete the category
    await db.delete(schema.categories).where(eq(schema.categories.id, id));

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}) as RequestHandler);

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
