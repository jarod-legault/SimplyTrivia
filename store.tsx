import { create } from 'zustand';

import { Difficulty, OTDBQuestionDetails } from './types';

type State = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  OTDBToken: string;
  setOTDBToken: (OTDBToken: string) => void;
  easyQuestions: OTDBQuestionDetails[];
  setEasyQuestions: (easyQuestions: OTDBQuestionDetails[]) => void;
  mediumQuestions: OTDBQuestionDetails[];
  setMediumQuestions: (mediumQuestions: OTDBQuestionDetails[]) => void;
  hardQuestions: OTDBQuestionDetails[];
  setHardQuestions: (hardQuestions: OTDBQuestionDetails[]) => void;
};

export const useStore = create<State>((set) => ({
  difficulty: 'easy',
  setDifficulty: (difficulty) => set({ difficulty }),
  OTDBToken: '',
  setOTDBToken: (OTDBToken) => set({ OTDBToken }),
  easyQuestions: [],
  setEasyQuestions: (easyQuestions) => set({ easyQuestions }),
  mediumQuestions: [],
  setMediumQuestions: (mediumQuestions) => set({ mediumQuestions }),
  hardQuestions: [],
  setHardQuestions: (hardQuestions) => set({ hardQuestions }),
}));
