import axios from 'axios';
import { Buffer } from 'buffer';
import { useRef } from 'react';

import { useStore } from '~/store';
import { OTDBQuestionDetails } from '~/types';

const BASE_URL = 'https://opentdb.com';
const QUESTION_URL = `${BASE_URL}/api.php/`;
const TOKEN_URL = `${BASE_URL}/api_token.php/`;
const MAX_RETRIES = 1;
const RETRY_TIMEOUT_IN_MS = 5500;

type GetQuestionsType = (amount: number) => Promise<OTDBQuestionDetails[]>;

export function useOtdbApi() {
  const difficulty = useStore((state) => state.difficulty);
  const OTDBToken = useStore((state) => state.OTDBToken);
  const setOTDBToken = useStore((state) => state.setOTDBToken);
  const retryCountRef = useRef<number>(0);

  const getQuestions: GetQuestionsType = async (amount: number) => {
    try {
      const response = await axios.get(QUESTION_URL, {
        params: {
          amount,
          encode: 'base64',
          token: OTDBToken,
          difficulty,
        },
      });

      retryCountRef.current = 0;

      return convertQuestionsFromBase64(response.data.results);
    } catch (error) {
      if (retryCountRef.current <= MAX_RETRIES) {
        retryCountRef.current++;
        return new Promise((resolve) => {
          setTimeout(async () => resolve(await getQuestions(amount)), RETRY_TIMEOUT_IN_MS); // FIXME: Clear timers in useEffect.
        });
      } else {
        throw error;
      }
    }
  };

  const updateToken = async () => {
    const response = await axios.get(TOKEN_URL, {
      params: {
        command: 'request',
      },
    });
    setOTDBToken(response.data.token);
  };

  return { getQuestions, updateToken };
}

function convertQuestionsFromBase64(base64Questions: OTDBQuestionDetails[]) {
  return base64Questions.map((base64Question) => convertQuestionDetailsFromBase64(base64Question));
}

function convertQuestionDetailsFromBase64(
  base64QuestionDetails: OTDBQuestionDetails
): OTDBQuestionDetails {
  return {
    category: convertBase64ToString(base64QuestionDetails.category),
    type: convertBase64ToString(base64QuestionDetails.type),
    difficulty: convertDifficultyFromBase64(base64QuestionDetails.difficulty),
    question: convertBase64ToString(base64QuestionDetails.question),
    correct_answer: convertBase64ToString(base64QuestionDetails.correct_answer),
    incorrect_answers: base64QuestionDetails.incorrect_answers.map((incorrect_answer) =>
      convertBase64ToString(incorrect_answer)
    ),
  };
}

function convertDifficultyFromBase64(base64EncodedDifficulty: string) {
  const difficulty = convertBase64ToString(base64EncodedDifficulty);
  if (difficulty === 'easy') {
    return 'easy';
  } else if (difficulty === 'medium') {
    return 'medium';
  } else {
    return 'hard';
  }
}

function convertBase64ToString(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, 'base64').toString();
}
