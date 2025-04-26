import { drizzle } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { openDatabaseSync, useSQLiteContext, importDatabaseFromAssetAsync } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, Pressable, Image } from 'react-native';

import { useStore } from '../store';
import type { Difficulty } from '../types';
import { Container } from '~/components/Container';

// import { openDatabaseSync } from "expo-sqlite";
import { categories, questions } from '~/models/schema';

export default function Home() {
  const expoSql = useSQLiteContext();

  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const setDifficulty = useStore(
    (state: { setDifficulty: (d: Difficulty) => void }) => state.setDifficulty
  );

  useEffect(() => {
    const init = async () => {
      console.log('sqlite version', expoSql.getFirstSync('SELECT sqlite_version()'));
      console.log('Database name:', expoSql.databaseName);
      const tables = expoSql.getAllSync('SELECT name FROM sqlite_master WHERE type="table"');
      console.log('Tables in database:', tables);

      const categoriesCount = expoSql.getFirstSync('SELECT COUNT(*) as count FROM categories');
      const questionsCount = expoSql.getFirstSync('SELECT COUNT(*) as count FROM questions');
      console.log('Categories count:', categoriesCount);
      console.log('Questions count:', questionsCount);

      const allCategories = expoSql.getAllSync('SELECT * FROM categories');
      console.log('All categories:', allCategories);

      const firstQuestion = expoSql.getFirstSync('SELECT * FROM questions LIMIT 1');
      console.log('First question:', firstQuestion);

      const db = drizzle(expoSql);
      // await importDatabaseFromAssetAsync('questions.db', {
      //   assetId: require('../assets/database/questions.db'),
      // });
      // const expo = openDatabaseSync('questions.db');
      // const db = drizzle(expo);
      const allCategoriesDrizzle = await db.select().from(categories);
      console.log('allCategoriesDrizzle: ', allCategoriesDrizzle);
      const firstQuestionDrizzle = await db.select().from(questions).limit(1);
      console.log('First question drizzle:', firstQuestionDrizzle);

      setIsMounted(true);
    };

    init();
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
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
        }
      : {}),
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
