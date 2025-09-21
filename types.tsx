export type Difficulty = 'easy' | 'medium' | 'hard';

export type OTDBQuestionDetails = {
  category: string;
  type: string;
  difficulty: Difficulty;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export type OTDBCategory = {
  id: number;
  name: string;
};
