# Simply Trivia

Simply Trivia is a multi-difficulty trivia game powered by the [Open Trivia Database](https://opentdb.com/). Players can filter questions by category, and play in light or dark mode across iOS or Android.

### Android Light Mode

![Android Light Mode](./media/Android%20Light%20Mode.gif)

### Android Dark Mode

![Android Dark Mode](./media/Android%20Dark%20Mode.gif)

### iPhone Light Mode

![iPhone Light Mode](./media/iPhone%20Light%20Mode.gif)

### iPhone Dark Mode

![iPhone Dark Mode](./media/iPhone%20Dark%20Mode.gif)

## Gameplay

- Choose a difficulty (Easy, Medium, Hard) from the home screen to load a question.
- Each question displays its category, question, and multiple-choice or true/false answers.
- Tap an answer to see instant feedback: correct choices highlight green, incorrect ones red, and the correct answer is always revealed.
- Tap **Next Question** to advance while the question cache refreshes in the background.
- Filters persist between sessions so you can tailor categories to your interests.

## Key Features

- **Expo SDK 53** with automatic light/dark theming.
- **Category Filters:** Full category list fetched from OpenTDB; selections are stored locally and can be adjusted at any time.
- **Local Question Cache:** Each difficulty maintains a stored queue via `expo-sqlite/kv-store` for instant reloads.
- **Token-based Fetching:** Uses the OpenTDB session token to reduce duplicate questions during a session.
- **Optimized Question Manager:** Downloads only when the cache drops below a threshold, respects rate limits, and filters new questions immediately.
