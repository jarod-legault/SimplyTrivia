import { SQLiteStorage } from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import { Difficulty, OTDBCategory, OTDBQuestionDetails } from './types';

const API_RATE_LIMIT_IN_MS = 5500; // The limit is 5 seconds. We add an extra 500 ms to be sure.
const SETTINGS_DB_NAME = 'settings';
const SELECTED_CATEGORY_IDS_KEY = 'selectedCategoryIds';
const CATEGORIES_KEY = 'categories';

const settingsStorage = new SQLiteStorage(SETTINGS_DB_NAME);

const persistedCategoryIds = parseNumberArray(settingsStorage.getItemSync(SELECTED_CATEGORY_IDS_KEY));
const persistedCategories = parseCategories(settingsStorage.getItemSync(CATEGORIES_KEY));

export type StoreState = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  OTDBToken: string;
  setOTDBToken: (OTDBToken: string) => void;
  easyQuestions: OTDBQuestionDetails[];
  setEasyQuestions: (easyQuestions: OTDBQuestionDetails[]) => void;
  mediumQuestions: OTDBQuestionDetails[];
  setMediumQuestions: (mediumQuestions: OTDBQuestionDetails[]) => void;
  hardQuestions: OTDBQuestionDetails[];
  setHardQuestions: (hardQuestions: OTDBQuestionDetails[]) => void;
  networkError: string;
  setNetworkError: (errorMessage: string) => void;
  isFetching: boolean;
  setIsFetching: (isFetching: boolean) => void;
  apiTimerIsTiming: boolean;
  categories: OTDBCategory[];
  setCategories: (categories: OTDBCategory[]) => void;
  selectedCategoryIds: number[];
  setSelectedCategoryIds: (categoryIds: number[]) => void;
  categoriesInitialized: boolean;
};

export const useStore = create<StoreState>((set) => ({
  difficulty: 'easy',
  setDifficulty: (difficulty) => set({ difficulty }),
  OTDBToken: '',
  setOTDBToken: (OTDBToken) => set({ OTDBToken }),
  easyQuestions: [],
  setEasyQuestions: (easyQuestions) => set({ easyQuestions }),
  mediumQuestions: [],
  setMediumQuestions: (mediumQuestions) => set({ mediumQuestions }),
  hardQuestions: [],
  setHardQuestions: (hardQuestions) => set({ hardQuestions }),
  networkError: '',
  setNetworkError: (networkError) => set({ networkError }),
  isFetching: false,
  setIsFetching: (isFetching) => {
    set({ isFetching });
    if (isFetching) {
      set({ apiTimerIsTiming: true });
      setTimeout(() => set({ apiTimerIsTiming: false }), API_RATE_LIMIT_IN_MS);
    }
  },
  apiTimerIsTiming: false,
  categories: persistedCategories ?? [],
  setCategories: (categories) =>
    set((state) => {
      let nextSelectedIds = state.selectedCategoryIds;
      let categoriesInitialized = state.categoriesInitialized;

      if (!categoriesInitialized) {
        nextSelectedIds = categories.map((category) => category.id);
        settingsStorage.setItemSync(SELECTED_CATEGORY_IDS_KEY, JSON.stringify(nextSelectedIds));
        categoriesInitialized = true;
      }

      const validCategoryIds = new Set(categories.map((category) => category.id));
      nextSelectedIds = nextSelectedIds.filter((id) => validCategoryIds.has(id));
      settingsStorage.setItemSync(SELECTED_CATEGORY_IDS_KEY, JSON.stringify(nextSelectedIds));
      settingsStorage.setItemSync(CATEGORIES_KEY, JSON.stringify(categories));

      return {
        categories,
        categoriesInitialized,
        selectedCategoryIds: nextSelectedIds,
        easyQuestions: filterQuestionsByCategories(state.easyQuestions, categories, nextSelectedIds),
        mediumQuestions: filterQuestionsByCategories(state.mediumQuestions, categories, nextSelectedIds),
        hardQuestions: filterQuestionsByCategories(state.hardQuestions, categories, nextSelectedIds),
      };
    }),
  selectedCategoryIds: persistedCategoryIds ?? [],
  setSelectedCategoryIds: (selectedCategoryIds) =>
    set((state) => {
      settingsStorage.setItemSync(SELECTED_CATEGORY_IDS_KEY, JSON.stringify(selectedCategoryIds));
      return {
        selectedCategoryIds,
        categoriesInitialized: true,
        easyQuestions: filterQuestionsByCategories(state.easyQuestions, state.categories, selectedCategoryIds),
        mediumQuestions: filterQuestionsByCategories(state.mediumQuestions, state.categories, selectedCategoryIds),
        hardQuestions: filterQuestionsByCategories(state.hardQuestions, state.categories, selectedCategoryIds),
      };
    }),
  categoriesInitialized: persistedCategoryIds !== null,
}));

function filterQuestionsByCategories(
  questions: OTDBQuestionDetails[],
  categories: OTDBCategory[],
  selectedCategoryIds: number[]
): OTDBQuestionDetails[] {
  if (selectedCategoryIds.length === 0 || categories.length === 0) {
    return questions;
  }

  const allowedNames = new Set(
    categories.filter((category) => selectedCategoryIds.includes(category.id)).map((category) => category.name)
  );

  return questions.filter((question) => allowedNames.has(question.category));
}

function parseNumberArray(value: string | null): number[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const numeric = parsed
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 0);
    return numeric;
  } catch (error) {
    console.warn('Failed to parse stored category IDs', error);
    return null;
  }
}

function parseCategories(value: string | null): OTDBCategory[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => ({
        id: Number(item.id),
        name: String(item.name ?? ''),
      }))
      .filter((category) => Number.isInteger(category.id) && category.id >= 0 && category.name.length > 0);
  } catch (error) {
    console.warn('Failed to parse stored categories', error);
    return null;
  }
}
