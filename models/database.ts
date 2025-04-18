import { Platform } from 'react-native';

// Export common types and constants
export * from './database.common';

// Export platform-specific implementation
export const getCategories = Platform.select({
  web: async () => {
    const response = await fetch('/api/categories');
    return response.json();
  },
  default: async () => {
    const { getCategories } = await import('../utils/mobile-db');
    return getCategories();
  },
});

export const getQuestions = Platform.select({
  web: async (mainCategory?: string, subcategory?: string) => {
    const params = new URLSearchParams();
    if (mainCategory) params.append('mainCategory', mainCategory);
    if (subcategory) params.append('subcategory', subcategory);
    const response = await fetch(`/api/questions?${params}`);
    return response.json();
  },
  default: async (mainCategory?: string, subcategory?: string) => {
    const { getQuestions } = await import('../utils/mobile-db');
    return getQuestions(mainCategory, subcategory);
  },
});

export const saveResponse = Platform.select({
  web: async (questionId: string, isCorrect: boolean) => {
    await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, isCorrect }),
    });
  },
  default: async (questionId: string, isCorrect: boolean) => {
    const { saveResponse } = await import('../utils/mobile-db');
    return saveResponse(questionId, isCorrect);
  },
});
