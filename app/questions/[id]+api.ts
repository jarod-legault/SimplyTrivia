import { eq } from 'drizzle-orm';

import * as schema from '../../models/schema';
import { getDB } from '../../utils/server-db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDB();
    const id = params.id;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Question ID is required',
        },
        { status: 400 }
      );
    }

    const question = await db.select().from(schema.questions).where(eq(schema.questions.id, id));

    if (!question || question.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: question[0],
    });
  } catch (error) {
    console.error(`Error fetching question ${params.id}:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch question',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDB();
    const id = params.id;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Question ID is required',
        },
        { status: 400 }
      );
    }

    // Check if question exists
    const existingQuestion = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, id));

    if (!existingQuestion || existingQuestion.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Handle incorrect_answers formatting
    if (data.incorrect_answers && Array.isArray(data.incorrect_answers)) {
      data.incorrectAnswers = JSON.stringify(data.incorrect_answers);
      delete data.incorrect_answers;
    }

    // Format the update data to match schema
    const updateData: any = {};
    if (data.question) updateData.question = data.question;
    if (data.correctAnswer || data.correct_answer) {
      updateData.correctAnswer = data.correctAnswer || data.correct_answer;
    }
    if (data.incorrectAnswers) updateData.incorrectAnswers = data.incorrectAnswers;
    if (data.category) updateData.category = data.category;
    if (data.difficulty) updateData.difficulty = data.difficulty;

    // Update the question
    await db.update(schema.questions).set(updateData).where(eq(schema.questions.id, id));

    // Get the updated question
    const updatedQuestion = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, id));

    return Response.json({
      success: true,
      data: updatedQuestion[0],
    });
  } catch (error) {
    console.error(`Error updating question ${params.id}:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to update question',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDB();
    const id = params.id;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Question ID is required',
        },
        { status: 400 }
      );
    }

    // Check if question exists
    const existingQuestion = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, id));

    if (!existingQuestion || existingQuestion.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Question not found',
        },
        { status: 404 }
      );
    }

    // Delete the question
    await db.delete(schema.questions).where(eq(schema.questions.id, id));

    return Response.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error(`Error deleting question ${params.id}:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to delete question',
      },
      { status: 500 }
    );
  }
}
