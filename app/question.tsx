import { Link, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '~/styles/ThemeProvider';
import { Palette, radii, shadow, spacing, ThemeMode } from '~/styles/theme';

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
  const { palette, mode } = useTheme();
  const styles = useMemo(() => createStyles(palette, mode), [palette, mode]);

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
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
        </View>
      </Container>
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
      <Stack.Screen
        options={{
          title: `${headerTitle} Trivia`,
          headerStyle: { backgroundColor: palette.backgroundAlt },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <Container>
        <ScrollView contentContainerStyle={styles.content}>
          {currentQuestion && !networkError && (
            <>
              <View style={styles.questionContainer}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{currentQuestion.category}</Text>
                </View>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>
              <Answers
                questionDetails={currentQuestion}
                onAnswerSelect={(answer) => setSelectedAnswer(answer)}
                selectedAnswer={selectedAnswer}
              />

              {!!selectedAnswer && (
                <Link replace href={{ pathname: '/question', params: {} }} asChild>
                  <TouchableOpacity style={styles.nextQuestionButton}>
                    <Text style={styles.nextQuestionText}>Next Question</Text>
                  </TouchableOpacity>
                </Link>
              )}
            </>
          )}

          {!!networkError && (
            <>
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>We lost the connection</Text>
                <Text style={styles.errorCopy}>{networkError}</Text>
              </View>
              <Link replace href={{ pathname: '/question', params: {} }} asChild>
                <TouchableOpacity style={styles.nextQuestionButton}>
                  <Text style={styles.nextQuestionText}>Retry Fetching Questions</Text>
                </TouchableOpacity>
              </Link>
            </>
          )}
        </ScrollView>
      </Container>
    </>
  );
}

export default QuestionScreen;

const createStyles = (palette: Palette, mode: ThemeMode) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.backgroundAlt,
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: spacing(5),
      gap: spacing(4),
    },
    questionContainer: {
      width: '100%',
      paddingVertical: spacing(4),
      paddingHorizontal: spacing(3),
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      gap: spacing(2),
      ...shadow.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: palette.surfaceHighlight,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(0.75),
      borderRadius: radii.pill,
      borderWidth: 0,
    },
    categoryText: {
      color: palette.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    questionText: {
      color: palette.textPrimary,
      fontSize: 22,
      lineHeight: 30,
      textAlign: 'left',
    },
    nextQuestionButton: {
      width: '100%',
      paddingVertical: spacing(2.5),
      borderRadius: radii.md,
      backgroundColor: palette.accent,
      alignItems: 'center',
      ...shadow.card,
    },
    nextQuestionText: {
      color: palette.textOnAccent,
      fontSize: 18,
      fontWeight: '700',
    },
    errorCard: {
      width: '100%',
      padding: spacing(3),
      borderRadius: radii.lg,
      backgroundColor: mode === 'dark' ? 'rgba(255, 107, 107, 0.12)' : 'rgba(233, 68, 68, 0.1)',
      gap: spacing(1),
      borderWidth: 1,
      borderColor: palette.error,
    },
    errorTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    errorCopy: {
      color: palette.textSecondary,
      fontSize: 16,
    },
  });
