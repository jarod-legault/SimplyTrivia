## Tech Specs
  - Mobile App:
    - Built with Expo for Android & iOS
    - Uses SQLite via expo-sqlite for local database
    - Local-only, no network required
    - All questions stored locally on device
    - Uses drizzle ORM for database operations
    - Responses table tracks user progress locally

  - Web App:
    - Separate Expo web app for question database management
    - Communicates with Node/Express API server
    - Never accesses database directly
    - Uses API endpoints for all database operations
    - Provides UI for adding/editing/deleting questions and categories

  - API Server:
    - Node.js/Express server
    - Uses better-sqlite3 for database operations
    - Uses drizzle ORM with shared schema
    - Provides endpoints for:
      - Question management (CRUD operations)
      - Category management
      - Duplicate detection
      - Answer validation
      - Backup management

  - Database Utils Structure:
    - mobile-db.ts:
      - Uses expo-sqlite and drizzle ORM
      - Handles local database initialization from bundled file
      - Provides methods for local question/category queries
      - Manages local response tracking

    - server-db.ts:
      - Uses better-sqlite3 and drizzle ORM
      - Handles server-side database operations
      - Provides methods for duplicate detection
      - Manages category validation
      - Handles question backup functionality

  - Both apps share:
    - Common database schema (models/schema.ts)
    - Common types (models/database.common.ts)
    - Drizzle ORM for consistent database operations

## Question Database Management
  - Questions are added through the web admin interface and published with new app releases
  - The SQLite database that ships with the app contains all questions but has an empty responses table
  - When the app updates, the SQLite database is overwritten with the new version (including new questions)
  - User progress is preserved through a backup system:
    - Responses are stored in both SQLite and a JSON backup file (responses.json)
    - When saving new responses:
      1. Copy existing responses.json to responses.json.bak as safety backup
      2. Read current responses from responses.json
      3. Add new responses to existing response data
      4. Write combined responses (existing + new) to responses.json
      5. If write is successful, delete responses.json.bak
      6. If write fails, restore from responses.json.bak
    - On app startup:
      1. Check if responses table is empty
      2. If empty, look for responses.json file
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
