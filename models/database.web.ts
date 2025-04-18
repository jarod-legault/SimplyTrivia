import { Category, Question, DEFAULT_CATEGORIES } from './database.common';
import { generateUUID } from '../utils/uuid';

// Check if we're in a browser environment with IndexedDB support
const isIndexedDBAvailable = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.indexedDB !== 'undefined';
  } catch (e) {
    return false;
  }
};

let db: IDBDatabase | null = null;

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open('SimplyTrivia', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create categories store
      const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
      categoriesStore.createIndex('mainCategory', 'mainCategory', { unique: false });
      categoriesStore.createIndex('mainSubCategory', ['mainCategory', 'subcategory'], { unique: true });

      // Create questions store
      const questionsStore = db.createObjectStore('questions', { keyPath: 'id' });
      questionsStore.createIndex('category', ['mainCategory', 'subcategory'], { unique: false });

      // Create responses store
      const responsesStore = db.createObjectStore('responses', { keyPath: 'id' });
      responsesStore.createIndex('questionId', 'questionId', { unique: false });
    };

    request.onsuccess = async () => {
      db = request.result;
      
      // Populate categories if empty
      const categories = await getCategories();
      if (categories.length === 0) {
        await populateCategories();
      }
      
      resolve();
    };
  });
};

const populateCategories = async () => {
  if (!db) return;

  const transaction = db.transaction(['categories'], 'readwrite');
  const store = transaction.objectStore('categories');
  const timestamp = new Date().getTime();

  return new Promise<void>((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    DEFAULT_CATEGORIES.forEach(category => {
      store.add({
        id: generateUUID(),
        mainCategory: category.main,
        subcategory: category.sub,
        createdAt: timestamp
      });
    });
  });
};

export const getCategories = (): Promise<Category[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve([]);
      return;
    }

    const transaction = db.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getQuestions = async (mainCategory?: string, subcategory?: string): Promise<Question[]> => {
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['questions'], 'readonly');
    const store = transaction.objectStore('questions');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let questions = request.result;
      if (mainCategory && subcategory) {
        questions = questions.filter(q => 
          q.mainCategory === mainCategory && q.subcategory === subcategory
        );
      }
      resolve(questions);
    };
  });
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['questions'], 'readonly');
    const store = transaction.objectStore('questions');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const saveResponse = async (questionId: string, isCorrect: boolean): Promise<void> => {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['responses'], 'readwrite');
    const store = transaction.objectStore('responses');
    
    const response = {
      id: generateUUID(),
      questionId,
      isCorrect,
      createdAt: new Date().getTime()
    };

    const request = store.add(response);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
