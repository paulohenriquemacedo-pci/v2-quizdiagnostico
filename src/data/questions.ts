import { Question } from '@/types/quiz.types';

// Perguntas em ordem intercalada por perfil (A,B,C,D,E,F repetido 5 vezes)
// Isso evita que o usuário analítico identifique os blocos e responda estrategicamente.
// O algoritmo de pontuação usa apenas a propriedade 'category' — a ordem não afeta o resultado.

export const questions: Question[] = [

  // === RODADA 1 ===
  {
    id: 1,
    category: 'A',
    text: 'Quando escrevo, tendo a revisar e reformular o que já produzi antes de avançar para a próxima ideia'
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
    text: 'Costumo pesquisar e ler bastante antes de começar a produzir — mesmo quando já tenho material suficiente'
  },
  {
    id: 5,
    category: 'E',
    text: 'Minha produtividade varia drasticamente de acordo com o humor ou a energia do dia'
  },
  {
    id: 6,
    category: 'F',
    text: 'Raramente consigo ter blocos de 2 horas ou mais exclusivamente dedicados à pesquisa principal'
  },

  // === RODADA 2 ===
  {
    id: 7,
    category: 'A',
    text: 'Tenho dificuldade em considerar um trabalho "bom o suficiente" para entregar ou avançar'
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
    text: 'Sinto que sempre preciso "ler mais um artigo" antes de me sentir pronto(a) para escrever'
  },
  {
    id: 11,
    category: 'E',
    text: 'Preciso estar inspirado(a) ou motivado(a) para conseguir trabalhar com foco real'
  },
  {
    id: 12,
    category: 'F',
    text: 'Sinto culpa quando recuso pedidos de colegas, orientadores ou outras demandas externas'
  },

  // === RODADA 3 ===
  {
    id: 13,
    category: 'A',
    text: 'Em geral, evito compartilhar partes inacabadas do meu trabalho — mesmo quando o feedback me ajudaria a avançar'
  },
  {
    id: 14,
    category: 'B',
    text: 'Uso tarefas menores e secundárias como forma de evitar as tarefas mais difíceis e importantes'
  },
  {
    id: 15,
    category: 'C',
    text: 'Racionalizo o tempo sem produção como "período de incubação" ou "amadurecimento da ideia"'
  },
  {
    id: 16,
    category: 'D',
    text: 'Tenho dificuldade em delimitar o escopo da minha pesquisa — ele tende a crescer em vez de se consolidar'
  },
  {
    id: 17,
    category: 'E',
    text: 'Abandono projetos ou tarefas quando o entusiasmo inicial desaparece'
  },
  {
    id: 18,
    category: 'F',
    text: 'Minha agenda está cheia de compromissos, mas ao final do dia sinto que avancei pouco no que realmente importa'
  },

  // === RODADA 4 ===
  {
    id: 19,
    category: 'A',
    text: 'Fico preso(a) tentando deixar um trecho "perfeito" — releio o mesmo parágrafo várias vezes sem conseguir avançar'
  },
  {
    id: 20,
    category: 'B',
    text: 'Tenho muitos projetos em estágio avançado que nunca chegam a ser concluídos de fato'
  },
  {
    id: 21,
    category: 'C',
    text: 'Costumo criar condições ideais antes de começar (silêncio absoluto, ambiente perfeito, "hora certa")'
  },
  {
    id: 22,
    category: 'D',
    text: 'Evito tomar posições definidas na pesquisa por medo de estar mal fundamentado(a)'
  },
  {
    id: 23,
    category: 'E',
    text: 'Quando recebo retorno positivo do orientador ou de colegas, minha produção nas semanas seguintes aumenta visivelmente'
  },
  {
    id: 24,
    category: 'F',
    text: 'Aceito assumir tarefas ou responsabilidades de outros mesmo quando já estou sobrecarregado(a)'
  },

  // === RODADA 5 ===
  {
    id: 25,
    category: 'A',
    text: 'Sinto que, a qualquer momento, alguém pode descobrir que não sou tão capaz quanto pensam'
  },
  {
    id: 26,
    category: 'B',
    text: 'Durante uma sessão de trabalho, frequentemente me pego fazendo coisas não planejadas que consomem meu tempo'
  },
  {
    id: 27,
    category: 'C',
    text: 'Tenho explosões intensas de produtividade seguidas de períodos longos de inatividade ou estagnação'
  },
  {
    id: 28,
    category: 'D',
    text: 'Confundo preparação extensa com progresso real — acabo me sentindo produtivo(a) sem ter produzido de fato'
  },
  {
    id: 29,
    category: 'E',
    text: 'A quantidade de horas realmente produtivas que tenho por dia varia muito de uma semana para outra, sem razão aparente'
  },
  {
    id: 30,
    category: 'F',
    text: 'Trabalho muitas horas por dia, mas os resultados concretos são desproporcionalmente baixos para o esforço empregado'
  }
];
