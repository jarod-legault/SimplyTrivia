import { create } from 'zustand';

import { Difficulty } from './types';

type State = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
};

export const useStore = create<State>((set) => ({
  difficulty: 'easy',
  setDifficulty: (difficulty) => set({ difficulty }),
}));
