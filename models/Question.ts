import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

class Question extends Model {
  static table = 'questions';

  // Add definite assignment assertions to tell TypeScript these will be initialized
  question!: string;
  correctAnswer!: string;
  incorrectAnswers!: string; // Stored as JSON string
  category!: string;
  difficulty!: string;
  createdAt!: Date;

  // Helper method to get incorrect answers as an array
  get incorrectAnswersArray(): string[] {
    return JSON.parse(this.incorrectAnswers);
  }
}

// Apply decorators
text('question')(Question.prototype, 'question');
text('correct_answer')(Question.prototype, 'correctAnswer');
text('incorrect_answers')(Question.prototype, 'incorrectAnswers');
text('category')(Question.prototype, 'category');
text('difficulty')(Question.prototype, 'difficulty');
date('created_at')(Question.prototype, 'createdAt');

export default Question;
