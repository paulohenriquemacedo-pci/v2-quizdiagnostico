import { Profile } from '@/types/quiz.types';

export const profiles: Record<string, Profile> = {
  A: {
    code: 'A',
    name: 'Perfeccionista Paralisado',
    description: 'Você passa semanas refinando um parágrafo. Tem dificuldade extrema em considerar trabalhos "terminados". O problema não é buscar qualidade, é paralisia por perfeccionismo.',
    color: '#8b5cf6',
    icon: '✨'
  },
  B: {
    code: 'B',
    name: 'Multitarefa Caótico',
    description: 'Você tem 15 abas abertas, 10 projetos iniciados e poucos finalizados. Aceita tudo, mas progride pouco. O problema não é versatilidade, é dispersão.',
    color: '#ff6b35',
    icon: '🔄'
  },
  C: {
    code: 'C',
    name: 'Procrastinador Criativo',
    description: 'Você acredita que trabalha melhor sob pressão. Deixa tudo para última hora e vive ciclos de adrenalina. O problema não é criatividade, é insustentabilidade.',
    color: '#fbbf24',
    icon: '💡'
  },
  D: {
    code: 'D',
    name: 'Analista Perpétuo',
    description: 'Você pesquisa infinitamente mas nunca escreve. Tem 347 PDFs não lidos e sempre sente que precisa "mais um artigo". O problema não é rigor, é paralisia por análise.',
    color: '#1a3a5c',
    icon: '🔬'
  },
  E: {
    code: 'E',
    name: 'Dependente de Motivação',
    description: 'Sua produtividade varia drasticamente com o humor. Precisa se sentir inspirado para trabalhar. O problema não é paixão, é dependência emocional.',
    color: '#ec4899',
    icon: '🎢'
  },
  F: {
    code: 'F',
    name: 'Sobrecarregado Sistêmico',
    description: 'Você aceita todos os compromissos e vive em urgência constante. Trabalha 60h/semana mas avança pouco no que importa. O problema não é dedicação, é falta de limites.',
    color: '#ef4444',
    icon: '😰'
  }
};

export const answerOptions = [
  { value: 0, label: 'Nunca se aplica a mim' },
  { value: 1, label: 'Raramente se aplica a mim' },
  { value: 2, label: 'Às vezes se aplica a mim' },
  { value: 3, label: 'Frequentemente se aplica a mim' },
  { value: 4, label: 'Sempre se aplica a mim' }
];
