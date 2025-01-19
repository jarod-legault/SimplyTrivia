import { Link, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  const networkError = useStore((state) => state.networkError);
  const easyQuestions = useStore((state) => state.easyQuestions);
  const mediumQuestions = useStore((state) => state.mediumQuestions);
  const hardQuestions = useStore((state) => state.hardQuestions);
  const apiTimerIsTiming = useStore((state) => state.apiTimerIsTiming);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<OTDBQuestionDetails | null>(null);
  const getNextQuestion = useQuestions();
  const previousApiTimerIsTiming = useRef(false);

  useEffect(() => {
    if (!currentQuestion) setCurrentQuestion(getNextQuestion());
  }, [easyQuestions, mediumQuestions, hardQuestions]);

  useEffect(() => {
    if (!currentQuestion && previousApiTimerIsTiming.current && !apiTimerIsTiming) {
      setCurrentQuestion(getNextQuestion());
    }

    previousApiTimerIsTiming.current = apiTimerIsTiming;
  }, [apiTimerIsTiming]);

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

          {!!networkError && (
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
