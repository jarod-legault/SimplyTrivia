## Tech Specs
  - Expo Android & iOS mobile app is the main app users will use.
  - Expo Web app for question database management.
  - Expo Router
  - SQLite database:
    - Questions table: Stores all trivia questions, ships with the app
    - Responses table: Tracks user's answered questions and performance
  - Local-only apps. No network required. All questions will be stored locally on the device.
  - Expo web app that runs locally. This is used for me to add questions to the SQLite database.
    - Text input to paste JSON questions.
    - Button to select a JSON file to upload questions.
    - The JSON is validated to make sure the questions match our question schema.
    - The new questions are compared against the existing questions in the database to see if there are any duplicates. If there are, they are presented to the user to either accept or reject.
    - There will be a button that will allow the user to export the database file so it can be saved in the repository to be used in the mobile app.
    - The Expo web app will use `better-sqlite3` to manage the SQLite database.
  - Both the web and mobile app will use drizzle ORM for SQLite so they can share schemas.

## Question Database Management
  - Questions are added through the web admin interface and published with new app releases
  - The SQLite database that ships with the app contains all questions but has an empty responses table
  - When the app updates, the SQLite database is overwritten with the new version (including new questions)
  - User progress is preserved through a backup system:
    - Responses are stored in both SQLite and a JSON backup file
    - JSON filename includes timestamp (responses_YYYYMMDD_HHMMSS.json)
    - On app startup:
      1. Check if responses table is empty
      2. If empty, look for response backup JSON file
      3. If JSON exists, import responses into SQLite
      4. If no JSON found, this is first launch (empty responses)

## Features
  - Trivia app
  - 3 Difficulties: easy, medium, hard
  - Multiple categories & subcategories (see Categories.md)
  - Settings screen where user can select which categories to include or exclude
  - Statistics screen where the user can see what percent of questions they got correct in various categories and difficulties.
  - Home screen allows user to select difficulty: easy, medium, hard, or "surprise me" (random difficulty)
  - Home screen will also have an icon button to take them to the settings screen, and an icon button to take them to the statistics screen.
  - Question screen where the user will see the question, and 6 multiple choice answers. After they select an answer, they will see if it was correct, and have a button to go to the next question.
  - The database may contain more than 5 incorrect answers for a question, but we will select 5 random incorrect answers to mix in with the correct answer.
  - The questions will be randomized based on the categories selected in the settings screen, and the difficulty selected on the home screen.
  - The app will record the questions that the user has answered, so that they will never be asked duplicate questions, and this will be used for the statistics screen.
