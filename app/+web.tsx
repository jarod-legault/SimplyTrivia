import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import initSqlJs from 'sql.js';

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    // Initialize sql.js and create an in-memory database
    const loadDb = async () => {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      const database: any = new SQL.Database();

      // Create the questions table if it doesn't exist
      database.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          incorrect_answers TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL
        );
      `);

      setDb(database);
    };

    loadDb();
  }, []);

  const handleImport = () => {
    if (!db) {
      alert('Database is not initialized yet.');
      return;
    }

    try {
      const questions: any[] = JSON.parse(jsonInput);
      questions.forEach((q: any) => {
        db.run(
          `INSERT INTO questions (question, correct_answer, incorrect_answers, category, difficulty) VALUES (?, ?, ?, ?, ?);`,
          [
            q.question,
            q.correct_answer,
            JSON.stringify(q.incorrect_answers),
            q.category,
            q.difficulty,
          ]
        );
      });
      alert('Questions imported successfully!');
    } catch {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const handleExport = () => {
    if (!db) {
      alert('Database is not initialized yet.');
      return;
    }

    const binaryArray = db.export();
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Question Database Admin</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Paste questions in JSON format here"
        value={jsonInput}
        onChangeText={setJsonInput}
      />
      <Button title="Import Questions" onPress={handleImport} />
      <Button title="Export Database" onPress={handleExport} />
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
  textInput: {
    height: 200,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top',
  },
});
