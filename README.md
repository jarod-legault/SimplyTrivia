# Simply Trivia

## Gameplay

This app is quite simple. When the app first starts, you are taken to the home screen, where you will have a choice of question difficulties: "Easy", "Medium", and "Hard". When you tap on one of those options, you will then be taken to the question screen where you will see a question with the category above it, and possible answers below that you can tap. The answers will either be 4 multiple choice options, or true/false. All questions are taken from the [Open Trivia Database](https://opentdb.com/).

When you select an answer, it will turn green if it is correct, and red if it is incorrect. If it was incorrect, the correct answer will also turn green. Then you have the option of getting another question with the same difficulty by tapping the "Next Question" button, or pressing the back button to go back to the home screen to pick a different difficulty. We use the token available from the Open Trivia Database API to make sure you don't get any repeated questions while you are in the same session of the app.

Each question is retrieved when the Question screen loads/reloads. The reason we do it this way is because of the Open Trivia Database token. This token keeps track of questions that have been retrieved from their database, but not of questions that have been displayed to the user. So if we retrieved 50 questions, but the user only viewed 10, there would be 40 questions that the user would not see until they closed and restarted the app.

## Technologies/Frameworks

The app is written in TypeScript and uses React Navigation 6 to navigate between screens and questions.

## TODO

- Add Redux to keep track of the user's score.
- Add a database to keep track of user preferences, such a categories, and long-term performance (correct answer percentage).
- Handle API errors more robustly.
