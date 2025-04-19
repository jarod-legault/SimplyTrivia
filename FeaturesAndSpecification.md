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

## Mobile Database Synchronization

### Data Organization
- Questions are organized by main category into separate JSON files stored in `data/questions/`
- Categories are listed in `categories.json` in the `data` directory
- The `manifest.json` file in the `data` directory tracks timestamps and metadata
- Only the latest version of each file is maintained (no version history needed)
- All files are bundled with the app (no downloading required)

### File Structure
```
data/
  manifest.json          # Tracks last update times and file metadata
  categories.json       # All categories
  questions/           # Directory containing all question files
    pop-culture.json  # One file per main category
    science.json
    history.json
    etc...
```

### Manifest File Structure
```json
{
  "lastUpdate": "2025-04-19T10:00:00Z",
  "categories": {
    "timestamp": "2025-04-19T10:00:00Z",
    "count": 52
  },
  "questionFiles": {
    "pop-culture.json": {
      "timestamp": "2025-04-19T10:00:00Z",
      "questionCount": 500,
      "mainCategory": "Pop Culture"
    },
    "science.json": {
      "timestamp": "2025-04-19T09:00:00Z",
      "questionCount": 300,
      "mainCategory": "Science & Nature"
    }
    // ... etc
  }
}
```

### Web App JSON Generation
The web app maintains the JSON files automatically:
1. When questions are added, edited, or deleted:
   - Updates the relevant category's JSON file in data/questions/
   - Updates the file's timestamp in manifest.json
2. When categories are modified:
   - Updates categories.json
   - If a category is renamed: Updates the corresponding question file name and all questions within it
   - If a category is deleted: Removes its question file and updates manifest.json
   - If a category is added: Creates a new empty question file and updates manifest.json
3. All JSON files are maintained in sync with the SQLite database
   - Every database operation that modifies questions or categories triggers corresponding JSON updates
   - JSON files are always kept in a consistent state with the database

### Mobile App Database Updates
1. On app start:
   - Check manifest.json timestamps
   - Compare timestamps with local database metadata
   - Process files that have changed since last update

2. For each changed category:
   - Start a database transaction
   - Delete all existing questions for that category
   - Import all questions from the new JSON file
   - Update local timestamp metadata
   - Commit transaction

3. Category changes:
   - When a category is removed:
     - Update local database schema
     - Remove questions from that category
     - Update local timestamp metadata
   - When a category is edited:
     - Update local database schema
     - Update all affected questions
     - Update local timestamp metadata
   - When a category is added:
     - Update local database schema
     - Import any questions for the new category
     - Update local timestamp metadata

### Error Handling
- Failed updates should roll back completely
- Partial updates are not allowed
- Invalid JSON files should be reported
- Database integrity is verified after updates
