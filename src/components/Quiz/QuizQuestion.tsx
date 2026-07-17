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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 animate-fade-in">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-10 relative">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pergunta {currentIndex + 1} de {totalQuestions}
              </span>
              <span className="text-sm font-bold text-violet-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Halfway Milestone Hook (Question 9 of 18 -> index 8) */}
          {currentIndex === 8 && (
            <div className="mb-6 px-5 py-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-sm text-amber-300 font-medium text-center flex items-center justify-center gap-3 shadow-sm">
              <span className="text-amber-400 text-lg select-none">⚡</span>
              <span>
                <strong>Metade do caminho percorrida.</strong> Seu padrão comportamental de travamento já está se revelando.
              </span>
            </div>
          )}

          {/* Question text */}
          <h2 className="text-lg md:text-xl font-bold text-white mb-8 leading-relaxed">
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
                className={`w-full p-4.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  currentAnswer === option.value
                    ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      currentAnswer === option.value
                        ? 'border-violet-500 bg-violet-500'
                        : 'border-slate-600 group-hover:border-slate-500'
                    }`}
                  >
                    {currentAnswer === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-semibold text-sm md:text-base">
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
              className={`flex-1 py-3.5 px-6 rounded-2xl font-bold border-2 transition-all duration-200 ${
                canGoBack
                  ? 'border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
                  : 'border-slate-800/40 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              ← Voltar
            </button>
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-bold transition-all duration-200 ${
                canGoNext
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                  : 'bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed'
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
