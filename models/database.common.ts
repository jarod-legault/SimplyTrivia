export interface Category {
  id: string;
  mainCategory: string;
  subcategory: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string;
  mainCategory: string;
  subcategory: string;
  difficulty: string;
  createdAt: Date;
}

export interface Response {
  id: string;
  questionId: string;
  isCorrect: boolean;
  createdAt: Date;
}
