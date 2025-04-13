import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { API_BASE_URL } from '../../config';

interface Category {
  id: string;
  mainCategory: string;
  subcategory: string;
}

interface GroupedCategories {
  [key: string]: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategories>({});
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Network error: Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newMainCategory.trim() || !newSubcategory.trim()) {
      setError('Both main category and subcategory are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainCategory: newMainCategory.trim(),
          subcategory: newSubcategory.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage('Category added successfully');
        setNewMainCategory('');
        setNewSubcategory('');
        fetchCategories();
      } else {
        setError(result.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Network error: Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage('Category deleted successfully');
        fetchCategories();
      } else {
        setError(result.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Network error: Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.contentContainer}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!!statusMessage && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      <View style={styles.addCategoryContainer}>
        <Text style={styles.subtitle}>Add New Category</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Main Category"
            value={newMainCategory}
            onChangeText={setNewMainCategory}
          />
          <TextInput
            style={styles.input}
            placeholder="Subcategory"
            value={newSubcategory}
            onChangeText={setNewSubcategory}
          />
          <Pressable
            onPress={handleAddCategory}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              isLoading && styles.buttonDisabled,
              pressed && { opacity: 0.7 },
            ]}>
            <Text style={styles.buttonText}>Add Category</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>Loading...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>Categories</Text>
          <ScrollView style={styles.categoriesContainer}>
            {Object.entries(groupedCategories)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([mainCategory, subcategories]) => (
                <View key={mainCategory} style={styles.mainCategoryContainer}>
                  <Text style={styles.mainCategoryHeader}>{mainCategory}</Text>
                  <View style={styles.subcategoriesContainer}>
                    {subcategories.map((category) => (
                      <View key={category.id} style={styles.categoryContainer}>
                        <Text style={styles.subcategory}>{category.subcategory}</Text>
                        <Pressable
                          onPress={() => handleDeleteCategory(category.id)}
                          style={({ pressed }) => [
                            styles.button,
                            styles.deleteButton,
                            pressed && { opacity: 0.7 },
                          ]}>
                          <Text style={styles.buttonText}>Delete</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

            {Object.keys(groupedCategories).length === 0 && (
              <Text style={styles.emptyText}>
                No categories found. Add some categories to get started!
              </Text>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },
  addCategoryContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  categoriesContainer: {
    maxHeight: 500,
  },
  mainCategoryContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mainCategoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subcategoriesContainer: {
    padding: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryInfo: {
    flex: 1,
  },
  mainCategory: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  subcategory: {
    fontSize: 14,
    flex: 1,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff0000',
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
  },
  statusContainer: {
    backgroundColor: '#eeffee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  statusText: {
    color: 'green',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});
