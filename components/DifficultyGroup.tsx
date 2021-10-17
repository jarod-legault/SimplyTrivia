import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {IOTDBQuestionDetails} from '../screens/Home';

interface IProps {
  difficulty: string;
  questionDetailsArray: IOTDBQuestionDetails[];
  onQuestionPress: (questionDetails: IOTDBQuestionDetails) => void;
}

function DifficultyGroup({
  difficulty,
  questionDetailsArray,
  onQuestionPress,
}: IProps) {
  let borderColor = '#FF570D';
  if (difficulty === 'Easy') {
    borderColor = '#009D40';
  } else if (difficulty === 'Medium') {
    borderColor = '#0e0fe0';
  }

  return (
    <View style={styles.difficultyGroupContainer}>
      <View style={styles.difficultyGroupTitleContainer}>
        <Text style={styles.difficultyGroupTitleText}>
          {difficulty} Questions
        </Text>
      </View>
      {questionDetailsArray.map(questionDetails => (
        <TouchableOpacity
          key={questionDetails.question}
          style={[styles.questionCategoryContainer, {borderColor}]}
          onPress={() => onQuestionPress(questionDetails)}>
          <Text>{questionDetails.category}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default DifficultyGroup;

const styles = StyleSheet.create({
  difficultyGroupContainer: {
    alignItems: 'center',
  },
  difficultyGroupTitleContainer: {
    marginVertical: 10,
  },
  difficultyGroupTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  questionCategoryContainer: {
    width: '90%',
    marginVertical: 5,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 2,
    borderRadius: 10,
  },
});
