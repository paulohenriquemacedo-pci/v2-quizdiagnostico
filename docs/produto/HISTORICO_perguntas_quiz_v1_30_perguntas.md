> **⚠️ Documento histórico — desatualizado.** Esta é a versão original do quiz (30 perguntas, 5 por categoria, escala 0–4). O quiz em produção usa a **V2 reduzida (18 perguntas, 3 por categoria)**, com texto reescrito — ver [`src/data/questions.ts`](../../src/data/questions.ts). Mantido aqui apenas como referência histórica da evolução do quiz, não como fonte de verdade.

# Quiz Diagnóstico — Sistema Academia (V1)

Documento completo com as 30 perguntas, organizadas em 6 categorias (5 perguntas cada).

## Escala de respostas

| Valor | Significado |
|---|---|
| 0 | Nunca / Discordo totalmente |
| 1 | Raramente / Discordo parcialmente |
| 2 | Às vezes / Neutro |
| 3 | Frequentemente / Concordo parcialmente |
| 4 | Sempre / Concordo totalmente |

## Estrutura do quiz

São 6 categorias representando dimensões da improdutividade acadêmica. Cada categoria contém 5 perguntas, com pontuação máxima de 20 pontos. O **perfil dominante** é a categoria com maior pontuação. **Perfis secundários** são as categorias com pontuação ≥ 9.

## Perguntas por categoria

### Categoria A — Perfeccionista Paralisado

1. Passo muito tempo refinando frases e parágrafos antes de prosseguir
2. Tenho dificuldade para considerar meus trabalhos "prontos"
3. Prefiro não mostrar trabalhos em andamento para evitar críticas
4. Abandono projetos quando percebo que não estão "perfeitos"
5. Sinto que, a qualquer momento, alguém vai descobrir que não sou tão capaz quanto pensam

### Categoria B — Multitarefa Caótico

6. Mantenho múltiplas abas abertas e salto entre elas constantemente
7. Inicio novos projetos antes de finalizar os anteriores
8. Eu mesmo(a) inicio novos projetos ou tarefas sem ter finalizado os anteriores
9. Uso tarefas secundárias para evitar trabalho difícil
10. Tenho muitos projetos 80% prontos e poucos 100% finalizados

### Categoria C — Procrastinador Criativo

11. Acredito genuinamente que trabalho melhor sob pressão
12. Deixo tarefas importantes para a última hora intencionalmente
13. Tenho explosões intensas de produtividade seguidas de períodos inativos
14. Racionalizo a procrastinação como "tempo de incubação"
15. Sinto que minhas melhores ideias surgem quando o prazo está muito apertado

### Categoria D — Analista Perpétuo

16. Pesquiso excessivamente antes de começar qualquer projeto
17. Sempre sinto que preciso "ler mais um artigo" antes de escrever
18. Tenho dificuldade para delimitar o escopo de projetos
19. Evito tomar posições definidas por medo de estar mal informado
20. Confundo preparação extensiva com progresso real

### Categoria E — Dependente de Motivação

21. Minha produtividade varia drasticamente baseada no humor do dia
22. Preciso me sentir inspirado para trabalhar efetivamente
23. Abandono projetos facilmente quando perco o entusiasmo inicial
24. Busco constantemente estímulos externos para me motivar
25. A quantidade de horas produtivas que tenho por dia muda radicalmente de uma semana para outra

### Categoria F — Sobrecarregado Sistêmico

26. Raramente tenho blocos de 3+ horas livres para trabalho focado
27. Sinto culpa ao recusar pedidos de colegas ou orientadores
28. Minha agenda está lotada, mas progrido pouco nos projetos principais
29. Aceito assumir tarefas de colegas ou orientadores mesmo quando já estou sobrecarregado(a)
30. Trabalho muitas horas, mas com resultados desproporcionalmente baixos

## Lógica de pontuação (V1)

- Cada pergunta vale de 0 a 4 pontos.
- Cada categoria soma no máximo 20 pontos (5 perguntas × 4).
- Perfil dominante: categoria com a maior pontuação.
- Perfis secundários: demais categorias com pontuação ≥ 9.
- Faixas interpretativas por categoria: 0–6 baixo, 7–12 moderado, 13–20 alto.

> Na V2 (código atual), a escala de resposta (0–4, ver [`src/data/profiles.ts`](../../src/data/profiles.ts)) permanece a mesma, mas caiu para 3 perguntas por categoria (18 no total). O perfil dominante continua sendo o de maior soma; secundários são os que pontuam ≥ 5 (ver [`src/lib/scoring.ts`](../../src/lib/scoring.ts)).
