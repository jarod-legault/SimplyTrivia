import { create } from 'zustand';

import { Difficulty } from './types';

type State = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  OTDBToken: string;
  setOTDBToken: (OTDBToken: string) => void;
};

export const useStore = create<State>((set) => ({
  difficulty: 'easy',
  setDifficulty: (difficulty) => set({ difficulty }),
  OTDBToken: '',
  setOTDBToken: (OTDBToken) => set({ OTDBToken }),
}));
