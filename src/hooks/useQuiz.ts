import { useState, useEffect, useCallback } from 'react';
import { QuizState, QuizResult } from '@/types/quiz.types';
import { questions } from '@/data/questions';
import { calculateResult } from '@/lib/scoring';
import { submitQuizToDatabase } from '@/lib/api';
import { trackQuizStart } from '@/lib/trackQuizStart';

const STORAGE_KEY = 'quiz_progress';
const UNLOCKED_KEY = 'quiz_unlocked_session';
const TOTAL_QUESTIONS = questions.length;

const initialState: QuizState = {
  currentQuestion: 0,
  answers: Array(TOTAL_QUESTIONS).fill(null),
  email: '',
  name: '',
  phone: '',
  step: 'start',
  result: null,
  researchPhase: ''
};

function loadProgress(): QuizState {
  try {
    if (typeof window === 'undefined') return initialState;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[Quiz] Loaded progress from localStorage');
      return { ...initialState, ...parsed };
    }
  } catch (error) {
    console.error('[Quiz] Error loading progress:', error);
  }
  return initialState;
}

function saveProgress(state: QuizState): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[Quiz] Progress saved to localStorage');
  } catch (error) {
    console.error('[Quiz] Error saving progress:', error);
  }
}

function clearProgress(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(UNLOCKED_KEY);
    console.log('[Quiz] Progress cleared from storage');
  } catch (error) {
    console.error('[Quiz] Error clearing progress:', error);
  }
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>(loadProgress);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(UNLOCKED_KEY) === 'true';
  });

  // Save progress whenever state changes (except for result step when unlocked)
  useEffect(() => {
    if (state.step !== 'result') {
      saveProgress(state);
    }
  }, [state]);

  const startQuiz = useCallback(() => {
    setState(prev => ({ ...prev, step: 'context' }));
    console.log('[Quiz] Start clicked, moving to context question');
    trackQuizStart();
  }, []);

  const answerContext = useCallback((phase: string) => {
    setState(prev => ({ ...prev, step: 'questions', researchPhase: phase, currentQuestion: 0 }));
    console.log('[Quiz] Context question answered:', phase);
  }, []);

  const goBackFromContext = useCallback(() => {
    setState(prev => ({ ...prev, step: 'start' }));
    console.log('[Quiz] Going back to start step');
  }, []);

  const answerQuestion = useCallback((value: number) => {
    setState(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestion] = value;
      console.log(`[Quiz] Question ${prev.currentQuestion + 1} answered with value ${value}`);
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestion < TOTAL_QUESTIONS - 1) {
        console.log(`[Quiz] Moving to question ${prev.currentQuestion + 2}`);
        return { ...prev, currentQuestion: prev.currentQuestion + 1 };
      } else {
        const result = calculateResult(prev.answers);
        console.log('[Quiz] All questions answered, calculating result and transitioning to result');
        return {
          ...prev,
          step: 'result',
          result
        };
      }
    });
  }, []);

  const previousQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestion > 0) {
        console.log(`[Quiz] Going back to question ${prev.currentQuestion}`);
        return { ...prev, currentQuestion: prev.currentQuestion - 1 };
      } else {
        console.log('[Quiz] Going back to context step');
        return { ...prev, step: 'context' };
      }
    });
  }, []);

  const setUserInfo = useCallback((name: string, email: string, phone: string) => {
    setState(prev => ({ ...prev, name, email, phone }));
  }, []);

  const submitUnlock = useCallback(async (params: {
    name: string;
    email: string;
    phone: string;
    privacyConsent: boolean;
    marketingConsent: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = state.result || calculateResult(state.answers);
    console.log('[Quiz] Submitting unlock lead data to Supabase');

    const response = await submitQuizToDatabase({
      name: params.name,
      email: params.email,
      phone: params.phone,
      answers: state.answers,
      result,
      researchPhase: state.researchPhase,
      privacyConsent: params.privacyConsent,
      marketingConsent: params.marketingConsent
    });

    if (response.success) {
      setIsUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(UNLOCKED_KEY, 'true');
      }
      setState(prev => ({
        ...prev,
        name: params.name,
        email: params.email,
        phone: params.phone,
        result
      }));
      // Clear progress after successful unlock
      clearProgress();
    }

    return response;
  }, [state.answers, state.result, state.researchPhase]);

  const resetQuiz = useCallback(() => {
    clearProgress();
    setIsUnlocked(false);
    setState(initialState);
    console.log('[Quiz] Quiz reset');
  }, []);

  const currentAnswer = state.answers[state.currentQuestion];
  const progress = ((state.currentQuestion + 1) / TOTAL_QUESTIONS) * 100;
  const canGoNext = currentAnswer !== null;
  const canGoBack = state.currentQuestion > 0;
  const isLastQuestion = state.currentQuestion === TOTAL_QUESTIONS - 1;

  return {
    state,
    isUnlocked,
    currentQuestion: questions[state.currentQuestion],
    currentAnswer,
    progress,
    totalQuestions: TOTAL_QUESTIONS,
    canGoNext,
    canGoBack,
    isLastQuestion,
    startQuiz,
    answerContext,
    goBackFromContext,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    setUserInfo,
    submitUnlock,
    resetQuiz
  };
}
