import { useQuiz } from '@/hooks/useQuiz';
import { QuizStart } from './QuizStart';
import { QuizContext } from './QuizContext';
import { QuizQuestion } from './QuizQuestion';
import { QuizEmail } from './QuizEmail';
import { QuizResult } from './QuizResult';

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
