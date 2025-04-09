## 1.1
  - [x] Delete unused files and clear out screens.
  - [x] Check Android package name.
  - [x] Update app icon and splash screen.
  - [x] Remove unused packages.
  - [x] Determine categories
  - [ ] Come up with a question-manager app (web page?) for adding questions with duplicate detection
    - [ ] Use Expo API routes for the backend
    - [ ] Migrate away from browser-based SQLite:
      - [ ] Create app/api directory for Expo API routes
      - [ ] Set up server-side SQLite with better-sqlite3
      - [ ] Create API routes for question CRUD operations
      - [ ] Remove SQL.js code from models/database.ts
      - [ ] Update admin interface to use API calls
      - [ ] Keep mobile SQLite implementation intact
    - [ ] Store new questions (with duplicates removed) in a separate JSON file for historical & backup purposes.
  - [ ] Fix warnings in web console.
  - [ ] Get 10,000 questions
  - [ ] Figure how to store questions answered by users (sqlite?)
  - [ ] Should we encrypt the questions in the app?
  - [ ] Create home screen (easy, medium, hard, surprise me, settings, statistics)
  - [ ] Create settings screen (select categories)
  - [ ] Create question screen
  - [ ] Create statistics screen where user can see how they have performed in different categories and difficulties.
  - [ ] Test in dark mode and light mode.

## Future updates
  - [ ] Backend for questions, user accounts
  - [ ] Ability for users to report inaccurate questions.
  - [ ] Track questions that are answered and determine how difficult they are based on how often they are answered correctly.
  - [ ] Periodically cull questions that have a >95% correct answer rate.
  - [ ] Time limit for answering questions.
  - [ ] Leaderboards
  - [ ] Head-to-head
  - [ ] Party mode: Friends can compete with each other with multiple rounds. Everyone sees the same questions at the same time with a time limit. Time limit, number of rounds, and categories can be customized.
  - [ ] Friends
  - [ ] Weekly challenges with new sets of questions. Maybe add 10 questions per category on Monday. A user has one week to answer all the new questions, and a leaderboard will be posted.
  - [ ] Picture round
  - [ ] TV app

