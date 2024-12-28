import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Answers from '../components/Answers';

import { Container } from '~/components/Container';
import { useQuestions } from '~/hooks/useQuestions';
import { useStore } from '~/store';
import { OTDBQuestionDetails } from '~/types';

function QuestionScreen() {
  const difficulty = useStore((state) => state.difficulty);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<OTDBQuestionDetails | null>(null);
  const getNextQuestion = useQuestions();

  useEffect(() => {
    const init = async () => {
      try {
        setCurrentQuestion(await getNextQuestion());
        setNetworkError('');
      } catch (error) {
        setNetworkError((error as Error).message);
        console.error((error as Error).message);
      }
    };

    init();
  }, []);

  if (!currentQuestion && !networkError) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  let headerTitle = 'Easy';
  if (difficulty === 'medium') {
    headerTitle = 'Medium';
  } else if (difficulty === 'hard') {
    headerTitle = 'Hard';
  }

  return (
    <>
      <Stack.Screen options={{ title: headerTitle }} />
      <Container>
        <ScrollView contentContainerStyle={styles.container}>
          {currentQuestion && !networkError && (
            <>
              <View style={styles.questionContainer}>
                <Text style={styles.categoryText}>{currentQuestion.category}</Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>
              <Answers
                questionDetails={currentQuestion}
                onAnswerSelect={(answer) => setSelectedAnswer(answer)}
                selectedAnswer={selectedAnswer}
              />

              <Link replace href={{ pathname: '/question', params: {} }} asChild>
                <TouchableOpacity
                  style={{
                    ...styles.nextQuestionButton,
                    opacity: !selectedAnswer ? 0 : 1,
                  }}>
                  <Text style={styles.nextQuestionText}>Next Question</Text>
                </TouchableOpacity>
              </Link>
            </>
          )}

          {networkError && (
            <Link replace href={{ pathname: '/question', params: {} }} asChild>
              <TouchableOpacity
                disabled={!selectedAnswer && !networkError}
                style={styles.nextQuestionButton}>
                <Text style={styles.nextQuestionText}>Network Error - Retry</Text>
              </TouchableOpacity>
            </Link>
          )}
        </ScrollView>
      </Container>
    </>
  );
}

export default QuestionScreen;

const styles = StyleSheet.create({
  categoryText: {
    marginBottom: 10,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nextQuestionButton: {
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#0e0fe0',
  },
  nextQuestionText: {
    color: 'white',
    fontSize: 20,
  },
  questionContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  questionText: {
    color: '#0e0fe0',
    fontSize: 30,
    textAlign: 'center',
  },
});
