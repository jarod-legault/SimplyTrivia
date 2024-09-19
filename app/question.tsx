import axios from 'axios';
import { Buffer } from 'buffer';
import { Stack, Link } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useStore } from '~/store';
import { OTDBQuestionDetails } from '~/types';

const QUESTION_COUNT_TARGET = 20;

function QuestionScreen() {
  const OTDBToken = useStore((state) => state.OTDBToken);
  const difficulty = useStore((state) => state.difficulty);
  const [answerIsSelected, setAnswerIsSelected] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<OTDBQuestionDetails | null>(null);
  const questions = useRef<OTDBQuestionDetails[]>([]);

  const fetchQuestions = useCallback(async () => {
    if (questions.current.length < QUESTION_COUNT_TARGET / 2) {
      try {
        const amount = QUESTION_COUNT_TARGET - questions.current.length;
        const response = await axios.get('https://opentdb.com/api.php/', {
          params: {
            amount,
            encode: 'base64',
            token: OTDBToken,
            difficulty,
          },
        });
        questions.current = [
          ...questions.current,
          ...convertQuestionsFromBase64(response.data.results),
        ];
      } catch (error) {
        setNetworkError((error as Error).message);
        console.error(error);
      }
    }
    setCurrentQuestion(questions.current[0]);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [OTDBToken, difficulty]);

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
                correctAnswer={currentQuestion.correct_answer}
                incorrectAnswers={currentQuestion.incorrect_answers}
                onAnswerSelect={() => setAnswerIsSelected(true)}
              />
            </>
          )}

          <Link replace href={{ pathname: '/question', params: { difficulty, OTDBToken } }} asChild>
            <TouchableOpacity
              disabled={!answerIsSelected && !networkError}
              style={{
                ...styles.nextQuestionButton,
                opacity: !answerIsSelected && !networkError ? 0 : 1,
              }}>
              <Text style={styles.nextQuestionText}>
                {networkError ? 'Network Error - Retry' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </Container>
    </>
  );
}

function convertQuestionsFromBase64(base64Questions: OTDBQuestionDetails[]) {
  return base64Questions.map((base64Question) => convertQuestionDetailsFromBase64(base64Question));
}

function convertQuestionDetailsFromBase64(
  base64QuestionDetails: OTDBQuestionDetails
): OTDBQuestionDetails {
  return {
    category: convertBase64ToString(base64QuestionDetails.category),
    type: convertBase64ToString(base64QuestionDetails.type),
    difficulty: convertDifficultyFromBase64(base64QuestionDetails.difficulty),
    question: convertBase64ToString(base64QuestionDetails.question),
    correct_answer: convertBase64ToString(base64QuestionDetails.correct_answer),
    incorrect_answers: base64QuestionDetails.incorrect_answers.map((incorrect_answer) =>
      convertBase64ToString(incorrect_answer)
    ),
  };
}

function convertDifficultyFromBase64(base64EncodedDifficulty: string) {
  const difficulty = convertBase64ToString(base64EncodedDifficulty);
  if (difficulty === 'easy') {
    return 'easy';
  } else if (difficulty === 'medium') {
    return 'medium';
  } else {
    return 'hard';
  }
}

function convertBase64ToString(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, 'base64').toString();
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
