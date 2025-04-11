import cors from 'cors';
import express, { Request, Response } from 'express';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
