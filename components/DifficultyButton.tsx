import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {difficultyType} from '../screens/QuestionScreen';

interface Props {
  difficulty: difficultyType;
  onPress: () => void;
}

function DifficultyButton({difficulty, onPress}: Props) {
  return (
    <TouchableOpacity
      style={[styles.questionCategoryContainer, getBorderStyle(difficulty)]}
      onPress={onPress}>
      <Text style={styles.difficultyTextStyle}>{difficulty}</Text>
    </TouchableOpacity>
  );
}

function getBorderStyle(difficulty: difficultyType) {
  if (difficulty === 'easy') {
    return styles.easyBorder;
  }
  else if (difficulty === 'medium') {
    return styles.mediumBorder;
  }
  else {
    return styles.hardBorder;
  }
}

export default DifficultyButton;

const styles = StyleSheet.create({
  easyBorder: {
    borderColor: '#009D40',
  },
  mediumBorder: {
    borderColor: '#0e0fe0',
  },
  hardBorder: {
    borderColor: '#FF570D',
  },
  questionCategoryContainer: {
    width: '90%',
    marginVertical: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 2,
    borderRadius: 10,
  },
  difficultyTextStyle: {
    fontSize: 30,
    textTransform: 'capitalize',
  },
});
