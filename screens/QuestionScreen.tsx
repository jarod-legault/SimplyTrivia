import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from './RootStackParams';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

function QuestionScreen({route}: Props) {
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const {questionDetails} = route.params;

  useEffect(() => {
    const allAnswersNew = [...questionDetails.incorrect_answers];
    const correctAnswerIndex = getRandomInt(allAnswersNew.length + 1); // Add 1 because we haven't added the correct answer to the array yet.

    allAnswersNew.splice(correctAnswerIndex, 0, questionDetails.correct_answer); // Insert the correct answer into the array in a random position.

    setAllAnswers(allAnswersNew);
  }, [questionDetails.correct_answer, questionDetails.incorrect_answers]);

  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {questionDetails.question}
        </Text>
      </View>

      <View style={styles.answersContainer}>
        {allAnswers.map(answer => (
          <TouchableOpacity
            key={answer}
            onPress={() => setSelectedAnswer(answer)}
            style={[
              styles.answerContainer,
              {
                backgroundColor: getAnswerBackgroundColor(
                  answer,
                  selectedAnswer,
                  questionDetails.correct_answer,
                ),
              },
            ]}>
            <Text style={styles.answerText}>{answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getAnswerBackgroundColor(thisAnswer: string, selectedAnswer: string, correctAnswer: string) {
  if (thisAnswer === selectedAnswer && thisAnswer === correctAnswer) { // Selected and correct.
    return '#009D40';
  }

  if (thisAnswer === selectedAnswer && thisAnswer !== correctAnswer) { // Selected and incorrect.
    return '#FF570D';
  }

  return 'white'; // Not selected.
}

// Returns a random integer from 0 (inclusive) to `max` (exclusive).
//
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default QuestionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 5,
  },
  questionText: {
    color: '#0e0fe0',
    fontSize: 30,
    marginVertical: 40,
    textAlign: 'center',
  },
  answersContainer: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  answerContainer: {
    width: '47%',
    borderRadius: 20,
    marginVertical: 10,
    padding: 5,
  },
  answerText: {
    marginVertical: 30,
    textAlign: 'center',
  },
});
