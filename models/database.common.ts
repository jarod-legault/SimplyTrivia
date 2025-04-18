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

export const DEFAULT_CATEGORIES = [
  // Pop Culture
  { main: 'Pop Culture', sub: 'Movies' },
  { main: 'Pop Culture', sub: 'Television' },
  { main: 'Pop Culture', sub: 'Music' },
  { main: 'Pop Culture', sub: 'Broadway musicals' },
  { main: 'Pop Culture', sub: 'Video Games' },
  { main: 'Pop Culture', sub: 'Board Games' },
  { main: 'Pop Culture', sub: 'Comics' },
  { main: 'Pop Culture', sub: 'Books & Literature' },
  { main: 'Pop Culture', sub: 'Celebrities' },

  // Science & Nature
  { main: 'Science & Nature', sub: 'Biology' },
  { main: 'Science & Nature', sub: 'Chemistry' },
  { main: 'Science & Nature', sub: 'Physics' },
  { main: 'Science & Nature', sub: 'Astronomy & Space' },
  { main: 'Science & Nature', sub: 'Earth Science' },
  { main: 'Science & Nature', sub: 'Animals & Wildlife' },
  { main: 'Science & Nature', sub: 'Plants & Botany' },

  // History
  { main: 'History', sub: 'Ancient History' },
  { main: 'History', sub: 'Medieval History' },
  { main: 'History', sub: 'Modern History' },
  { main: 'History', sub: 'Wars & Conflicts' },
  { main: 'History', sub: 'Historical Figures' },
  { main: 'History', sub: 'Inventions & Discoveries' },
  { main: 'History', sub: 'World Leaders' },
  { main: 'History', sub: 'Archaeological Finds' },

  // Geography
  { main: 'Geography', sub: 'Countries & Capitals' },
  { main: 'Geography', sub: 'Landmarks & Monuments' },
  { main: 'Geography', sub: 'Rivers, Lakes & Oceans' },
  { main: 'Geography', sub: 'Mountains & Volcanoes' },
  { main: 'Geography', sub: 'Cities Around the World' },
  { main: 'Geography', sub: 'Maps & Borders' },
  { main: 'Geography', sub: 'World Cultures' },

  // Sports & Games
  { main: 'Sports & Games', sub: 'Olympic Games' },
  { main: 'Sports & Games', sub: 'American/Canadian Football' },
  { main: 'Sports & Games', sub: 'Football/Soccer' },
  { main: 'Sports & Games', sub: 'Baseball' },
  { main: 'Sports & Games', sub: 'Basketball' },
  { main: 'Sports & Games', sub: 'Hockey' },
  { main: 'Sports & Games', sub: 'Cricket' },
  { main: 'Sports & Games', sub: 'Boxing / Martial Arts' },

  // Art & Culture
  { main: 'Art & Culture', sub: 'Painting & Drawing' },
  { main: 'Art & Culture', sub: 'Sculpture' },
  { main: 'Art & Culture', sub: 'Architecture' },
  { main: 'Art & Culture', sub: 'Museums & Galleries' },

  // Food & Drink
  { main: 'Food & Drink', sub: 'Cuisine Around the World' },
  { main: 'Food & Drink', sub: 'Cooking & Ingredients' },
  { main: 'Food & Drink', sub: 'Beverages & Cocktails' },
  { main: 'Food & Drink', sub: 'Wine & Beer' },

  // Technology
  { main: 'Technology', sub: 'Computers & Internet' },
  { main: 'Technology', sub: 'Social Media' },
  { main: 'Technology', sub: 'Famous Inventions' },
  { main: 'Technology', sub: 'Tech Companies' },
  { main: 'Technology', sub: 'Tech History' },

  // Language & Words
  { main: 'Language & Words', sub: 'Idioms & Expressions' },
  { main: 'Language & Words', sub: 'Famous Quotes' },
  { main: 'Language & Words', sub: 'Slang & Colloquialisms' },
  { main: 'Language & Words', sub: 'Grammar & Vocabulary' },

  // Miscellaneous
  { main: 'Miscellaneous', sub: 'Weird Facts' },
  { main: 'Miscellaneous', sub: 'World Records' },
  { main: 'Miscellaneous', sub: 'Holiday Traditions' },
  { main: 'Miscellaneous', sub: 'Advertising & Brands' },
];
