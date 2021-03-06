import React, {useState} from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {RootStackParamList} from './RootStackParams';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DifficultyButton from '../components/DifficultyButton';
import axios from 'axios';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({navigation}: Props) {
  const [OTDBToken, setOTDBToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState<boolean>(false);

  async function getOTDBToken() {
    setIsFetchingToken(true);

    try { // TODO: Handle different response codes.
      const response = await axios.get('https://opentdb.com/api_token.php', {
        params: {
          command: 'request',
        },
      });
      setOTDBToken(response.data.token);
    }
    catch (error) {
      console.error(error); // TODO: Handle errors better.
    }
    finally {
      setIsFetchingToken(false);
    }
  }

  if (!isFetchingToken && !OTDBToken) {
    getOTDBToken();
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.difficultyContainer}>
        <View style={styles.headerStyle}>
          <Image style={styles.logo} source={require('../assets/images/logo.png')}/>
          <Text style={styles.headerText}>Simply Trivia</Text>
        </View>
        <DifficultyButton
          difficulty="easy"
          onPress={() => navigation.navigate('Question', {difficulty: 'easy', OTDBToken})} />
        <DifficultyButton
          difficulty="medium"
          onPress={() => navigation.navigate('Question', {difficulty: 'medium', OTDBToken})} />
        <DifficultyButton
          difficulty="hard"
          onPress={() => navigation.navigate('Question', {difficulty: 'hard', OTDBToken})} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  headerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    height: 100,
    width: 100,
    marginRight: 20,
  },
  headerText: {
    fontSize: 40,
    color: '#8927D8',
  },
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
