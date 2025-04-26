import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';

import { Container } from '../components/Container';
import { useStore } from '../store';
import type { Difficulty } from '../types';

export default function Home() {
  const router = useRouter();
  const setDifficulty = useStore(
    (state: { setDifficulty: (d: Difficulty) => void }) => state.setDifficulty
  );

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setDifficulty(difficulty);
    // Router navigation will be added later
  };

  const handleSettingsPress = () => {
    router.push('./settings');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Simply Trivia', headerShown: false }} />
      <Container>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require('../assets/Simply Trivia Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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
              style={({ pressed }) => [styles.settingsButton, pressed && styles.buttonPressed]}
              onPress={handleSettingsPress}>
              <Ionicons name="settings" size={24} color="#fff" />
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
  logo: {
    width: '80%',
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
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
    backgroundColor: '#607D8B',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  settingsContainer: {
    position: 'absolute',
    left: 20,
    bottom: 20,
  },
});
