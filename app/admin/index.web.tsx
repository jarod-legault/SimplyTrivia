import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sql-js';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import initSqlJs from 'sql.js';

import * as schema from '../../models/schema';
import { Question, NewQuestion, QuestionData } from '../../models/schema';
import { generateUUID } from '../../utils/uuid';

// Constants for database persistence
const DB_STORAGE_KEY = 'simplytrivia_db';

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [sqlJsDb, setSqlJsDb] = useState<any>(null);
  const [drizzleDb, setDrizzleDb] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dbInitError, setDbInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Initializing database...');
    const loadDb = async () => {
      try {
        // Load SQL.js
        console.log('Loading SQL.js...');
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
        });

        let database;
        // Check if we have a stored database in localStorage
        const storedDb = localStorage.getItem(DB_STORAGE_KEY);

        if (storedDb) {
          try {
            console.log('Found stored database in localStorage, attempting to load...');
            const uInt8Array = new Uint8Array(JSON.parse(storedDb));
            database = new SQL.Database(uInt8Array);
            console.log('Successfully loaded database from localStorage');
          } catch (err) {
            console.error('Failed to load database from localStorage:', err);
            console.log('Creating a new database instead');
            database = new SQL.Database();
          }
        } else {
          console.log('No stored database found, creating a new one');
          database = new SQL.Database();
        }

        console.log('Database initialized.');

        // Create tables if they don't exist
        console.log('Creating tables if needed...');
        database.run(`
          CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY NOT NULL,
            question TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            incorrect_answers TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);

        // Initialize Drizzle with SQL.js
        const db = drizzle(database, { schema });

        setSqlJsDb(database);
        setDrizzleDb(db);

        // Run a direct query to count questions
        const countResult = database.exec('SELECT COUNT(*) as count FROM questions');
        if (countResult && countResult.length > 0 && countResult[0].values.length > 0) {
          console.log(`Database initialized with ${countResult[0].values[0]} questions`);
        } else {
          console.log('Database initialized with 0 questions or count query failed');
        }
      } catch (error: unknown) {
        console.error('Error initializing database:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setDbInitError(`Failed to initialize database: ${errorMessage}`);
      }
    };

    loadDb();
  }, []);

  // Save database to localStorage whenever it changes
  useEffect(() => {
    const saveDatabase = () => {
      if (sqlJsDb) {
        console.log('Saving database to localStorage...');
        try {
          const data = sqlJsDb.export();
          const arr = Array.from(data);
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(arr));
          console.log(`Database saved to localStorage with ${questions.length} questions`);
        } catch (err) {
          console.error('Failed to save database to localStorage:', err);
        }
      }
    };

    // If we have questions and a database, save it
    if (questions.length > 0 && sqlJsDb) {
      saveDatabase();
    }
  }, [questions, sqlJsDb]);

  useEffect(() => {
    if (drizzleDb) {
      console.log('Database is ready, fetching questions...');
      fetchQuestions();
    }
  }, [drizzleDb]);

  const fetchQuestions = async () => {
    if (!drizzleDb) {
      console.error('Database is not initialized yet.');
      alert('Database is not initialized yet.');
      return;
    }

    try {
      console.log('Fetching questions from database...');
      const result = await drizzleDb.select().from(schema.questions);
      console.log(`Found ${result.length} questions in database`);

      // Log some details about the questions if any are found
      if (result.length > 0) {
        console.log('First question:', result[0]);
      }

      setQuestions(result);
    } catch (error: unknown) {
      console.error('Error fetching questions:', error);
      alert('Error fetching questions from database');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!drizzleDb) {
      alert('Database is not initialized yet.');
      return;
    }

    try {
      console.log(`Deleting question with ID: ${id}`);
      await drizzleDb.delete(schema.questions).where(eq(schema.questions.id, id));
      console.log('Question deleted successfully');
      fetchQuestions();
    } catch (error: unknown) {
      console.error('Error deleting question:', error);
      alert('Error deleting question');
    }
  };

  const handleImport = async () => {
    if (!drizzleDb) {
      alert('Database is not initialized yet.');
      return;
    }

    try {
      console.log('Parsing JSON input...');
      const questionsData: QuestionData[] = JSON.parse(jsonInput);
      console.log(`Parsed ${questionsData.length} questions from JSON input`);

      // Process questions in batches for better performance
      const newQuestions: NewQuestion[] = questionsData.map((q: QuestionData) => ({
        id: generateUUID(),
        question: q.question,
        correctAnswer: q.correct_answer,
        incorrectAnswers:
          typeof q.incorrect_answers === 'string'
            ? q.incorrect_answers
            : JSON.stringify(q.incorrect_answers),
        category: q.category,
        difficulty: q.difficulty,
        createdAt: new Date(),
      }));

      // Insert questions using Drizzle
      console.log(`Inserting ${newQuestions.length} questions into database...`);
      await drizzleDb.insert(schema.questions).values(newQuestions);
      console.log('Questions inserted successfully');

      // Save database to localStorage after insert
      if (sqlJsDb) {
        try {
          const data = sqlJsDb.export();
          const arr = Array.from(data);
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(arr));
          console.log('Database saved to localStorage after question import');
        } catch (err) {
          console.error('Failed to save database to localStorage after import:', err);
        }
      }

      alert('Questions imported successfully!');
      fetchQuestions();
    } catch (error: unknown) {
      console.error('Error importing questions:', error);
      alert('Invalid JSON format or import error. Please check your input.');
    }
  };

  const handleExport = () => {
    if (!sqlJsDb) {
      alert('Database is not initialized yet.');
      return;
    }

    try {
      console.log('Exporting database...');
      const binaryArray = sqlJsDb.export();
      console.log(`Database exported: ${binaryArray.byteLength} bytes`);

      const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.db';
      a.click();
      URL.revokeObjectURL(url);
      console.log('Database download initiated');
    } catch (error: unknown) {
      console.error('Error exporting database:', error);
      alert('Error exporting database');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Question Database Admin</Text>

      {dbInitError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {dbInitError}</Text>
        </View>
      )}

      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Paste questions in JSON format here"
        value={jsonInput}
        onChangeText={setJsonInput}
      />
      <View style={styles.buttonContainerCentered}>
        <Button title="Import Questions" onPress={handleImport} />
        <View style={styles.buttonSpacing} />
        <Button title="Export Database" onPress={handleExport} />
        <View style={styles.buttonSpacing} />
        <Button title="Refresh Questions" onPress={fetchQuestions} />
      </View>
      <Text style={styles.subtitle}>Questions ({questions.length})</Text>
      {questions.map((question) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <Button title="Delete" onPress={() => deleteQuestion(question.id)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  textInput: {
    height: 200,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainerCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacing: {
    width: 10,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
  },
});
