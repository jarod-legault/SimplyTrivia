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
import { useOtdbApi } from '~/hooks/useOtdbApi';
import { useStore } from '~/store';

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [networkError, setNetworkError] = useState<string>('');

  const setDifficulty = useStore((state) => state.setDifficulty);

  const { updateToken } = useOtdbApi();

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        await updateToken();
        setNetworkError('');
      } catch (error) {
        console.error(error); // FIXME: Update network error? Maybe in global state?
        setNetworkError((error as Error).message);
      }

      setLoading(false);
    }

    init();
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
            {loading && (
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

            {!loading && (
              <>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="easy" onPress={() => setDifficulty('easy')} />
                </Link>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="medium" onPress={() => setDifficulty('medium')} />
                </Link>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="hard" onPress={() => setDifficulty('hard')} />
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
