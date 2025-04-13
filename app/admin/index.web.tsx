import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';

import { API_BASE_URL } from '../../config';

interface DuplicateQuestion {
  question: string;
  id: string;
  mainCategory: string;
  subcategory: string;
  difficulty: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ErrorData {
  question: string;
  error: string;
}

export default function AdminPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [duplicateQuestions, setDuplicateQuestions] = useState<
    {
      newQuestion: any;
      similarQuestions: DuplicateQuestion[];
    }[]
  >([]);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10, // Changed from 20 to 10
    total: 0,
    totalPages: 1,
  });

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [currentPage]);

  // Function to fetch questions from the API
  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/questions?page=${currentPage}&limit=${pagination.limit}`
      );
      const result = await response.json();

      if (result.success) {
        setQuestions(result.data || []);
        setPagination(result.pagination);
        const start = (result.pagination.page - 1) * result.pagination.limit + 1;
        const end = Math.min(start + result.data.length - 1, result.pagination.total);
        setStatusMessage(`Questions ${start}-${end} of ${result.pagination.total}`);
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
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          // We're good, it's either an array or a single object
        }
      } catch {
        setError('Invalid JSON format. Please check your input.');
        setIsLoading(false);
        return;
      }

      // Send to API
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput,
      });

      const result = await response.json();

      if (result.success) {
        // If there are any errors, show them even if some questions were added
        if (result.errors > 0) {
          const errorMessages = result.errorsData
            .map((error: ErrorData) => `Question "${error.question}": ${error.error}`)
            .join('\n');
          setError(`Some questions had errors:\n${errorMessages}`);
        }

        // Show success message for added questions
        if (result.added > 0) {
          setStatusMessage(`Successfully added ${result.added} questions.`);
        }

        // If there are duplicates, show them in the modal
        if (result.duplicates > 0 && result.duplicatesData) {
          setDuplicateQuestions(result.duplicatesData);
          setShowDuplicatesModal(true);
        }

        // Only clear input if everything was successful
        if (result.errors === 0 && result.duplicates === 0) {
          setJsonInput('');
        }

        // Refresh the question list if any questions were added
        if (result.added > 0) {
          fetchQuestions();
        }
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
      const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
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

  // Function to handle duplicate approval
  const handleDuplicateApproval = async (newQuestion: any, approved: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/handle-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          approved,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove this duplicate from the list
        setDuplicateQuestions((prev) =>
          prev.filter((q) => q.newQuestion.question !== newQuestion.question)
        );

        // Close modal if no more duplicates
        if (duplicateQuestions.length <= 1) {
          setShowDuplicatesModal(false);
        }

        // Refresh questions list if approved
        if (approved) {
          fetchQuestions();
        }
      } else {
        setError(result.error || 'Failed to handle duplicate');
      }
    } catch (err) {
      console.error('Error handling duplicate:', err);
      setError('Network error: Failed to handle duplicate');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
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
        <Pressable
          onPress={handleImport}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.button,
            isLoading && styles.buttonDisabled,
            pressed && { opacity: 0.7 },
          ]}
          role="button"
          aria-label="Import questions">
          <Text style={styles.buttonText}>Import Questions</Text>
        </Pressable>
        <View style={styles.buttonSpacing} />
        <Pressable
          onPress={() => jsonFileInputRef.current?.click()}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.button,
            isLoading && styles.buttonDisabled,
            pressed && { opacity: 0.7 },
          ]}
          role="button"
          aria-label="Upload JSON file">
          <Text style={styles.buttonText}>Upload JSON File</Text>
        </Pressable>
      </View>

      {/* Hidden file input for JSON import */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonFileImport}
        style={{ display: 'none' }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>{statusMessage}</Text>
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
                  <Pressable
                    onPress={() => deleteQuestion(question.id)}
                    style={({ pressed }) => [
                      styles.button,
                      styles.deleteButton,
                      pressed && { opacity: 0.7 },
                    ]}
                    role="button"
                    aria-label="Delete question">
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {questions.length === 0 && !isLoading && (
              <Text style={styles.emptyText}>
                No questions found. Import some questions to get started!
              </Text>
            )}

            {questions.length > 0 && (
              <View style={styles.paginationContainer}>
                <Pressable
                  onPress={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={({ pressed }) => [
                    styles.paginationButton,
                    currentPage === 1 && styles.paginationButtonDisabled,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.paginationButtonText}>{'<<'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={({ pressed }) => [
                    styles.paginationButton,
                    currentPage === 1 && styles.paginationButtonDisabled,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.paginationButtonText}>{'<'}</Text>
                </Pressable>
                <Text style={styles.paginationText}>
                  Page {currentPage} of {pagination.totalPages}
                </Text>
                <Pressable
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  style={({ pressed }) => [
                    styles.paginationButton,
                    currentPage === pagination.totalPages && styles.paginationButtonDisabled,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.paginationButtonText}>{'>'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePageChange(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                  style={({ pressed }) => [
                    styles.paginationButton,
                    currentPage === pagination.totalPages && styles.paginationButtonDisabled,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.paginationButtonText}>{'>>'}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Duplicates Modal */}
      <Modal
        visible={showDuplicatesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicatesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review Duplicate Questions</Text>
            <Text style={styles.modalSubtitle}>
              {duplicateQuestions.length} duplicate{duplicateQuestions.length !== 1 ? 's' : ''}{' '}
              found
            </Text>

            <ScrollView style={styles.duplicatesContainer}>
              {duplicateQuestions.map((duplicate, index) => (
                <View key={index} style={styles.duplicateItem}>
                  <View style={styles.questionComparison}>
                    <View style={styles.questionBox}>
                      <Text style={styles.questionLabel}>New Question:</Text>
                      <Text style={styles.questionText}>{duplicate.newQuestion.question}</Text>
                      <Text style={styles.questionMeta}>
                        Category: {duplicate.newQuestion.main_category} | Difficulty:{' '}
                        {duplicate.newQuestion.difficulty}
                      </Text>
                    </View>

                    <View style={styles.questionBox}>
                      <Text style={styles.questionLabel}>Similar Questions:</Text>
                      {duplicate.similarQuestions.map((similar, idx) => (
                        <View key={idx} style={styles.similarQuestion}>
                          <Text style={styles.questionText}>{similar.question}</Text>
                          <Text style={styles.questionMeta}>
                            Category: {similar.mainCategory} | Difficulty: {similar.difficulty}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.duplicateActions}>
                    <Pressable
                      onPress={() => handleDuplicateApproval(duplicate.newQuestion, true)}
                      style={({ pressed }) => [
                        styles.button,
                        styles.approveButton,
                        pressed && { opacity: 0.7 },
                      ]}>
                      <Text style={styles.buttonText}>Add Anyway</Text>
                    </Pressable>
                    <View style={styles.buttonSpacing} />
                    <Pressable
                      onPress={() => handleDuplicateApproval(duplicate.newQuestion, false)}
                      style={({ pressed }) => [
                        styles.button,
                        styles.rejectButton,
                        pressed && { opacity: 0.7 },
                      ]}>
                      <Text style={styles.buttonText}>Skip</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setShowDuplicatesModal(false)}
              style={({ pressed }) => [
                styles.button,
                styles.closeButton,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    verticalAlign: 'top',
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
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff0000',
  },
  deleteButtonText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  duplicatesContainer: {
    maxHeight: 500,
  },
  duplicateItem: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  questionComparison: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  questionBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  similarQuestion: {
    marginBottom: 10,
  },
  duplicateActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  closeButton: {
    marginTop: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  paginationButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 14,
    marginHorizontal: 10,
  },
});
