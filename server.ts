import cors from 'cors';
import { eq } from 'drizzle-orm';
import express, { Request, Response, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import { PORT } from './config';
import * as schema from './models/schema';
import { QuestionData } from './models/schema';
import { getDB } from './utils/server-db';
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
    const errors = [];

    for (const data of questionsData) {
      try {
        // Transform input data to match schema
        const newQuestion = {
          id: generateUUID(),
          question: data.question,
          correctAnswer: data.correct_answer,
          incorrectAnswers:
            typeof data.incorrect_answers === 'string'
              ? data.incorrect_answers
              : JSON.stringify(data.incorrect_answers),
          category: data.category,
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
      errors: errors.length,
      addedData: added,
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

    // Transform input data to match schema
    const updatedQuestion = {
      question: req.body.question,
      correctAnswer: req.body.correct_answer,
      incorrectAnswers:
        typeof req.body.incorrect_answers === 'string'
          ? req.body.incorrect_answers
          : JSON.stringify(req.body.incorrect_answers),
      category: req.body.category,
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

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
