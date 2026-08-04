import { describe, it, expect } from 'vitest';
import { calculateResult, calculateScores, getIntensity } from '@/lib/scoring';

describe('Scoring Algorithm & Profiles Verification', () => {
  it('should correctly calculate scores for all 6 profile categories (A, B, C, D, E, F)', () => {
    // 18 questions total (3 per category: A, B, C, D, E, F)
    // Indices: 0:A, 1:B, 2:C, 3:D, 4:E, 5:F, 6:A, 7:B, 8:C, 9:D, 10:E, 11:F, 12:A, 13:B, 14:C, 15:D, 16:E, 17:F
    const answers = [
      4, 3, 2, 1, 0, 0, // R1: A:4, B:3, C:2, D:1, E:0, F:0
      4, 3, 2, 1, 0, 0, // R2: A:4, B:3, C:2, D:1, E:0, F:0
      4, 3, 2, 1, 0, 0  // R3: A:4, B:3, C:2, D:1, E:0, F:0
    ];

    const scores = calculateScores(answers);
    expect(scores).toEqual({ A: 12, B: 9, C: 6, D: 3, E: 0, F: 0 });
  });

  it('should identify Profile A (Perfeccionista Paralisado) as dominant', () => {
    const answers = [
      4, 0, 0, 0, 0, 0,
      4, 0, 0, 0, 0, 0,
      4, 0, 0, 0, 0, 0
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('A');
    expect(result.dominant.name).toBe('Perfeccionista Paralisado');
    expect(result.dominant.score).toBe(12);
    expect(result.dominant.intensity).toBe('Muito Forte');
  });

  it('should identify Profile B (Multitarefa Caótico) as dominant', () => {
    const answers = [
      0, 4, 0, 0, 0, 0,
      0, 4, 0, 0, 0, 0,
      0, 4, 0, 0, 0, 0
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('B');
    expect(result.dominant.name).toBe('Multitarefa Caótico');
  });

  it('should identify Profile C (Procrastinador Criativo) as dominant', () => {
    const answers = [
      0, 0, 4, 0, 0, 0,
      0, 0, 4, 0, 0, 0,
      0, 0, 4, 0, 0, 0
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('C');
    expect(result.dominant.name).toBe('Procrastinador Criativo');
  });

  it('should identify Profile D (Analista Perpétuo) as dominant', () => {
    const answers = [
      0, 0, 0, 4, 0, 0,
      0, 0, 0, 4, 0, 0,
      0, 0, 0, 4, 0, 0
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('D');
    expect(result.dominant.name).toBe('Analista Perpétuo');
  });

  it('should identify Profile E (Dependente de Motivação) as dominant', () => {
    const answers = [
      0, 0, 0, 0, 4, 0,
      0, 0, 0, 0, 4, 0,
      0, 0, 0, 0, 4, 0
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('E');
    expect(result.dominant.name).toBe('Dependente de Motivação');
  });

  it('should identify Profile F (Sobrecarregado Sistêmico) as dominant', () => {
    const answers = [
      0, 0, 0, 0, 0, 4,
      0, 0, 0, 0, 0, 4,
      0, 0, 0, 0, 0, 4
    ];

    const result = calculateResult(answers);
    expect(result.dominant.code).toBe('F');
    expect(result.dominant.name).toBe('Sobrecarregado Sistêmico');
  });

  it('should correctly assign intensities based on thresholds', () => {
    expect(getIntensity(12)).toBe('Muito Forte');
    expect(getIntensity(9)).toBe('Forte');
    expect(getIntensity(6)).toBe('Moderado');
    expect(getIntensity(4)).toBe('Leve');
    expect(getIntensity(2)).toBe('Ausente');
  });
});
