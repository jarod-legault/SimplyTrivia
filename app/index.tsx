import axios from 'axios';
import { Stack, Link } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Container } from '~/components/Container';
import DifficultyButton from '~/components/DifficultyButton';

export default function Home() {
  const [OTDBToken, setOTDBToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState<boolean>(false);

  async function getOTDBToken() {
    setIsFetchingToken(true);

    try {
      const response = await axios.get('https://opentdb.com/api_token.php', {
        params: {
          command: 'request',
        },
      });
      setOTDBToken(response.data.token);
    } catch (error) {
      console.error(error); // TODO: Handle errors better.
    } finally {
      setIsFetchingToken(false);
    }
  }

  if (!isFetchingToken && !OTDBToken) {
    getOTDBToken();
  }
  return (
    <>
      <Stack.Screen options={{ title: 'home', headerShown: false }} />
      <Container>
        <ScrollView contentContainerStyle={styles.difficultyContainer}>
          <View style={styles.headerStyle}>
            <Image style={styles.logo} source={require('../assets/logo.png')} />
            <Text style={styles.headerText}>Simply Trivia</Text>
          </View>
          <Link href={{ pathname: '/question', params: { difficulty: 'easy', OTDBToken } }} asChild>
            <DifficultyButton difficulty="easy" />
          </Link>
          <Link
            href={{ pathname: '/question', params: { difficulty: 'medium', OTDBToken } }}
            asChild>
            <DifficultyButton difficulty="medium" />
          </Link>
          <Link href={{ pathname: '/question', params: { difficulty: 'hard', OTDBToken } }} asChild>
            <DifficultyButton difficulty="hard" />
          </Link>
        </ScrollView>
      </Container>
    </>
  );
}

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
