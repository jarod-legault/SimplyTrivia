import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';

import { useStore } from '../store';
import type { Difficulty } from '../types';

import { Container } from '~/components/Container';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const setDifficulty = useStore(
    (state: { setDifficulty: (d: Difficulty) => void }) => state.setDifficulty
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && Platform.OS === 'web') {
      router.replace('./admin');
    }
  }, [isMounted]);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setDifficulty(difficulty);
    // Router navigation will be added later
  };

  const handleSettingsPress = () => {
    // Router navigation will be added later
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Simply Trivia', headerShown: false }} />
      <Container>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Simply Trivia</Text>
          </View>

          <View style={styles.buttonsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.easyButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => handleDifficultySelect('easy')}>
              <Text style={styles.buttonText}>Easy</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.mediumButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => handleDifficultySelect('medium')}>
              <Text style={styles.buttonText}>Medium</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.hardButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => handleDifficultySelect('hard')}>
              <Text style={styles.buttonText}>Hard</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.surpriseButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => handleDifficultySelect('easy')}>
              <Text style={styles.buttonText}>Surprise Me!</Text>
            </Pressable>
          </View>

          <View style={styles.settingsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.settingsButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSettingsPress}>
              <Text style={styles.buttonText}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  easyButton: {
    backgroundColor: '#4CAF50', // Green
  },
  mediumButton: {
    backgroundColor: '#2196F3', // Blue
  },
  hardButton: {
    backgroundColor: '#f44336', // Red
  },
  surpriseButton: {
    backgroundColor: '#9C27B0', // Purple
  },
  settingsButton: {
    backgroundColor: '#607D8B', // Blue grey
  },
  settingsContainer: {
    marginTop: 'auto',
  },
});
