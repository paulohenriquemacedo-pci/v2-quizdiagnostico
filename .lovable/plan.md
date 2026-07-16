# Documento PDF: Perguntas e Respostas do Quiz Sistema Academia

## O que será gerado
Um PDF para download em `/mnt/documents/quiz-sistema-academia-perguntas.pdf` contendo:

1. **Capa/cabeçalho** — Título "Quiz Diagnóstico — Sistema Academia", subtítulo com total de perguntas (30) e estrutura (6 categorias x 5 perguntas).

2. **Escala de respostas** (aplicada a todas as 30 perguntas):
   - 0 — Nunca / Discordo totalmente
   - 1 — Raramente / Discordo parcialmente
   - 2 — Às vezes / Neutro
   - 3 — Frequentemente / Concordo parcialmente
   - 4 — Sempre / Concordo totalmente

3. **As 6 categorias com as 5 perguntas cada** (texto atualizado conforme última versão do quiz):
   - A — Perfeccionista Paralisado (1-5)
   - B — Multitarefa Caótico (6-10)
   - C — Procrastinador Criativo (11-15)
   - D — Analista Perpétuo (16-20)
   - E — Dependente de Motivação (21-25)
   - F — Sobrecarregado Sistêmico (26-30)

4. **Lógica de pontuação** (resumo final):
   - Máximo de 20 pontos por categoria
   - Perfil dominante = categoria com maior pontuação
   - Perfis secundários = categorias com pontuação ≥ 9

## Detalhes técnicos
- Gerado via ReportLab (Python) com layout limpo, fonte Helvetica, títulos em destaque por categoria.
- Fonte das perguntas: `src/data/questions.ts` (versão atual, já com as 5 atualizações recentes).
- Entregue como `<presentation-artifact>` para download imediato.

Nenhuma alteração no código do app.