import fs from 'fs';
import path from 'path';

import * as schema from '../../models/schema';
import { getDB } from '../../utils/server-db';

export async function GET() {
  try {
    const db = getDB();
    const questions = await db.select().from(schema.questions);

    // Write questions to a JSON file
    const exportDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFilename = `questions_export_${timestamp}.json`;
    const exportPath = path.join(exportDir, exportFilename);

    // Save the questions to the file
    fs.writeFileSync(exportPath, JSON.stringify(questions, null, 2), 'utf-8');

    return Response.json({
      success: true,
      count: questions.length,
      exportFile: exportFilename,
      data: questions,
    });
  } catch (error) {
    console.error('Error exporting questions:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to export questions',
      },
      { status: 500 }
    );
  }
}
