import { useCallback, useMemo } from 'react';

import { useStore, StoreState } from '~/store';
import { Difficulty, OTDBQuestionDetails } from '~/types';

export function useQuestions(difficulty: Difficulty) {
  const questions = useStore(getQuestionsSelector(difficulty));
  const setQuestions = useStore(getSetQuestionsSelector(difficulty));

  const peekQuestion = useCallback((): OTDBQuestionDetails | null => {
    return questions.length > 0 ? questions[0] : null;
  }, [questions]);

  const advanceQuestion = useCallback((): OTDBQuestionDetails | null => {
    if (questions.length === 0) {
      return null;
    }

    const [, ...remainingQuestions] = questions;
    setQuestions(remainingQuestions);
    return remainingQuestions[0] ?? null;
  }, [questions, setQuestions]);

  return useMemo(
    () => ({
      questions,
      peekQuestion,
      advanceQuestion,
    }),
    [advanceQuestion, peekQuestion, questions]
  );
}

const getQuestionsSelector = (difficulty: Difficulty) => (state: StoreState) => {
  switch (difficulty) {
    case 'easy':
      return state.easyQuestions;
    case 'medium':
      return state.mediumQuestions;
    default:
      return state.hardQuestions;
  }
};

const getSetQuestionsSelector = (difficulty: Difficulty) => (state: StoreState) => {
  switch (difficulty) {
    case 'easy':
      return state.setEasyQuestions;
    case 'medium':
      return state.setMediumQuestions;
    default:
      return state.setHardQuestions;
  }
};
