import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Answer from './Answer';

import { OTDBQuestionDetails } from '~/types';
import { spacing } from '~/styles/theme';

interface Props {
  questionDetails: OTDBQuestionDetails;
  onAnswerSelect: (answer: string) => void;
  selectedAnswer: string;
}

function Answers({ questionDetails, onAnswerSelect, selectedAnswer }: Props) {
  const [answers, setAnswers] = useState<string[]>([]);

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
  }, [selectedAnswer]);

  return (
    <View style={styles.answersContainer}>
      {!!answers &&
        answers.map((answer) => (
          <Answer
            key={answer}
            thisAnswer={answer}
            correctAnswer={questionDetails.correct_answer}
            disabled={!!selectedAnswer}
            onPress={(newSelectedAnswer) => {
              onAnswerSelect(newSelectedAnswer);
            }}
            selectedAnswer={selectedAnswer}
          />
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

const styles = StyleSheet.create({
  answersContainer: {
    width: '100%',
    gap: spacing(2),
    marginTop: spacing(3),
  },
});
