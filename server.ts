import cors from 'cors';
import { eq } from 'drizzle-orm';
import express, { Request, Response, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { PORT } from './config';
import * as schema from './models/schema';
import { QuestionData } from './models/schema';
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

// Get all questions
app.get('/api/questions', (async (_req: Request, res: Response) => {
  try {
    const db = getDB();
    const questions = await db.select().from(schema.questions);
    res.json({
      success: true,
      count: questions.length,
      data: questions,
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
    const db = getDB();
    const questionsData = Array.isArray(req.body) ? req.body : [req.body];
    const added = [];
    const duplicates = [];
    const errors = [];

    for (const data of questionsData) {
      try {
        // Validate category/subcategory
        if (!validateCategory(data.main_category, data.subcategory)) {
          errors.push({
            question: data.question,
            error: `Invalid category combination: ${data.main_category}/${data.subcategory}`,
          });
          continue;
        }

        // Check for duplicates
        const similarQuestions = findSimilarQuestions(data.question);
        if (similarQuestions.length > 0) {
          duplicates.push({ newQuestion: data, similarQuestions });
          continue;
        }

        // Transform input data to match schema
        const newQuestion = {
          id: generateUUID(),
          question: data.question,
          correctAnswer: data.correct_answer,
          incorrectAnswers:
            typeof data.incorrect_answers === 'string'
              ? data.incorrect_answers
              : JSON.stringify(data.incorrect_answers),
          mainCategory: data.main_category,
          subcategory: data.subcategory,
          difficulty: data.difficulty,
          createdAt: new Date(),
        };

        // Add the question to the database
        await db.insert(schema.questions).values(newQuestion);
        added.push(newQuestion);
      } catch (err) {
        errors.push({
          question: data.question,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

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

    // Delete the question
    await db.delete(schema.questions).where(eq(schema.questions.id, req.params.id));

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
      incorrectAnswers:
        typeof req.body.incorrect_answers === 'string'
          ? req.body.incorrect_answers
          : JSON.stringify(req.body.incorrect_answers),
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

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
