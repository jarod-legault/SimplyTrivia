import * as schema from '../models/schema';
import { QuestionData } from '../models/schema';
import { getDB, findSimilarQuestions, saveQuestionToBackupFile } from '../utils/server-db';
import { generateUUID } from '../utils/uuid';

export async function GET(request: Request) {
  try {
    const db = getDB();
    const questions = await db.select().from(schema.questions);

    return Response.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch questions',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDB();

    // Check if we have a single question or an array of questions
    const questionsData: QuestionData[] = Array.isArray(body) ? body : [body];

    // Keep track of added and duplicate questions
    const added: any[] = [];
    const duplicates: any[] = [];
    const errors: any[] = [];

    // Process each question
    for (const data of questionsData) {
      try {
        // Basic validation
        if (!data.question || !data.correct_answer || !data.category || !data.difficulty) {
          errors.push({
            question: data.question || 'Unknown',
            error: 'Missing required fields',
          });
          continue;
        }

        // Check for duplicates
        const similarQuestions = findSimilarQuestions(data.question);

        if (similarQuestions.length > 0) {
          duplicates.push({
            newQuestion: data,
            similarQuestions,
          });
          continue;
        }

        // Prepare incorrect answers
        const incorrectAnswers =
          typeof data.incorrect_answers === 'string'
            ? data.incorrect_answers
            : JSON.stringify(data.incorrect_answers);

        // Add the new question
        const newQuestion = {
          id: generateUUID(),
          question: data.question,
          correctAnswer: data.correct_answer,
          incorrectAnswers,
          category: data.category,
          difficulty: data.difficulty,
          createdAt: new Date(),
        };

        await db.insert(schema.questions).values(newQuestion);
        added.push(newQuestion);

        // Save to backup JSON file for historical tracking
        saveQuestionToBackupFile(data);
      } catch (err) {
        console.error('Error adding question:', err);
        errors.push({
          question: data.question || 'Unknown',
          error: String(err),
        });
      }
    }

    return Response.json({
      success: true,
      added: added.length,
      duplicates: duplicates.length,
      errors: errors.length,
      addedData: added,
      duplicatesData: duplicates,
      errorsData: errors,
    });
  } catch (error) {
    console.error('Error processing questions:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to process questions',
      },
      { status: 500 }
    );
  }
}
