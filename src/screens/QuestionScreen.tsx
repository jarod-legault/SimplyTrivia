import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RootStackParamList} from './RootStackParams';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import axios from 'axios';
import {Buffer} from 'buffer';
import Answers from '../components/Answers';

export type difficultyType = 'easy' | 'medium' | 'hard';
export interface OTDBQuestionDetails {
  category: string;
  type: string;
  difficulty: difficultyType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

function QuestionScreen({navigation, route}: Props) {
  const [answerIsSelected, setAnswerIsSelected] = useState<boolean>(false);
  const [questionDetails, setQuestionDetails] = useState<OTDBQuestionDetails | null>(null);

  const {difficulty, OTDBToken} = route.params;

  useEffect(() => {
    async function fetchQuestionDetails() {
      try {
        const response = await axios.get('https://opentdb.com/api.php/', {
          params: {
            amount: '1',
            encode: 'base64',
            token: OTDBToken,
            difficulty,
          },
        });
        setQuestionDetails(convertQuestionDetailsFromBase64(response.data.results[0]));
      }
      catch (error) {
        console.error(error);
      }
    }

    fetchQuestionDetails();
  }, [OTDBToken, difficulty]);

  if (!questionDetails) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.questionContainer}>
        <Text style={styles.categoryText}>{questionDetails.category}</Text>
        <Text style={styles.questionText}>{questionDetails.question}</Text>
      </View>
      <Answers correctAnswer={questionDetails.correct_answer} incorrectAnswers={questionDetails.incorrect_answers} onAnswerSelect={() => setAnswerIsSelected(true)} />
      {answerIsSelected && ( // TODO: Disable button after clicking.
        <TouchableOpacity style={styles.nextQuestionButton} onPress={() => navigation.replace('Question', {difficulty, OTDBToken})}>
          <Text style={styles.nextQuestionText}>Next Question</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function convertQuestionDetailsFromBase64(base64QuestionDetails: OTDBQuestionDetails): OTDBQuestionDetails {
  return {
    category: convertBase64ToString(base64QuestionDetails.category),
    type: convertBase64ToString(base64QuestionDetails.type),
    difficulty: convertDifficultyFromBase64(base64QuestionDetails.difficulty),
    question: convertBase64ToString(base64QuestionDetails.question),
    correct_answer: convertBase64ToString(base64QuestionDetails.correct_answer),
    incorrect_answers: base64QuestionDetails.incorrect_answers.map(incorrect_answer => convertBase64ToString(incorrect_answer)),
  };
}

function convertDifficultyFromBase64(base64EncodedDifficulty: string) {
  const difficulty = convertBase64ToString(base64EncodedDifficulty);
  if (difficulty === 'easy' ) {
    return 'easy';
  }
  else if (difficulty === 'medium' ) {
    return 'easy';
  }
  else {
    return 'hard';
  }
}

function convertBase64ToString(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, 'base64').toString();
}

export default QuestionScreen;

const styles = StyleSheet.create({
  categoryText: {
    marginBottom: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextQuestionButton: {
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#0e0fe0',
  },
  nextQuestionText: {
    color: 'white',
    fontSize: 20,
  },
  questionContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  questionText: {
    color: '#0e0fe0',
    fontSize: 30,
    textAlign: 'center',
  },
});
