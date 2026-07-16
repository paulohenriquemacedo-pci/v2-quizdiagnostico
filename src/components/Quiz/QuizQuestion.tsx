import { useEffect, useRef } from 'react';
import { Question } from '@/types/quiz.types';
import { answerOptions } from '@/data/profiles';
import { trackQuizProgress, trackQuizComplete } from '@/lib/analytics';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  currentAnswer: number | null;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function QuizQuestion({
  question,
  currentIndex,
  totalQuestions,
  progress,
  currentAnswer,
  canGoBack,
  canGoNext,
  isLastQuestion,
  onAnswer,
  onNext,
  onBack
}: QuizQuestionProps) {
  const trackedMilestones = useRef<Set<number>>(new Set());

  // Track progress milestones (25%, 50%, 75%) and completion
  useEffect(() => {
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (progress >= milestone && !trackedMilestones.current.has(milestone)) {
        trackedMilestones.current.add(milestone);
        trackQuizProgress(milestone);
      }
    }

    // Track when reaching last question
    if (isLastQuestion && currentAnswer !== null && !trackedMilestones.current.has(100)) {
      trackedMilestones.current.add(100);
      trackQuizComplete();
    }
  }, [progress, isLastQuestion, currentAnswer]);
  return (
    <div className="min-h-screen bg-quiz-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl shadow-quiz p-6 md:p-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pergunta {currentIndex + 1} de {totalQuestions}
              </span>
              <span className="text-sm font-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Engagement hook at halfway point */}
          {currentIndex === 14 && (
            <div className="mb-6 px-5 py-4 bg-amber-50/90 border border-amber-200 rounded-xl text-sm text-amber-900 font-medium text-center flex items-center justify-center gap-3 shadow-sm border-l-4 border-l-amber-500">
              <span className="text-amber-500 text-lg select-none">⚡</span>
              <span>
                <strong>Metade do caminho percorrida.</strong> Suas respostas já estão revelando um padrão específico...
              </span>
            </div>
          )}

          {/* Question */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-relaxed">
            {question.text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {answerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onAnswer(option.value);
                  // Auto-advance after a brief delay for visual feedback
                  setTimeout(() => {
                    onNext();
                  }, 300);
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  currentAnswer === option.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      currentAnswer === option.value
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {currentAnswer === option.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="font-medium text-sm md:text-base">
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold border-2 transition-all ${
                canGoBack
                  ? 'border-border text-foreground hover:bg-muted'
                  : 'border-muted text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
            >
              ← Voltar
            </button>
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                canGoNext
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02]'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
            >
              {isLastQuestion ? 'Finalizar' : 'Próxima →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
