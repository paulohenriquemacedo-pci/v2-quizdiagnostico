import { useState } from 'react';

interface QuizContextProps {
  onAnswer: (phase: string) => void;
  onBack: () => void;
  currentAnswer?: string;
}

export function QuizContext({ onAnswer, onBack, currentAnswer = '' }: QuizContextProps) {
  const options = [
    'Revisão bibliográfica / Fase inicial',
    'Coleta de dados / Trabalho de campo',
    'Análise e escrita',
    'Revisão final / Defesa se aproximando'
  ];

  return (
    <div className="min-h-screen bg-quiz-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="bg-card rounded-2xl shadow-quiz p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Pergunta Inicial de Contexto
              </span>
              <span className="text-sm font-bold text-primary">
                0%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/20 rounded-full"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-relaxed">
            Em qual fase você está agora na sua pesquisa?
          </h2>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onAnswer(option);
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  currentAnswer === option
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      currentAnswer === option
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {currentAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="font-medium text-sm md:text-base">
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 border-border text-foreground hover:bg-muted transition-all"
            >
              ← Voltar
            </button>
            <div className="flex-1" /> {/* Spacer */}
          </div>
        </div>
      </div>
    </div>
  );
}
