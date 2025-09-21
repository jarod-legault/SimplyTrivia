import axios from 'axios';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Container } from '~/components/Container';
import { useStore } from '~/store';
import { OTDBCategory } from '~/types';
import { useTheme } from '~/styles/ThemeProvider';
import { Palette, radii, spacing } from '~/styles/theme';

const CATEGORIES_URL = 'https://opentdb.com/api_category.php';

export default function SettingsScreen() {
  const persistedCategories = useStore((state) => state.categories);
  const [categories, setCategories] = useState<OTDBCategory[]>(persistedCategories);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const selectedCategoryIds = useStore((state) => state.selectedCategoryIds);
  const setSelectedCategoryIds = useStore((state) => state.setSelectedCategoryIds);
  const setCategoriesInStore = useStore((state) => state.setCategories);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await axios.get(CATEGORIES_URL);
        if (!isMounted) return;
        const fetchedCategories: OTDBCategory[] = [...(response.data.trivia_categories ?? [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCategories(fetchedCategories);
        setCategoriesInStore(fetchedCategories);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [setCategoriesInStore]);

  const toggleCategory = (categoryId: number, nextValue?: boolean) => {
    const isSelected = selectedCategoryIds.includes(categoryId);
    const shouldSelect = typeof nextValue === 'boolean' ? nextValue : !isSelected;

    if (shouldSelect) {
      if (!isSelected) {
        const updated = Array.from(new Set([...selectedCategoryIds, categoryId]));
        setSelectedCategoryIds(updated);
      }
    } else if (isSelected) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
    }
  };

  const selectAll = () => {
    setSelectedCategoryIds(categories.map((category) => category.id));
  };

  const clearAll = () => {
    setSelectedCategoryIds([]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Container>
        <View style={styles.screenContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Question Categories</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
                <Text style={styles.actionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={clearAll}>
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={palette.accent} />
            </View>
          )}

          {!!error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Couldn’t load categories</Text>
              <Text style={styles.errorCopy}>{error}</Text>
            </View>
          )}

          {!loading && !error && (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selectedCategoryIds.includes(item.id);

                return (
                  <TouchableOpacity
                    style={styles.categoryRow}
                    onPress={() => toggleCategory(item.id)}>
                    <View style={styles.categoryTextBlock}>
                      <Text style={styles.categoryName}>{item.name}</Text>
                    </View>
                    <Switch
                      value={isSelected}
                      onValueChange={(value) => toggleCategory(item.id, value)}
                      trackColor={{ false: palette.border, true: palette.accentMuted }}
                      thumbColor={isSelected ? palette.accent : palette.surface}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Container>
    </>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    screenContent: {
      flex: 1,
      paddingVertical: spacing(4),
      gap: spacing(3),
    },
    headerRow: {
      gap: spacing(1),
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing(1),
    },
    actionButton: {
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(1.5),
      borderRadius: radii.sm,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    actionButtonText: {
      color: palette.accent,
      fontWeight: '600',
      fontSize: 14,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorCard: {
      padding: spacing(3),
      borderRadius: radii.md,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.error,
      gap: spacing(1),
    },
    errorTitle: {
      color: palette.textPrimary,
      fontWeight: '700',
      fontSize: 16,
    },
    errorCopy: {
      color: palette.textSecondary,
      fontSize: 15,
      lineHeight: 20,
    },
    listContent: {
      gap: spacing(1),
      paddingBottom: spacing(4),
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(1.5),
      paddingHorizontal: spacing(2),
      backgroundColor: palette.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: palette.border,
    },
    categoryTextBlock: {
      flex: 1,
      paddingRight: spacing(2),
    },
    categoryName: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
