- Current method is to ask Copilot Agent in "Ask" mode using Claude 3.7 Sonnet Thinking.

Provide 55 unique "easy" trivia questions in JSON format.
- Each question should have the following properties:
  - question
  - correct_answer
  - incorrect_answers (JSON array of 7 incorrect answers)
  - main_category
  - subcategory
  - difficulty (easy, medium, hard)
- All questions should be in the category of "Geography" and the subcategory of "World Cultures".
- Proof read each question to make sure there are no problems with the question. If there are problems, fix the problems or replace it with a different question.
- Do not provide any questions that have only two possible answers, like true/false questions.
- Ensure that the correct answer does not appear in the question.
- All answers, both correct and incorrect, should not be more than 50 characters.