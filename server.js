const express = require('express');
const cors = require('cors');
const { getDB, findSimilarQuestions, saveQuestionToBackupFile } = require('./utils/server-db');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const db = getDB();
    const questions = await db.select().from({ questions: 'questions' });
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add question(s)
app.post('/api/questions', async (req, res) => {
  try {
    const questionsData = Array.isArray(req.body) ? req.body : [req.body];
    const db = getDB();

    const added = [];
    const duplicates = [];
    const errors = [];

    for (const data of questionsData) {
      try {
        const similar = findSimilarQuestions(data.question);
        if (similar.length > 0) {
          duplicates.push({ newQuestion: data, similarQuestions: similar });
          continue;
        }

        // Add the question to the database
        const result = await db.insert('questions').values(data);
        added.push(result);

        // Save to backup file
        saveQuestionToBackupFile(data);
      } catch (err) {
        errors.push({ question: data.question, error: err.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete question by ID
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const db = getDB();
    await db.delete('questions').where({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check for duplicates
app.post('/api/questions/check-duplicates', (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question text is required' });
    }

    const similar = findSimilarQuestions(question);
    res.json({
      success: true,
      hasDuplicates: similar.length > 0,
      duplicateCount: similar.length,
      duplicates: similar,
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
