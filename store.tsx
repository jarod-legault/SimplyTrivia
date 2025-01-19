import { create } from 'zustand';

import { Difficulty, OTDBQuestionDetails } from './types';

const API_RATE_LIMIT_IN_MS = 5500; // The limit is 5 seconds. We add an extra 500 ms to be sure.

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
  networkError: string;
  setNetworkError: (errorMessage: string) => void;
  isFetching: boolean;
  setIsFetching: (isFetching: boolean) => void;
  apiTimerIsTiming: boolean;
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
  networkError: '',
  setNetworkError: (networkError) => set({ networkError }),
  isFetching: false,
  setIsFetching: (isFetching) => {
    set({ isFetching });
    if (isFetching) {
      set({ apiTimerIsTiming: true });
      setTimeout(() => set({ apiTimerIsTiming: false }), API_RATE_LIMIT_IN_MS);
    }
  },
  apiTimerIsTiming: false,
}));
