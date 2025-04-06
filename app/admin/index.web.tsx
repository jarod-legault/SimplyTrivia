import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

import {
  getQuestions,
  importQuestions,
  deleteQuestion,
  initializeDatabase,
} from '../../models/database';
import Question from '../../models/Question';

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupDatabase = async () => {
      setIsLoading(true);
      try {
        // Initialize database first
        await initializeDatabase();
        await fetchQuestions();
      } catch (error) {
        console.error('Error setting up database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, []);

  const fetchQuestions = async () => {
    try {
      const questionList = await getQuestions();
      setQuestions(questionList);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleImport = async () => {
    try {
      const questionsData = JSON.parse(jsonInput);
      await importQuestions(questionsData);
      alert('Questions imported successfully!');
      fetchQuestions();
    } catch (error) {
      alert('Error importing questions. Check your JSON format.');
      console.error(error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion(id);
      fetchQuestions();
    } catch (error) {
      alert('Error deleting question.');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading database...</Text>
      </View>
    );
  }

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
      <View style={styles.buttonContainerCentered}>
        <Button title="Import Questions" onPress={handleImport} />
        <View style={styles.buttonSpacing} />
        <Button
          title="Export Database"
          onPress={() => alert('Database is automatically saved in WatermelonDB')}
        />
      </View>
      <Text style={styles.subtitle}>Questions ({questions.length})</Text>
      <ScrollView style={styles.questionsList}>
        {questions.map((question) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question}</Text>
            <Button title="Delete" onPress={() => handleDeleteQuestion(question.id)} />
          </View>
        ))}
      </ScrollView>
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
  buttonContainerCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacing: {
    width: 10,
  },
  questionsList: {
    flex: 1,
    marginTop: 10,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
});
