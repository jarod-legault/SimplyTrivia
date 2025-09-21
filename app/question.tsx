import { Link, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Answers from '~/components/Answers';
import { Container } from '~/components/Container';
import { useQuestionManager } from '~/hooks/useQuestionManager';
import { useQuestions } from '~/hooks/useQuestions';
import { useStore } from '~/store';
import { useTheme } from '~/styles/ThemeProvider';
import { Palette, radii, shadow, spacing, ThemeMode } from '~/styles/theme';

function QuestionScreen() {
  const difficulty = useStore((state) => state.difficulty);
  const networkError = useStore((state) => state.networkError);
  const selectedCategoryIds = useStore((state) => state.selectedCategoryIds);
  const categoriesInitialized = useStore((state) => state.categoriesInitialized);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const { palette, mode } = useTheme();
  const styles = useMemo(() => createStyles(palette, mode), [palette, mode]);
  const noCategoriesSelected = categoriesInitialized && selectedCategoryIds.length === 0;

  useQuestionManager(difficulty);
  const { questions, advanceQuestion } = useQuestions(difficulty);
  const currentQuestion = questions[0] ?? null;

  const handleNextQuestion = () => {
    const next = advanceQuestion();
    setSelectedAnswer('');
  };

  useEffect(() => {
    setSelectedAnswer('');
  }, [currentQuestion?.question]);

  let headerTitle = 'Easy';
  if (difficulty === 'medium') {
    headerTitle = 'Medium';
  } else if (difficulty === 'hard') {
    headerTitle = 'Hard';
  }

  if (noCategoriesSelected) {
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
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Choose your categories</Text>
              <Text style={styles.emptyStateMessage}>
                Select at least one category in settings to start receiving new questions.
              </Text>
              <Link href={{ pathname: '/settings', params: {} }} asChild>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>Open Settings</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </Container>
      </>
    );
  }

  if (!currentQuestion && !networkError) {
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.accent} />
          </View>
        </Container>
      </>
    );
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
                <TouchableOpacity onPress={handleNextQuestion} style={styles.nextQuestionButton}>
                  <Text style={styles.nextQuestionText}>Next Question</Text>
                </TouchableOpacity>
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
    emptyStateCard: {
      width: '100%',
      padding: spacing(4),
      borderRadius: radii.lg,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: spacing(2),
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    emptyStateMessage: {
      fontSize: 16,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    emptyStateButton: {
      marginTop: spacing(1),
      paddingVertical: spacing(1.5),
      paddingHorizontal: spacing(3),
      borderRadius: radii.md,
      backgroundColor: palette.accent,
    },
    emptyStateButtonText: {
      color: palette.textOnAccent,
      fontWeight: '600',
      fontSize: 16,
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
