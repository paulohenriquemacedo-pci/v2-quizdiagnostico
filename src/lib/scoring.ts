import { ProfileCode, QuizScores, ProfileResult, QuizResult } from '@/types/quiz.types';
import { profiles } from '@/data/profiles';
import { questions } from '@/data/questions';

export function calculateScores(answers: (number | null)[]): QuizScores {
  const scores: QuizScores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  answers.forEach((answer, index) => {
    if (answer !== null) {
      const question = questions[index];
      scores[question.category] += answer;
    }
  });

  console.log('[Scoring] Calculated scores:', scores);
  return scores;
}

export function getIntensity(score: number): string {
  if (score >= 16) return 'Muito Forte';
  if (score >= 13) return 'Forte';
  if (score >= 9) return 'Moderado';
  if (score >= 6) return 'Leve';
  return 'Ausente';
}

export function getProfileResult(code: ProfileCode, score: number): ProfileResult {
  const profile = profiles[code];
  return {
    code,
    name: profile.name,
    score,
    intensity: getIntensity(score),
    description: profile.description,
    color: profile.color,
    icon: profile.icon
  };
}

export function calculateResult(answers: (number | null)[]): QuizResult {
  const scores = calculateScores(answers);
  
  // Find dominant profile (highest score)
  const sortedProfiles = (Object.entries(scores) as [ProfileCode, number][])
    .sort(([, a], [, b]) => b - a);
  
  const [dominantCode, dominantScore] = sortedProfiles[0];
  const dominant = getProfileResult(dominantCode, dominantScore);
  
  // Find secondary profiles (score >= 15, excluding dominant)
  const secondary = sortedProfiles
    .slice(1)
    .filter(([, score]) => score >= 9)
    .map(([code, score]) => getProfileResult(code, score));

  console.log('[Scoring] Dominant profile:', dominant.name, 'with score', dominant.score);
  console.log('[Scoring] Secondary profiles:', secondary.map(p => `${p.name} (${p.score})`));

  return { scores, dominant, secondary };
}
