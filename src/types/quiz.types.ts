export type ProfileCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Question {
  id: number;
  category: ProfileCode;
  text: string;
}

export interface QuizScores {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
}

export interface Profile {
  code: ProfileCode;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface ProfileResult {
  code: ProfileCode;
  name: string;
  score: number;
  intensity: string;
  description: string;
  color: string;
  icon: string;
}

export interface QuizResult {
  scores: QuizScores;
  dominant: ProfileResult;
  secondary: ProfileResult[];
}

export interface QuizState {
  currentQuestion: number;
  answers: (number | null)[];
  email: string;
  name: string;
  phone: string;
  step: 'start' | 'context' | 'questions' | 'email' | 'result';
  result: QuizResult | null;
  researchPhase: string;
}

export interface AnswerOption {
  value: number;
  label: string;
}
