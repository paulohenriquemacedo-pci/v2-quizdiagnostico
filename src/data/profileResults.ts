export interface Practice {
  title: string;
  description: string;
  successCriteria: string;
}

export interface ProfileResultContent {
  code: string;
  name: string;
  color: string;
  icon: string;
  whatItMeans: string[];
  coreObstacle: string;
  coreObstacleMetric: string;
  immediatePractices: Practice[];
  transitionText: string;
  ctaHeadline: string;
  ctaBullets: string[];
}

export const GOVERNANCE_TEXT = "Este resultado descreve padrões comportamentais atuais; não é diagnóstico clínico e pode mudar conforme contexto e execução.";

export const TRANSITION_BASE = "O resultado acima é o seu diagnóstico preliminar gratuito. O Diagnóstico Completo aprofunda essa análise e entrega o protocolo detalhado passo a passo desenhado especificamente para o seu padrão comportamental.";

export const TRANSITION_COMPLEMENT = "A versão completa desbloqueia o conteúdo detalhado do seu perfil dominante e dos seus perfis secundários, fornecendo a base para você utilizar o nosso sistema para melhorar a sua produção acadêmica.";

export const profileResults: Record<string, ProfileResultContent> = {
  A: {
    code: "A",
    name: "Perfeccionista Paralisado",
    color: "#8b5cf6",
    icon: "✨",
    whatItMeans: [
      "Seu padrão atual tende a envolver ciclos longos de revisão antes de considerar algo pronto. É comum reescrever trechos várias vezes, adiar entregas para 'melhorar mais um pouco' e sentir desconforto ao mostrar trabalhos em andamento.",
      "Esse comportamento, em muitos casos, está associado a uma expectativa elevada sobre a qualidade do output. O resultado é que versões finalizadas demoram a existir — enquanto outras pessoas com menos refinamento já submeteram seus trabalhos.",
      "Sob pressão de prazos, pode surgir tensão. É possível que haja preferência por trabalhar sozinho para manter controle sobre o resultado. Projetos são abandonados ou pausados quando não atingem o padrão imaginado.",
      "O ponto central: o comportamento de refinamento excessivo frequentemente atrasa a geração de evidência concreta de progresso (versões entregues, textos submetidos)."
    ],
    coreObstacle: "Uma hipótese comum nesse padrão é a crença de que 'se não estiver excelente, não vale entregar'. Na prática acadêmica, output entregue tende a gerar mais resultado do que output perfeito não finalizado. A tese precisa ser aprovada — e isso exige versões concretas, não ideais abstratos.",
    coreObstacleMetric: "Progresso real = evidência verificável (output entregue).",
    immediatePractices: [
      {
        title: "1. CRITÉRIO DE SUFICIÊNCIA",
        description: "Antes de começar qualquer seção, defina critérios objetivos do que é 'suficiente para esta versão'. Exemplo: 'Esta seção está pronta quando tiver ~800 palavras e cobrir os 3 pontos principais'. Ao atingir, avance para a próxima etapa.",
        successCriteria: "Critério definido por escrito antes de iniciar; seção avançada ao atingir."
      },
      {
        title: "2. LIMITE DE TEMPO POR SEÇÃO",
        description: "Teste trabalhar com blocos de tempo definidos para cada parte. Exemplo como ponto de partida: Introdução, 3 horas. Quando o tempo acabar, registre o que tem e siga em frente. Ajuste o limite conforme seu contexto.",
        successCriteria: "Tempo registrado; próxima seção iniciada ao fim do bloco."
      },
      {
        title: "3. VERSÃO ZERO INTENCIONAL",
        description: "Experimente escrever uma primeira versão com baixa expectativa de qualidade. O objetivo é ter texto existente para revisar — não texto perfeito de primeira. Separar escrita de edição tende a reduzir o atrito inicial.",
        successCriteria: "Rascunho completo gerado antes de qualquer edição."
      },
      {
        title: "4. FEEDBACK EM VERSÕES PARCIAIS",
        description: "Teste enviar versões 60-70% prontas para feedback antes de considerar algo 'finalizado'. Isso pode economizar esforço de refinamento em direções que seriam ajustadas depois de qualquer forma.",
        successCriteria: "Versão parcial enviada; feedback recebido antes da versão 'final'."
      },
      {
        title: "5. REGISTRO DE ENTREGAS",
        description: "Crie uma métrica simples: quantas versões você entregou/submeteu esta semana? Focar em 'coisas finalizadas' como evidência de progresso pode ajudar a recalibrar o que significa produtividade.",
        successCriteria: "Número de entregas da semana registrado; tendência observada."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um mapeamento detalhado dos gatilhos de refinamento excessivo e um protocolo para calibrar o critério de suficiência ao seu contexto.",
    ctaHeadline: "Esses experimentos são um ponto de partida. O Diagnóstico Completo permite ajustar o protocolo ao seu contexto.",
    ctaBullets: [
      "📊 Mapeamento de energia: identifique quando seu foco está mais disponível",
      "📋 Protocolo de 15 dias: sequência de experimentos para testar e ajustar",
      "🎯 Templates: Planner com zonas de suficiência, checklist de entrega, ritual de finalização"
    ]
  },
  
  B: {
    code: "B",
    name: "Multitarefa Caótico",
    color: "#ff6b35",
    icon: "🔄",
    whatItMeans: [
      "Seu padrão atual tende a envolver múltiplos projetos em andamento simultaneamente. É comum ter várias abas abertas, documentos iniciados em diferentes estágios e compromissos aceitos que competem por atenção.",
      "Esse comportamento frequentemente gera a sensação de estar ocupado — mas ao revisar a semana, o progresso nos projetos prioritários pode ser menor do que o esperado. Muitos itens ficam em 70-80% e poucos chegam a 100%.",
      "Pode haver dificuldade em manter foco em uma única tarefa por períodos longos (1-2 horas). Tarefas secundárias (organizar, formatar, responder mensagens) às vezes ocupam espaço do trabalho de escrita profunda.",
      "O ponto central: alternar entre contextos tem um custo cognitivo. Profundidade em menos projetos tende a gerar mais output finalizado do que atenção distribuída em muitos."
    ],
    coreObstacle: "Uma hipótese comum nesse padrão é associar ocupação com produtividade. Na prática, output verificável (texto entregue, artigo submetido) é o que conta. Concentrar energia em menos frentes tende a acelerar a finalização.",
    coreObstacleMetric: "Progresso real = evidência verificável (projetos finalizados).",
    immediatePractices: [
      {
        title: "1. EXPERIMENTO: 1 PROJETO PRIORITÁRIO",
        description: "Por uma semana, teste eleger um único projeto como prioridade máxima. Os outros ficam em pausa consciente. Observe se isso muda a quantidade de output gerado nesse projeto específico.",
        successCriteria: "Projeto prioritário definido; output da semana comparado com semanas anteriores."
      },
      {
        title: "2. AMBIENTE DE FOCO",
        description: "Experimente configurar seu ambiente para reduzir alternância: uma janela aberta, um arquivo, um objetivo por bloco de trabalho. Teste bloqueadores de distração se necessário.",
        successCriteria: "Bloco de trabalho com ambiente configurado; alternância reduzida observada."
      },
      {
        title: "3. LISTA 'FECHAR ANTES DE ABRIR'",
        description: "Faça um inventário de projetos parcialmente prontos. Teste a regra: não iniciar projetos novos até fechar um da lista. 'Fechar' significa entregue ou explicitamente arquivado.",
        successCriteria: "Inventário criado; um projeto fechado antes de abrir novo."
      },
      {
        title: "4. BLOCOS DE DEEP WORK",
        description: "Teste 2-3x por semana fazer blocos de 60-90 minutos sem interrupções. Comece com o tempo que parecer viável e ajuste. O objetivo é criar períodos de imersão no trabalho prioritário.",
        successCriteria: "Blocos agendados e executados; output do bloco registrado."
      },
      {
        title: "5. PAUSA EM NOVOS COMPROMISSOS",
        description: "Por 2-4 semanas, experimente ter 'não' como resposta padrão para novos projetos e convites. Isso cria espaço para finalizar o que está em andamento antes de adicionar mais.",
        successCriteria: "Compromissos recusados registrados; espaço liberado observado."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um mapeamento dos gatilhos de dispersão e um protocolo para reduzir o custo de alternância.",
    ctaHeadline: "Esses experimentos iniciam a mudança. O Diagnóstico Completo oferece um protocolo ajustado ao seu padrão.",
    ctaBullets: [
      "📊 Mapeamento de dispersão: identifique seus gatilhos de alternância",
      "📋 Protocolo de 15 dias: sistema progressivo de foco com checkpoints",
      "🎯 Templates: Priorização visual, blocos de tempo, ritual de fechamento de projetos"
    ]
  },
  
  C: {
    code: "C",
    name: "Procrastinador Criativo",
    color: "#fbbf24",
    icon: "💡",
    whatItMeans: [
      "Seu padrão atual tende a envolver picos intensos de produtividade próximos a deadlines, seguidos de períodos com pouca atividade. É comum a percepção de que 'trabalho melhor sob pressão'.",
      "Esse comportamento pode gerar resultados — muitas pessoas com esse padrão entregam trabalhos de qualidade. O custo tende a aparecer em desgaste elevado, recuperação necessária após sprints intensos e dificuldade em manter ritmo consistente.",
      "Pode haver tendência a adiar o início de projetos, aguardando o 'momento certo' ou a pressão do prazo. O período entre receber uma tarefa e começar efetivamente pode ser longo.",
      "O ponto central: a urgência funciona como ativador — mas depender exclusivamente dela limita a quantidade e qualidade do output ao longo do tempo."
    ],
    coreObstacle: "Uma hipótese comum é que a associação urgência-produtividade foi reforçada ao longo do tempo. O desafio é criar estruturas que ativem o trabalho sem depender do pânico de deadlines iminentes.",
    coreObstacleMetric: "Progresso real = evidência verificável (entregas distribuídas, não apenas sob pressão).",
    immediatePractices: [
      {
        title: "1. DEADLINES INTERMEDIÁRIOS COM ACCOUNTABILITY",
        description: "Teste criar entregas parciais antes do prazo final — com alguém esperando (orientador, colega). Exemplo: 'Versão 1 para revisão até sexta'. A pressão social pode substituir parte da pressão do deadline.",
        successCriteria: "Entrega intermediária agendada e cumprida; feedback recebido antes do prazo final."
      },
      {
        title: "2. SPRINTS CURTOS COM RECOMPENSA",
        description: "Experimente trabalhar em blocos de 25-30 minutos seguidos de uma pausa ou recompensa pequena. O objetivo é criar ciclos de ativação mais frequentes, sem esperar a urgência final.",
        successCriteria: "Sprints executados; output por sprint registrado."
      },
      {
        title: "3. SESSÕES DE CO-WORKING",
        description: "Teste agendar sessões regulares de trabalho com alguém — presencial ou online. Horário fixo, compromisso mútuo. A presença de outra pessoa pode funcionar como ativador.",
        successCriteria: "Sessão agendada e executada; output da sessão comparado com trabalho solo."
      },
      {
        title: "4. REGRA DOS 10 MINUTOS",
        description: "Quando há resistência para começar, comprometa-se com apenas 10 minutos. Configure um timer. Se depois quiser parar, OK. Na maioria dos casos, continuar fica mais fácil após o início.",
        successCriteria: "Timer iniciado; continuação ou parada registrada."
      },
      {
        title: "5. MAPEAMENTO DE PICOS DE ENERGIA",
        description: "Por uma semana, registre em quais horários você naturalmente tem mais disposição para trabalho focado. Use essa informação para proteger esses horários para as tarefas prioritárias.",
        successCriteria: "Registro de energia por 7 dias; horários de pico identificados."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um sistema de ativação que não depende de urgência externa.",
    ctaHeadline: "Esses experimentos criam alternativas à urgência. O Diagnóstico Completo oferece um sistema completo de ativação.",
    ctaBullets: [
      "📊 Mapeamento de energia: identifique seus horários de pico naturais",
      "📋 Protocolo de 15 dias: sistema de pressão programada com checkpoints",
      "🎯 Templates: Deadlines escalonados, tracker de energia, rituais de ativação"
    ]
  },
  
  D: {
    code: "D",
    name: "Analista Perpétuo",
    color: "#1a3a5c",
    icon: "🔬",
    whatItMeans: [
      "Seu padrão atual tende a envolver períodos extensos de leitura e coleta de informações antes de começar a escrever. É comum sentir que 'precisa de mais um artigo' antes de estar pronto para produzir texto.",
      "Esse comportamento pode gerar acúmulo de material (PDFs, anotações, referências) sem proporcional avanço no texto final. A fase de preparação se estende enquanto a fase de escrita é adiada.",
      "Pode haver dificuldade em delimitar o escopo de investigação — com frequência há mais aspectos interessantes para explorar. Tomar posições definidas pode parecer arriscado sem 'informação completa'.",
      "O ponto central: pesquisa extensa pode funcionar como forma de adiar o trabalho de escrita, que exige exposição e tomada de posição. Mais leitura raramente resolve a dificuldade de escrever."
    ],
    coreObstacle: "Uma hipótese comum é a crença de que 'quando souber o suficiente, escrever será fácil'. Na prática, a escrita envolve incerteza — e isso é esperado. O desafio é escrever com informação suficiente, não informação completa.",
    coreObstacleMetric: "Progresso real = evidência verificável (páginas escritas, não PDFs acumulados).",
    immediatePractices: [
      {
        title: "1. LIMITE DE FONTES COMO EXPERIMENTO",
        description: "Para um tópico específico, teste limitar a leitura a 3-5 fontes principais. Escolha as mais relevantes, fiche-as, e comece a escrever. Observe se isso é suficiente para uma primeira versão.",
        successCriteria: "Fontes limitadas; primeira versão escrita com esse limite."
      },
      {
        title: "2. TEMPO MÁXIMO DE PESQUISA",
        description: "Teste definir um limite diário para leitura (ex: 2 horas como ponto de partida). Quando o tempo acabar, mude para modo de escrita. Ajuste o limite conforme seu contexto e observe o impacto.",
        successCriteria: "Limite de tempo respeitado; transição para escrita executada."
      },
      {
        title: "3. PRAZO PARA REVISÃO BIBLIOGRÁFICA",
        description: "Defina uma data limite para a fase de pesquisa de cada seção (ex: 1-2 semanas como sugestão). Após esse prazo, escreva com o que tem. Informação adicional pode ser integrada em revisões futuras.",
        successCriteria: "Prazo definido e cumprido; escrita iniciada na data marcada."
      },
      {
        title: "4. ESCREVA PRIMEIRO, PESQUISE DEPOIS",
        description: "Experimente inverter: escreva um rascunho inicial baseado no que já sabe. Depois, identifique lacunas específicas e pesquise apenas para preenchê-las. Isso torna a pesquisa direcionada.",
        successCriteria: "Rascunho escrito antes de pesquisa adicional; lacunas identificadas por escrito."
      },
      {
        title: "5. MÉTRICA DE OUTPUT",
        description: "Acompanhe páginas escritas por semana como métrica principal — não artigos lidos ou PDFs salvos. Output verificável é a evidência de progresso que conta.",
        successCriteria: "Páginas escritas registradas semanalmente; tendência observada."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um protocolo 'Write-First' que equilibra pesquisa e escrita com critérios de suficiência.",
    ctaHeadline: "Esses experimentos equilibram pesquisa e escrita. O Diagnóstico Completo oferece um protocolo ajustado ao seu contexto.",
    ctaBullets: [
      "📊 Auditoria de tempo: mapeie a proporção atual pesquisa vs. escrita",
      "📋 Protocolo de 15 dias: sistema 'Write-First' com pesquisa direcionada",
      "🎯 Templates: Matriz de suficiência, tracker de output, ritual de transição pesquisa→escrita"
    ]
  },
  
  E: {
    code: "E",
    name: "Dependente de Motivação",
    color: "#ec4899",
    icon: "🎢",
    whatItMeans: [
      "Seu padrão atual tende a envolver variação significativa de produtividade baseada no estado emocional do momento. É comum sentir necessidade de estar 'inspirado' ou 'no mood certo' para trabalhar efetivamente.",
      "Esse comportamento pode gerar ciclos de alta produtividade seguidos de períodos improdutivos. Projetos podem ser abandonados quando o entusiasmo inicial diminui. Há busca frequente por novos métodos, ferramentas ou estímulos.",
      "Tarefas percebidas como 'chatas' ou rotineiras tendem a ser adiadas. A motivação funciona como pré-requisito para ação, em vez de consequência dela.",
      "O ponto central: na maioria dos contextos profissionais, a ação precede a motivação — não o contrário. Esperar pelo estado emocional 'certo' tende a reduzir a consistência de output."
    ],
    coreObstacle: "Uma hipótese comum é a crença de que 'se não estou motivado, não consigo produzir'. Na prática, muitas pessoas produzem output consistente independentemente do humor — através de rotinas e estruturas externas.",
    coreObstacleMetric: "Progresso real = evidência verificável (consistência de output, não picos esporádicos).",
    immediatePractices: [
      {
        title: "1. HORÁRIO FIXO (EXPERIMENTO)",
        description: "Teste definir um horário fixo de trabalho (ex: segunda a sexta, 9h-11h como ponto de partida). Nesse horário, você trabalha independentemente do estado emocional. Comece com blocos menores e aumente gradualmente.",
        successCriteria: "Horário cumprido por 5 dias; output registrado independente do humor."
      },
      {
        title: "2. RITUAL DE INÍCIO",
        description: "Crie uma sequência física que precede o trabalho: café específico, playlist, local, timer. Repita consistentemente. O objetivo é criar uma associação automática: ritual → modo de trabalho.",
        successCriteria: "Ritual definido e executado por 7 dias; transição para trabalho observada."
      },
      {
        title: "3. COMPROMISSO MÍNIMO",
        description: "Quando a resistência for alta, comprometa-se com apenas 5-10 minutos. Configure timer. Se depois quiser parar, OK. O início é frequentemente a parte mais difícil.",
        successCriteria: "Timer de 5-10 min iniciado; continuação ou parada registrada."
      },
      {
        title: "4. REGISTRO DE CONSISTÊNCIA",
        description: "Use um calendário para marcar cada dia em que trabalhou no projeto (mesmo que pouco). O objetivo é manter a 'corrente' de dias. Consistência é a métrica, não quantidade.",
        successCriteria: "Dias marcados no calendário; corrente de dias observada."
      },
      {
        title: "5. EXPECTATIVA REALISTA SOBRE TÉDIO",
        description: "Reconheça que parte significativa do trabalho acadêmico não será empolgante — e isso é esperado. A capacidade de trabalhar apesar do tédio é uma habilidade, não um defeito.",
        successCriteria: "Trabalho executado em tarefa 'chata'; output registrado."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um sistema de rotinas personalizadas que cria ação independente do estado emocional.",
    ctaHeadline: "Esses experimentos criam ação independente de humor. O Diagnóstico Completo oferece um sistema de rotinas personalizadas.",
    ctaBullets: [
      "📊 Mapeamento de padrões: identifique seus gatilhos de motivação e desmotivação",
      "📋 Protocolo de 15 dias: rotina progressiva com rituais de ativação",
      "🎯 Templates: Rastreador de consistência, biblioteca de rituais, planner de rotinas"
    ]
  },
  
  F: {
    code: "F",
    name: "Sobrecarregado Sistêmico",
    color: "#ef4444",
    icon: "😰",
    whatItMeans: [
      "Seu padrão atual tende a envolver agenda lotada de compromissos com pouco tempo protegido para trabalho profundo. É comum aceitar demandas de colegas, orientadores e instituição, resultando em fragmentação da atenção.",
      "Esse comportamento pode gerar sensação constante de urgência e falta de tempo. Horas trabalhadas são muitas, mas o progresso em projetos prioritários (tese, artigos) pode ser desproporcional ao esforço.",
      "Pode haver dificuldade em recusar pedidos ou delegar tarefas. Fins de semana são usados para 'compensar' o que não foi possível durante a semana. Blocos longos de foco (3+ horas) são raros.",
      "O ponto central: sem limites claros, a agenda é preenchida por demandas externas. Proteger tempo para trabalho prioritário exige decisões ativas de recusa."
    ],
    coreObstacle: "Uma hipótese comum é associar estar ocupado com ser produtivo. Na prática, horas trabalhadas e output gerado são métricas diferentes. Foco em menos atividades tende a gerar mais resultado do que dispersão em muitas.",
    coreObstacleMetric: "Progresso real = evidência verificável (output em projetos prioritários, não horas ocupadas).",
    immediatePractices: [
      {
        title: "1. BLOCO PROTEGIDO (EXPERIMENTO)",
        description: "Teste bloquear 2-3x por semana períodos de 2-3 horas para trabalho prioritário. Trate como compromisso inegociável — reuniões e pedidos não entram. Comece com 1x por semana e aumente.",
        successCriteria: "Bloco agendado e protegido; output do bloco registrado."
      },
      {
        title: "2. RESPOSTA PADRÃO TEMPORÁRIA",
        description: "Por 2-4 semanas, experimente ter 'não posso neste momento' como resposta padrão para novos compromissos. Isso cria espaço para avaliar antes de aceitar automaticamente.",
        successCriteria: "Compromissos recusados/adiados registrados; tempo liberado observado."
      },
      {
        title: "3. AUDITORIA DE TEMPO",
        description: "Por uma semana, registre como você usa cada bloco de 30-60 minutos. Depois categorize: (A) Avança projetos prioritários, (B) Necessário mas não avança, (C) Opcional. Observe a proporção.",
        successCriteria: "Registro de 7 dias completo; proporção A/B/C calculada."
      },
      {
        title: "4. AGRUPAMENTO DE TAREFAS SIMILARES",
        description: "Teste concentrar atividades similares em blocos: reuniões em dias/horários específicos, emails em 2-3 momentos do dia. Isso reduz o custo de alternância entre tipos de tarefa.",
        successCriteria: "Agrupamento implementado; redução de alternância observada."
      },
      {
        title: "5. REVISÃO DE COMPROMISSOS",
        description: "Liste seus compromissos recorrentes. Para cada um, pergunte: pode ser delegado? Pode ser reduzido em frequência? É realmente necessário? Identifique candidatos a ajuste.",
        successCriteria: "Lista criada; pelo menos um compromisso ajustado ou removido."
      }
    ],
    transitionText: "Para quem opera nesse padrão, o Diagnóstico Completo oferece um sistema de priorização e limites adaptado à sua realidade de demandas.",
    ctaHeadline: "Esses experimentos criam limites iniciais. O Diagnóstico Completo oferece um sistema de priorização adaptado ao seu contexto.",
    ctaBullets: [
      "📊 Auditoria completa: mapeie para onde está indo seu tempo e energia",
      "📋 Protocolo de 15 dias: sistema progressivo de limites e priorização",
      "🎯 Templates: Matriz de priorização, bloqueador de agenda, scripts de recusa"
    ]
  }
};
