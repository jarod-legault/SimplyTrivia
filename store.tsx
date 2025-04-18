import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { db } from './models/database';
import type { Category } from './models/database.common';
import { Difficulty } from './types';

interface CategoryPreference {
  mainCategory: string;
  subcategory: string;
  enabled: boolean;
}

type State = {
  difficulty: Difficulty;
  categoryPreferences: CategoryPreference[];
  initialized: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setCategoryPreferences: (preferences: CategoryPreference[]) => void;
  toggleCategory: (mainCategory: string, subcategory: string) => void;
  initialize: () => Promise<void>;
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      difficulty: 'easy',
      categoryPreferences: [],
      initialized: false,
      setDifficulty: (difficulty) => set({ difficulty }),
      setCategoryPreferences: (preferences) => set({ categoryPreferences: preferences }),
      toggleCategory: (mainCategory, subcategory) =>
        set((state) => {
          const existing = state.categoryPreferences.find(
            (p) => p.mainCategory === mainCategory && p.subcategory === subcategory
          );
          if (existing) {
            return {
              categoryPreferences: state.categoryPreferences.map((p) =>
                p.mainCategory === mainCategory && p.subcategory === subcategory
                  ? { ...p, enabled: !p.enabled }
                  : p
              ),
            };
          } else {
            return {
              categoryPreferences: [
                ...state.categoryPreferences,
                { mainCategory, subcategory, enabled: true },
              ],
            };
          }
        }),
      initialize: async () => {
        try {
          // Initialize database
          await db.initDatabase();

          // Get all categories and set them as enabled by default
          const categories = await db.getCategories();

          // Only set default preferences if there are none saved
          set((state) => {
            if (state.categoryPreferences.length === 0) {
              return {
                categoryPreferences: categories.map((cat: Category) => ({
                  mainCategory: cat.mainCategory,
                  subcategory: cat.subcategory,
                  enabled: true,
                })),
                initialized: true,
              };
            }
            return { initialized: true };
          });
        } catch (error) {
          console.error('Failed to initialize database:', error);
          throw error;
        }
      },
    }),
    {
      name: 'trivia-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
