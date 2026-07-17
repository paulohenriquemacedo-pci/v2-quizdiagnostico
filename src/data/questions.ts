import { Question } from '@/types/quiz.types';

// Perguntas reduzidas para a V2 (18 no total - 3 por perfil)
// Intercaladas em rodadas de A a F para evitar viés analítico do usuário
export const questions: Question[] = [
  // === RODADA 1 ===
  {
    id: 1,
    category: 'A',
    text: 'Tenho dificuldade em considerar um trabalho "bom o suficiente" para entregar ou avançar'
  },
  {
    id: 2,
    category: 'B',
    text: 'Mantenho múltiplas abas abertas e salto entre elas constantemente durante o trabalho'
  },
  {
    id: 3,
    category: 'C',
    text: 'Acredito genuinamente que trabalho melhor quando o prazo está próximo'
  },
  {
    id: 4,
    category: 'D',
    text: 'Sinto que sempre preciso "ler mais um artigo" antes de me sentir pronto(a) para escrever'
  },
  {
    id: 5,
    category: 'E',
    text: 'Minha produtividade varia drasticamente de acordo com o humor ou a energia do dia'
  },
  {
    id: 6,
    category: 'F',
    text: 'Sinto culpa quando recuso pedidos de colegas, orientadores ou outras demandas externas'
  },

  // === RODADA 2 ===
  {
    id: 7,
    category: 'A',
    text: 'Fico preso(a) tentando deixar um trecho "perfeito" — releio o mesmo parágrafo várias vezes sem conseguir avançar'
  },
  {
    id: 8,
    category: 'B',
    text: 'Inicio novos projetos ou tarefas antes de finalizar os que estão em andamento'
  },
  {
    id: 9,
    category: 'C',
    text: 'Deixo tarefas importantes para fazer "depois" — e acabo conseguindo entregar na última hora'
  },
  {
    id: 10,
    category: 'D',
    text: 'Tenho dificuldade em delimitar o escopo da minha pesquisa — ele tende a crescer em vez de se consolidar'
  },
  {
    id: 11,
    category: 'E',
    text: 'Preciso estar inspirado(a) ou motivado(a) para conseguir trabalhar com foco real'
  },
  {
    id: 12,
    category: 'F',
    text: 'Minha agenda está cheia de compromissos, mas ao final do dia sinto que avancei pouco no que realmente importa'
  },

  // === RODADA 3 ===
  {
    id: 13,
    category: 'A',
    text: 'Sinto que, a qualquer momento, alguém pode descobrir que não sou tão capaz quanto pensam'
  },
  {
    id: 14,
    category: 'B',
    text: 'Tenho muitos projetos em estágio avançado que nunca chegam a ser concluídos de fato'
  },
  {
    id: 15,
    category: 'C',
    text: 'Tenho explosões intensas de produtividade seguidas de períodos longos de inatividade ou estagnação'
  },
  {
    id: 16,
    category: 'D',
    text: 'Confundo preparação extensa com progresso real — acabo me sentindo produtivo(a) sem ter produzido de fato'
  },
  {
    id: 17,
    category: 'E',
    text: 'Abandono projetos ou tarefas quando o entusiasmo inicial desaparece'
  },
  {
    id: 18,
    category: 'F',
    text: 'Aceito assumir tarefas ou responsabilidades de outros mesmo quando já estou sobrecarregado(a)'
  }
];
