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
import { palette, spacing } from '~/styles/theme';

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image style={styles.logo} source={require('../assets/icon.png')} />
            </View>
            <Text style={styles.title}>Simply Trivia</Text>
            <Text style={styles.subtitle}>Pick a challenge level and start a streak of right answers.</Text>
          </View>

          <View style={styles.body}>
            {loading && (
              <View style={styles.loaderRow}>
                <ActivityIndicator size="large" color={palette.accent} />
                <Text style={styles.loaderCopy}>Contacting the trivia vault…</Text>
              </View>
            )}

            {networkError && (
              <Link replace href={{ pathname: '/', params: {} }} asChild>
                <TouchableOpacity style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Network Error — Tap to Retry</Text>
                </TouchableOpacity>
              </Link>
            )}

            {!loading && !networkError && (
              <View style={styles.difficultyList}>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="easy" onPress={() => setDifficulty('easy')} />
                </Link>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="medium" onPress={() => setDifficulty('medium')} />
                </Link>
                <Link href={{ pathname: '/question', params: {} }} asChild>
                  <DifficultyButton difficulty="hard" onPress={() => setDifficulty('hard')} />
                </Link>
              </View>
            )}
          </View>
        </ScrollView>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing(6),
  },
  header: {
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(6),
  },
  logoWrapper: {
    height: 120,
    width: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  logo: {
    height: 70,
    width: 70,
    resizeMode: 'cover',
    borderRadius: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: palette.textSecondary,
    paddingHorizontal: spacing(3),
  },
  body: {
    flex: 1,
    width: '100%',
  },
  loaderRow: {
    alignItems: 'center',
    gap: spacing(2),
  },
  loaderCopy: {
    color: palette.textSecondary,
    fontSize: 16,
  },
  retryButton: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: spacing(3),
    marginTop: spacing(2),
    backgroundColor: palette.error,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyList: {
    gap: spacing(2),
  },
});
