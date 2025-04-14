import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define the categories table to store valid category/subcategory pairs
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().notNull(),
  mainCategory: text('main_category').notNull(),
  subcategory: text('subcategory').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Define the questions table
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey().notNull(),
  question: text('question').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  incorrectAnswers: text('incorrect_answers').notNull(), // Stored as JSON string
  mainCategory: text('main_category').notNull(),
  subcategory: text('subcategory').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Define the responses table to track user question responses
export const responses = sqliteTable('responses', {
  id: text('id').primaryKey().notNull(),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Define types based on the schema
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;

// Define interfaces for external data
export interface CategoryData {
  main_category: string;
  subcategory: string;
}

export interface QuestionData {
  question: string;
  correct_answer: string;
  incorrect_answers: string | string[];
  main_category: string;
  subcategory: string;
  difficulty: string;
}

export interface ResponseData {
  question_id: string;
  is_correct: boolean;
}
