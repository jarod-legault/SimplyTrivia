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

  const { getQuestions } = useOtdbApi();

  const getNextQuestion = async () => {
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

    if (questions.length === 0) {
      questions = await getQuestions(MIN_QUESTION_COUNT);
    } else if (questions.length <= MIN_QUESTION_COUNT) {
      const newQuestions = await getQuestions(MAX_QUESTION_COUNT - questions.length + 1);
      questions = [...questions, ...newQuestions];
    }

    const nextQuestion = questions.shift()!;
    updateQuestions(questions);

    return nextQuestion;
  };

  const updateQuestions = (questions: OTDBQuestionDetails[]) => {
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

  return getNextQuestion;
}
