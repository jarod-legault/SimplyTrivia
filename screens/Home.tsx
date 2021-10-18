import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {RootStackParamList} from './RootStackParams';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DifficultyButton from '../components/DifficultyButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.difficultyContainer}>
        <DifficultyButton
          difficulty="easy"
          onPress={() => navigation.navigate('Question', {difficulty: 'easy'})} />
        <DifficultyButton
          difficulty="medium"
          onPress={() => navigation.navigate('Question', {difficulty: 'medium'})} />
        <DifficultyButton
          difficulty="hard"
          onPress={() => navigation.navigate('Question', {difficulty: 'hard'})} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  difficultyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  easyBorder: {
    borderColor: '#009D40',
  },
  mediumBorder: {
    borderColor: '#0e0fe0',
  },
  hardBorder: {
    borderColor: '#FF570D',
  },
  screenContainer: {
    flex: 1,
  },
});
