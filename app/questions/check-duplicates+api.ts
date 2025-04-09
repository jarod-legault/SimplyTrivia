import { findSimilarQuestions } from '../../utils/server-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure we have a question to check
    if (!body.question) {
      return Response.json(
        {
          success: false,
          error: 'Question text is required',
        },
        { status: 400 }
      );
    }

    // Check for similar questions
    const similarQuestions = findSimilarQuestions(body.question);

    return Response.json({
      success: true,
      hasDuplicates: similarQuestions.length > 0,
      duplicateCount: similarQuestions.length,
      duplicates: similarQuestions,
    });
  } catch (error) {
    console.error('Error checking for duplicate questions:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to check for duplicates',
      },
      { status: 500 }
    );
  }
}
