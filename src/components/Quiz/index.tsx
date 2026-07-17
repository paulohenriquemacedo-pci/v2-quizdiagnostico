import { useQuiz } from '@/hooks/useQuiz';
import { QuizStart } from './QuizStart';
import { QuizContext } from './QuizContext';
import { QuizQuestion } from './QuizQuestion';
import { QuizEmail } from './QuizEmail';
import { QuizResult } from './QuizResult';
import { profiles } from '@/data/profiles';
import { ProfileCode } from '@/types/quiz.types';

export function Quiz() {
  const {
    state,
    currentQuestion,
    currentAnswer,
    progress,
    totalQuestions,
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
  } = useQuiz();

  // Atalho de Depuração / Visualização Rápida dos Resultados
  const queryParams = new URLSearchParams(window.location.search);
  const debugStep = queryParams.get('debug');
  const debugProfile = (queryParams.get('profile') || 'A').toUpperCase();

  if (debugStep === 'result' && ['A', 'B', 'C', 'D', 'E', 'F'].includes(debugProfile)) {
    const profileKey = debugProfile as ProfileCode;
    const profile = profiles[profileKey];
    
    const mockResult = {
      scores: { A: 12, B: 3, C: 2, D: 4, E: 1, F: 0 },
      dominant: {
        code: profileKey,
        name: profile.name,
        score: 11,
        intensity: 'Muito Forte',
        description: profile.description,
        color: profile.color,
        icon: profile.icon
      },
      secondary: [
        {
          code: 'D' as ProfileCode,
          name: profiles['D'].name,
          score: 8,
          intensity: 'Forte',
          description: profiles['D'].description,
          color: profiles['D'].color,
          icon: profiles['D'].icon
        }
      ]
    };

    return (
      <QuizResult
        result={mockResult}
        email="debug@sistemaacademia.com.br"
        name="Pesquisador Teste"
        onReset={() => {
          // Remove debug parameters from URL when resetting to start fresh
          window.history.pushState({}, document.title, window.location.pathname);
          resetQuiz();
        }}
      />
    );
  }

  switch (state.step) {
    case 'start':
      return <QuizStart onStart={startQuiz} />;
    
    case 'context':
      return (
        <QuizContext
          onAnswer={answerContext}
          onBack={goBackFromContext}
          currentAnswer={state.researchPhase}
        />
      );
    
    case 'questions':
      return (
        <QuizQuestion
          question={currentQuestion}
          currentIndex={state.currentQuestion}
          totalQuestions={totalQuestions}
          progress={progress}
          currentAnswer={currentAnswer}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isLastQuestion={isLastQuestion}
          onAnswer={answerQuestion}
          onNext={nextQuestion}
          onBack={previousQuestion}
        />
      );
    
    case 'email':
      return (
        <QuizEmail
          name={state.name}
          email={state.email}
          phone={state.phone}
          onSubmit={submitEmail}
        />
      );
    
    case 'result':
      if (!state.result) return null;
      return (
        <QuizResult
          result={state.result}
          email={state.email}
          name={state.name}
          onReset={resetQuiz}
        />
      );
    
    default:
      return <QuizStart onStart={startQuiz} />;
  }
}
