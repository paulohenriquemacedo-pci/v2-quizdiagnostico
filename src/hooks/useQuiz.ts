import { useState, useEffect, useCallback } from 'react';
import { QuizState, QuizResult } from '@/types/quiz.types';
import { questions } from '@/data/questions';
import { calculateResult } from '@/lib/scoring';
import { submitQuizToDatabase } from '@/lib/api';
import { trackQuizStart } from '@/lib/trackQuizStart';

const STORAGE_KEY = 'quiz_progress';
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[Quiz] Progress saved to localStorage');
  } catch (error) {
    console.error('[Quiz] Error saving progress:', error);
  }
}

function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Quiz] Progress cleared from localStorage');
  } catch (error) {
    console.error('[Quiz] Error clearing progress:', error);
  }
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>(loadProgress);

  // Save progress whenever state changes (except for result step)
  useEffect(() => {
    if (state.step !== 'result') {
      saveProgress(state);
    }
  }, [state]);

  // Submit to database when result is calculated and step changes to 'result' (Anonymous Completion)
  useEffect(() => {
    if (state.step === 'result' && state.result && !state.email && !state.name) {
      const submitAnonymous = async () => {
        try {
          console.log('[useQuiz] Submitting anonymous result to database');
          
          const response = await submitQuizToDatabase({
            name: 'Anônimo',
            email: 'anonimo@sistemaacademia.com.br',
            phone: '',
            answers: state.answers,
            result: state.result!,
            researchPhase: state.researchPhase
          });
          
          if (!response.success) {
            console.error('[Quiz] Failed to save anonymous to database:', response.error);
          } else {
            console.log('[Quiz] Anonymous quiz saved to database successfully');
          }
        } catch (e) {
          console.error('[Quiz] Error in anonymous submission:', e);
        }
      };
      
      submitAnonymous();
      clearProgress();
    }
  }, [state.step, state.result, state.answers, state.researchPhase]);

  const startQuiz = useCallback(() => {
    setState(prev => ({ ...prev, step: 'context' }));
    console.log('[Quiz] Start clicked, moving to context question');
    // Track quiz start for funnel metrics
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
        console.log('[Quiz] All questions answered, calculating result and transitioning to result directly');
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

  const submitEmail = useCallback(async (submittedName: string, submittedEmail: string, submittedPhone: string) => {
    const result = calculateResult(state.answers);
    console.log('[Quiz] Calculating final result');
    console.log('[Quiz] User info:', { name: submittedName, email: submittedEmail, phone: submittedPhone });
    
    // Submit to database with passed parameters (not state, which may not be updated yet)
    const response = await submitQuizToDatabase({
      name: submittedName,
      email: submittedEmail,
      phone: submittedPhone,
      answers: state.answers,
      result,
      researchPhase: state.researchPhase
    });
    
    if (!response.success) {
      console.error('[Quiz] Failed to save to database:', response.error);
    } else {
      console.log('[Quiz] Quiz saved to database successfully');
    }
    
    // Clear progress after completing
    clearProgress();
    
    // Update state with user info and result
    setState(prev => ({ 
      ...prev, 
      name: submittedName,
      email: submittedEmail,
      phone: submittedPhone,
      step: 'result', 
      result 
    }));
  }, [state.answers, state.researchPhase]);

  const resetQuiz = useCallback(() => {
    clearProgress();
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
    submitEmail,
    resetQuiz
  };
}
