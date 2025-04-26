import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';

import { categories as categoriesSchema } from '../models/schema';
import { useStore } from '../store';
import { useDatabase } from '../utils/mobile-db';

import { Container } from '~/components/Container';

interface Category {
  id: string;
  mainCategory: string;
  subcategory: string;
}

interface GroupedCategories {
  [key: string]: Category[];
}

export default function SettingsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategories>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { categoryPreferences, toggleCategory } = useStore();
  const database = useDatabase();

  // Fetch categories only once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from database...');
        const allCategories = await database.select().from(categoriesSchema);
        console.log('Categories fetched:', allCategories);
        setCategories(allCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Group categories by main category
  useEffect(() => {
    const grouped = categories.reduce((acc: GroupedCategories, curr) => {
      if (!acc[curr.mainCategory]) {
        acc[curr.mainCategory] = [];
      }
      acc[curr.mainCategory].push(curr);
      return acc;
    }, {});

    // Sort subcategories within each main category
    Object.keys(grouped).forEach((mainCategory) => {
      grouped[mainCategory].sort((a, b) => a.subcategory.localeCompare(b.subcategory));
    });

    setGroupedCategories(grouped);
  }, [categories]);

  const isCategoryEnabled = (mainCategory: string, subcategory: string) => {
    const pref = categoryPreferences.find(
      (p) => p.mainCategory === mainCategory && p.subcategory === subcategory
    );
    return pref ? pref.enabled : false;
  };

  if (isLoading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </Container>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Container>
        <View style={styles.container}>
          <Text style={styles.title}>Category Settings</Text>
          <Text style={styles.subtitle}>
            Select which categories to include in your trivia games
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ScrollView style={styles.categoriesContainer}>
              {Object.entries(groupedCategories)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mainCategory, subcategories]) => (
                  <View key={mainCategory} style={styles.mainCategoryContainer}>
                    <Text style={styles.mainCategoryHeader}>{mainCategory}</Text>
                    <View style={styles.subcategoriesContainer}>
                      {subcategories.map((category) => (
                        <Pressable
                          key={category.id}
                          style={({ pressed }) => [
                            styles.categoryButton,
                            isCategoryEnabled(category.mainCategory, category.subcategory) &&
                              styles.categoryButtonEnabled,
                            pressed && styles.categoryButtonPressed,
                          ]}
                          onPress={() =>
                            toggleCategory(category.mainCategory, category.subcategory)
                          }>
                          <Text
                            style={[
                              styles.categoryButtonText,
                              isCategoryEnabled(category.mainCategory, category.subcategory) &&
                                styles.categoryButtonTextEnabled,
                            ]}>
                            {category.subcategory}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
            </ScrollView>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  categoriesContainer: {
    flex: 1,
  },
  mainCategoryContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainCategoryHeader: {
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subcategoriesContainer: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonEnabled: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonPressed: {
    opacity: 0.8,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextEnabled: {
    color: '#fff',
    fontWeight: '500',
  },
});
