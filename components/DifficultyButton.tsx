import { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Difficulty } from '~/types';

interface Props {
  difficulty: Difficulty;
  onPress?: () => void;
}

const DifficultyButton = forwardRef<TouchableOpacity, Props>(({ difficulty, onPress }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      style={[styles.difficultyButtonContainer, getBorderStyle(difficulty)]}
      onPress={onPress}>
      <Text style={styles.difficultyTextStyle}>{difficulty}</Text>
    </TouchableOpacity>
  );
});

function getBorderStyle(difficulty: Difficulty) {
  if (difficulty === 'easy') {
    return styles.easyBorder;
  } else if (difficulty === 'medium') {
    return styles.mediumBorder;
  } else {
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
  difficultyButtonContainer: {
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
