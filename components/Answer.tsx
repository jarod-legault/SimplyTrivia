import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

interface Props {
  correctAnswer: string;
  disabled: boolean;
  onPress: (selectedAnswer: string) => void;
  selectedAnswer: string | null;
  thisAnswer: string;
}

function Answer({thisAnswer, correctAnswer, disabled, onPress, selectedAnswer}: Props) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => onPress(thisAnswer)}
      style={[styles.answerContainer, getAnswerBackgroundColor({
        thisAnswer,
        selectedAnswer,
        correctAnswer,
        }),
      ]}>
      <Text style={styles.answerText}>{thisAnswer}</Text>
    </TouchableOpacity>
  );
}

function getAnswerBackgroundColor({thisAnswer, selectedAnswer, correctAnswer}: {thisAnswer: string, selectedAnswer: string | null, correctAnswer: string}) {
  if (thisAnswer === selectedAnswer && thisAnswer !== correctAnswer) {
    return styles.incorrectSelectedAnswerContainer;
  }
  else if (!!selectedAnswer && thisAnswer === correctAnswer) {
    return styles.correctAnswerContainer;
  }
  else {
    return styles.unselectedAnswerContainer;
  }
}

export default Answer;

const styles = StyleSheet.create({
  answerContainer: {
    width: '47%',
    borderRadius: 20,
    marginVertical: 10,
    padding: 5,
  },
  correctAnswerContainer: {
    backgroundColor: '#009D40',
  },
  incorrectSelectedAnswerContainer: {
    backgroundColor: '#FF570D',
  },
  unselectedAnswerContainer: {
    backgroundColor: 'white',
  },
  answerText: {
    marginVertical: 30,
    textAlign: 'center',
    fontSize: 20,
  },
});
