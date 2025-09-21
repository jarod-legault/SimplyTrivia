import { useCallback, useRef } from 'react';
import { useOtdbApi } from './useOtdbApi';

import { useStore } from '~/store';
import { OTDBQuestionDetails } from '~/types';

const MIN_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;

export function useQuestions() {
  const difficulty = useStore((state) => state.difficulty);
  const easyQuestions = useStore((state) => state.easyQuestions);
  const mediumQuestions = useStore((state) => state.mediumQuestions);
  const hardQuestions = useStore((state) => state.hardQuestions);
  const setEasyQuestions = useStore((state) => state.setEasyQuestions);
  const setMediumQuestions = useStore((state) => state.setMediumQuestions);
  const setHardQuestions = useStore((state) => state.setHardQuestions);
  const questionsRef = useRef<OTDBQuestionDetails[]>([]);

  const { getQuestionsFromOtdb } = useOtdbApi();

  const peekQuestion = useCallback((): OTDBQuestionDetails | null => {
    questionsRef.current = getQuestionsFromStore();

    if (questionsRef.current.length > 0) {
      return questionsRef.current[0];
    }

    addQuestions();
    return null;
  }, [difficulty, easyQuestions, mediumQuestions, hardQuestions]);

  const advanceQuestion = useCallback((): OTDBQuestionDetails | null => {
    questionsRef.current = getQuestionsFromStore();

    if (questionsRef.current.length === 0) {
      addQuestions();
      return null;
    }

    const [, ...remainingQuestions] = questionsRef.current;
    const nextQuestion = remainingQuestions[0] ?? null;

    questionsRef.current = remainingQuestions;
    updateQuestionsInStore(remainingQuestions);

    if (remainingQuestions.length <= MIN_QUESTION_COUNT) addQuestions();

    return nextQuestion;
  }, [difficulty, easyQuestions, mediumQuestions, hardQuestions]);

  const addQuestions = async () => {
    const newQuestions = await getQuestionsFromOtdb(MAX_QUESTION_COUNT - MIN_QUESTION_COUNT);
    if (newQuestions !== null && newQuestions.length > 0) {
      const updatedQuestions = [...questionsRef.current, ...newQuestions];
      questionsRef.current = updatedQuestions;
      updateQuestionsInStore(updatedQuestions);
    }
  };

  const getQuestionsFromStore = () => {
    let questions: OTDBQuestionDetails[];

    switch (difficulty) {
      case 'easy':
        questions = [...easyQuestions];
        break;
      case 'medium':
        questions = [...mediumQuestions];
        break;
      default:
        questions = [...hardQuestions];
    }

    return questions;
  };

  const updateQuestionsInStore = (questions: OTDBQuestionDetails[]) => {
    switch (difficulty) {
      case 'easy':
        setEasyQuestions(questions);
        break;
      case 'medium':
        setMediumQuestions(questions);
        break;
      default:
        setHardQuestions(questions);
    }
  };

  return { peekQuestion, advanceQuestion };
}
