import cors from 'cors';
import express, { Request, Response } from 'express';

import * as schema from './models/schema';
import { getDB } from './utils/server-db';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Basic test endpoint
app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Database test endpoint
app.get('/api/db-test', async (_req: Request, res: Response) => {
  try {
    const db = getDB();
    const result = await db.select().from(schema.questions).limit(1);
    res.json({
      success: true,
      message: 'Database connection successful',
      count: result.length,
      firstQuestion: result[0] || null,
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
