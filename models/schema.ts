import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define the questions table
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey().notNull(),
  question: text('question').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  incorrectAnswers: text('incorrect_answers').notNull(), // Stored as JSON string
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Define types based on the schema
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

// Define the QuestionData interface for external data
export interface QuestionData {
  question: string;
  correct_answer: string;
  incorrect_answers: string | string[];
  category: string;
  difficulty: string;
}
