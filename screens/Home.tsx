import React, {useEffect, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {RootStackParamList} from './RootStackParams';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import axios from 'axios';
import DifficultyGroup from '../components/DifficultyGroup';
import {Buffer} from 'buffer';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
export interface IOTDBQuestionDetails {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

function HomeScreen({navigation}: Props) {
  const [easyQuestions, setEasyQuestions] = useState<IOTDBQuestionDetails[]>([]);
  const [mediumQuestions, setMediumQuestions] = useState<IOTDBQuestionDetails[]>([]);
  const [hardQuestions, setHardQuestions] = useState<IOTDBQuestionDetails[]>([]);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await axios.get('https://opentdb.com/api.php?amount=10&encode=base64',);
        const allQuestions = convertQuestionsFromBase64ToString(response.data.results);
        console.log(allQuestions);

        setEasyQuestions(allQuestions.filter(question => question.difficulty === 'easy'));
        setMediumQuestions(allQuestions.filter(question => question.difficulty === 'medium'));
        setHardQuestions(allQuestions.filter(question => question.difficulty === 'hard'));
      }
      catch (error) {
        console.error(error);
      }
    }

    fetchQuestions();
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <DifficultyGroup
          difficulty="Easy"
          questionDetailsArray={easyQuestions}
          onQuestionPress={questionDetails => navigation.navigate('Question', {questionDetails})}
        />
        <DifficultyGroup
          difficulty="Medium"
          questionDetailsArray={mediumQuestions}
          onQuestionPress={questionDetails => navigation.navigate('Question', {questionDetails})}
        />
        <DifficultyGroup
          difficulty="Hard"
          questionDetailsArray={hardQuestions}
          onQuestionPress={questionDetails => navigation.navigate('Question', {questionDetails})}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function convertQuestionsFromBase64ToString(base64Questions: IOTDBQuestionDetails[]) {
  return base64Questions.map( base64Question => {
    return {
      category: convertBase64ToString(base64Question.category),
      type: convertBase64ToString(base64Question.type),
      difficulty: convertBase64ToString(base64Question.difficulty),
      question: convertBase64ToString(base64Question.question),
      correct_answer: convertBase64ToString(base64Question.correct_answer),
      incorrect_answers: base64Question.incorrect_answers.map(incorrect_answer => convertBase64ToString(incorrect_answer)),
    };
  } );
}

function convertBase64ToString(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, 'base64').toString();
}

export default HomeScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
});
