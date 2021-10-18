import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Answer from './Answer';

interface Props {
  correctAnswer: string;
  incorrectAnswers: string[];
  onAnswerSelect: () => void;
}

function Answers({correctAnswer, incorrectAnswers, onAnswerSelect}: Props) {
  const [answers, setAnswers] = useState<string[] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  if (!answers) {
    const correctAnswerIndex = getRandomIndex(incorrectAnswers.length + 1); // Add 1 because we haven't added the correct answer to the array yet.
    const incorrectAnswersCopy = [...incorrectAnswers];
    incorrectAnswersCopy.splice(correctAnswerIndex, 0, correctAnswer); // Insert the correct answer into the array in a random position.
    setAnswers(incorrectAnswersCopy);
  }

  return (
    <View style={styles.answersContainer}>
      {!!answers && answers.map(answer => (
        <Answer
          key={answer}
          thisAnswer={answer}
          correctAnswer={correctAnswer}
          disabled={!!selectedAnswer}
          onPress={newSelectedAnswer => {
            setSelectedAnswer(newSelectedAnswer);
            onAnswerSelect();
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
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
