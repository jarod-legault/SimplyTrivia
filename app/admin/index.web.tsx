import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Function to fetch questions from the API
  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/questions');
      const result = await response.json();

      if (result.success) {
        setQuestions(result.data || []);
        setStatusMessage(`Loaded ${result.count} questions successfully`);
      } else {
        setError(result.error || 'Failed to fetch questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Network error: Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to import questions from JSON input
  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter some JSON data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse JSON input to validate it first
      try {
        // Just validate the JSON is parseable
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          // We're good, it's either an array or a single object
        }
      } catch (err) {
        setError('Invalid JSON format. Please check your input.');
        setIsLoading(false);
        return;
      }

      // Send to API
      const response = await fetch('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput,
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage(
          `Added ${result.added} questions. Found ${result.duplicates} duplicates. Had ${result.errors} errors.`
        );
        fetchQuestions(); // Refresh the question list

        // If there are duplicates, show them
        if (result.duplicates > 0) {
          console.log('Duplicate questions:', result.duplicatesData);
          alert(
            `Found ${result.duplicates} potential duplicate questions. Check the console for details.`
          );
        }

        // Clear the input after successful import
        setJsonInput('');
      } else {
        setError(result.error || 'Failed to import questions');
      }
    } catch (err) {
      console.error('Error importing questions:', err);
      setError('Network error: Failed to import questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a question
  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/questions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage('Question deleted successfully');
        fetchQuestions(); // Refresh the question list
      } else {
        setError(result.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Network error: Failed to delete question');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export questions to JSON
  const handleExport = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/questions/export');
      const result = await response.json();

      if (result.success) {
        setStatusMessage(`Exported ${result.count} questions successfully`);

        // Create a download link for the data
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `simplytrivia_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Failed to export questions');
      }
    } catch (err) {
      console.error('Error exporting questions:', err);
      setError('Network error: Failed to export questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle importing questions from a JSON file
  const handleJsonFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (!e.target || typeof e.target.result !== 'string') {
        setError('Error reading file');
        return;
      }

      setJsonInput(e.target.result);
      setStatusMessage('JSON file loaded. Click "Import Questions" to add them to the database.');
    };

    reader.readAsText(file);
  };

  // Function to check for duplicate questions
  const checkDuplicate = async (questionText: string) => {
    try {
      const response = await fetch('/questions/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.hasDuplicates) {
          alert(
            `Found ${result.duplicateCount} potential duplicates. Check the console for details.`
          );
          console.log('Duplicate questions:', result.duplicates);
        } else {
          alert('No duplicates found for this question.');
        }
      } else {
        alert('Error checking for duplicates: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
      alert('Network error: Failed to check for duplicates');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simply Trivia: Question Database Admin</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!!statusMessage && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
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
        <Button title="Import Questions" onPress={handleImport} disabled={isLoading} />
        <View style={styles.buttonSpacing} />
        <Button title="Export Questions" onPress={handleExport} disabled={isLoading} />
        <View style={styles.buttonSpacing} />
        <Button
          title="Upload JSON File"
          onPress={() => jsonFileInputRef.current?.click()}
          disabled={isLoading}
        />
      </View>

      {/* Hidden file input for JSON import */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonFileImport}
        style={{ display: 'none' }}
      />

      <Text style={styles.subtitle}>Questions ({questions.length})</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.questionsContainer}>
          {questions.map((question) => (
            <View key={question.id} style={styles.questionContainer}>
              <View style={styles.questionTextContainer}>
                <Text style={styles.questionText}>{question.question}</Text>
                <Text style={styles.questionMeta}>
                  Category: {question.category} | Difficulty: {question.difficulty}
                </Text>
              </View>
              <View style={styles.questionActions}>
                <Button
                  title="Check Duplicates"
                  onPress={() => checkDuplicate(question.question)}
                />
                <View style={styles.buttonSpacing} />
                <Button
                  title="Delete"
                  onPress={() => deleteQuestion(question.id)}
                  color="#ff0000"
                />
              </View>
            </View>
          ))}

          {questions.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>
              No questions found. Import some questions to get started!
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },
  textInput: {
    height: 150,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  buttonContainerCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  buttonSpacing: {
    width: 10,
  },
  questionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginBottom: 20,
    maxHeight: 500,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 4,
  },
  questionMeta: {
    fontSize: 12,
    color: '#666',
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusContainer: {
    backgroundColor: '#eeffee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  statusText: {
    color: 'green',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});
