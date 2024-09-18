import axios from 'axios';
import { Stack, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Container } from '~/components/Container';
import DifficultyButton from '~/components/DifficultyButton';

export default function Home() {
  const [OTDBToken, setOTDBToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string>('');

  useEffect(() => {
    let attemptCount = 0;
    async function getOTDBToken() {
      setIsFetchingToken(true);

      try {
        attemptCount++;
        const response = await axios.get('https://opentdb.com/api_token.php', {
          params: {
            command: 'request',
          },
        });
        setOTDBToken(response.data.token);
        setIsFetchingToken(false);
      } catch (error) {
        if (attemptCount < 10) {
          await getOTDBToken();
        } else {
          setNetworkError((error as Error).message);
          setIsFetchingToken(false);
          console.error(error);
        }
      }
    }

    getOTDBToken();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'home', headerShown: false }} />
      <Container>
        <ScrollView contentContainerStyle={styles.difficultyContainer}>
          <View style={styles.headerStyle}>
            <Image style={styles.logo} source={require('../assets/logo.png')} />
            <Text style={styles.headerText}>Simply Trivia</Text>
          </View>

          <View style={styles.body}>
            {isFetchingToken && (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
              </View>
            )}

            {networkError && (
              <Link replace href={{ pathname: '/', params: {} }} asChild>
                <TouchableOpacity style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Network Error - Retry</Text>
                </TouchableOpacity>
              </Link>
            )}

            {OTDBToken && (
              <>
                <Link
                  href={{ pathname: '/question', params: { difficulty: 'easy', OTDBToken } }}
                  asChild>
                  <DifficultyButton difficulty="easy" />
                </Link>
                <Link
                  href={{ pathname: '/question', params: { difficulty: 'medium', OTDBToken } }}
                  asChild>
                  <DifficultyButton difficulty="medium" />
                </Link>
                <Link
                  href={{ pathname: '/question', params: { difficulty: 'hard', OTDBToken } }}
                  asChild>
                  <DifficultyButton difficulty="hard" />
                </Link>
              </>
            )}
          </View>
        </ScrollView>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 100,
  },
  body: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  easyBorder: {
    borderColor: '#009D40',
  },
  mediumBorder: {
    borderColor: '#0e0fe0',
  },
  retryButton: {
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#0e0fe0',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 20,
  },
  hardBorder: {
    borderColor: '#FF570D',
  },
  screenContainer: {
    flex: 1,
  },
});
