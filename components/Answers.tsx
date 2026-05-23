import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Answer from './Answer';

import { useWideLayout } from '~/hooks/useWideLayout';
import { OTDBQuestionDetails } from '~/types';
import { spacing } from '~/styles/theme';

interface Props {
  questionDetails: OTDBQuestionDetails;
  onAnswerSelect: (answer: string) => void;
  selectedAnswer: string;
}

function Answers({ questionDetails, onAnswerSelect, selectedAnswer }: Props) {
  const [answers, setAnswers] = useState<string[]>([]);
  const isWideLayout = useWideLayout();
  const styles = useMemo(() => createStyles(isWideLayout), [isWideLayout]);

  useEffect(() => {
    if (!selectedAnswer) {
      const correctAnswerIndex = getRandomIndex(questionDetails.incorrect_answers.length + 1); // Add 1 because we haven't added the correct answer to the array yet.
      const incorrectAnswersCopy = [...questionDetails.incorrect_answers];

      setAnswers([
        ...incorrectAnswersCopy.slice(0, correctAnswerIndex),
        questionDetails.correct_answer,
        ...incorrectAnswersCopy.slice(correctAnswerIndex),
      ]); // Insert the correct answer into the array in a random position.
    }
  }, [questionDetails, selectedAnswer]);

  return (
    <View style={styles.answersContainer}>
      {answers.map((answer) => (
        <View key={answer} style={styles.answerCell}>
          <Answer
            thisAnswer={answer}
            correctAnswer={questionDetails.correct_answer}
            disabled={!!selectedAnswer}
            onPress={(newSelectedAnswer) => {
              onAnswerSelect(newSelectedAnswer);
            }}
            selectedAnswer={selectedAnswer}
          />
        </View>
      ))}
    </View>
  );
}

// Returns a random integer from 0 (inclusive) to `max` (exclusive).
//
function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export default Answers;

const createStyles = (isWideLayout: boolean) =>
  StyleSheet.create({
    answersContainer: {
      width: '100%',
      gap: spacing(2),
      marginTop: spacing(3),
      padding: 0,
      ...(isWideLayout
        ? {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: spacing(2),
          }
        : {}),
    },
    answerCell: {
      width: isWideLayout ? '48%' : '100%',
    },
  });
