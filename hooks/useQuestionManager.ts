import { useCallback, useEffect, useRef } from 'react';

import { RateLimitError, useOtdbApi } from './useOtdbApi';

import { useStore, StoreState } from '~/store';
import { Difficulty, OTDBCategory, OTDBQuestionDetails } from '~/types';

const MIN_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;
const RETRY_DELAY_MS = 5500;

export function useQuestionManager(difficulty: Difficulty) {
  const { getQuestionsFromOtdb } = useOtdbApi();

  const questions = useStore(selectQuestions(difficulty));
  const setQuestions = useStore(selectSetQuestions(difficulty));
  const categories = useStore((state) => state.categories);
  const selectedCategoryIds = useStore((state) => state.selectedCategoryIds);
  const categoriesInitialized = useStore((state) => state.categoriesInitialized);

  const fetchInFlightRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionsRef = useRef<OTDBQuestionDetails[]>(questions);
  const requestQuestionsRef = useRef<() => void>(() => {});

  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) return;
    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      requestQuestionsRef.current();
    }, RETRY_DELAY_MS);
  }, []);

  useEffect(() => {
    const filtered = filterQuestionsByCategories(questions, categories, selectedCategoryIds);
    const needsUpdate =
      filtered.length !== questions.length || filtered.some((question, index) => question !== questions[index]);

    questionsRef.current = filtered;

    if (needsUpdate) {
      setQuestions(filtered);
    }
  }, [categories, questions, selectedCategoryIds, setQuestions]);

  const requestQuestions = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    if (categoriesInitialized && selectedCategoryIds.length === 0) return;

    fetchInFlightRef.current = true;

    try {
      const requestedCategoryId = selectedCategoryIds.length === 1 ? selectedCategoryIds[0] : undefined;
      const newQuestions = await getQuestionsFromOtdb(
        MAX_QUESTION_COUNT - MIN_QUESTION_COUNT,
        requestedCategoryId
      );

      if (!newQuestions || newQuestions.length === 0) {
        fetchInFlightRef.current = false;
        scheduleRetry();
        return;
      }

      const filteredNewQuestions = filterQuestionsByCategories(
        newQuestions,
        categories,
        selectedCategoryIds
      );

      if (filteredNewQuestions.length === 0) {
        fetchInFlightRef.current = false;
        if (selectedCategoryIds.length > 0) {
          scheduleRetry();
        }
        return;
      }

      const mergedQuestions = [...questionsRef.current, ...filteredNewQuestions];
      questionsRef.current = mergedQuestions;
      setQuestions(mergedQuestions);
      fetchInFlightRef.current = false;

      if (mergedQuestions.length <= MIN_QUESTION_COUNT) {
        scheduleRetry();
      }
    } catch (error) {
      fetchInFlightRef.current = false;
      if (error instanceof RateLimitError) {
        scheduleRetry();
      }
    }
  }, [categories, categoriesInitialized, getQuestionsFromOtdb, scheduleRetry, selectedCategoryIds, setQuestions]);

  useEffect(() => {
    requestQuestionsRef.current = () => {
      void requestQuestions();
    };
  }, [requestQuestions]);

  useEffect(() => {
    const filtered = filterQuestionsByCategories(questions, categories, selectedCategoryIds);
    const needsUpdate =
      filtered.length !== questions.length || filtered.some((question, index) => question !== questions[index]);

    questionsRef.current = filtered;

    if (needsUpdate) {
      setQuestions(filtered);
    }
  }, [categories, questions, selectedCategoryIds, setQuestions]);

  useEffect(() => {
    if (categoriesInitialized && selectedCategoryIds.length === 0) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      fetchInFlightRef.current = false;
      return;
    }

    if (!fetchInFlightRef.current && questionsRef.current.length <= MIN_QUESTION_COUNT) {
      void requestQuestions();
    }
  }, [categoriesInitialized, requestQuestions, selectedCategoryIds, questions]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);
}

const selectQuestions = (difficulty: Difficulty) => (state: StoreState) => {
  switch (difficulty) {
    case 'easy':
      return state.easyQuestions;
    case 'medium':
      return state.mediumQuestions;
    default:
      return state.hardQuestions;
  }
};

const selectSetQuestions = (difficulty: Difficulty) => (state: StoreState) => {
  switch (difficulty) {
    case 'easy':
      return state.setEasyQuestions;
    case 'medium':
      return state.setMediumQuestions;
    default:
      return state.setHardQuestions;
  }
};

function filterQuestionsByCategories(
  questions: OTDBQuestionDetails[],
  categories: OTDBCategory[],
  selectedCategoryIds: number[]
): OTDBQuestionDetails[] {
  if (selectedCategoryIds.length === 0 || categories.length === 0) {
    return questions;
  }

  const allowedNames = new Set(
    categories.filter((category) => selectedCategoryIds.includes(category.id)).map((category) => category.name)
  );

  return questions.filter((question) => allowedNames.has(question.category));
}
