# Quiz Diagnóstico — Sistema A.C.A.D.E.M.I.A

Quiz de diagnóstico comportamental para pesquisadores de pós-graduação. Identifica o perfil dominante de travamento acadêmico em 3 minutos.

**URL de Produção:** https://quiz.sistemaacademia.com.br
**Painel Admin:** https://quiz.sistemaacademia.com.br/admin

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Backend / DB:** Supabase (PostgreSQL + Edge Functions)
- **Hospedagem:** Deploy via build estático

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 18+
- npm ou bun

### Instalação

```sh
npm install
```

### Rodar em modo desenvolvimento

```sh
npm run dev
```

O servidor sobe em `http://localhost:8080`.

### Build de produção

```sh
npm run build
```

### Testes

```sh
npm run test
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

---

## Modo debug

Para visualizar a página de resultado sem completar o quiz:

```
http://localhost:8080/?debug=result&profile=A
```

Perfis disponíveis: `A`, `B`, `C`, `D`, `E`, `F`

---

## Estrutura do projeto

```
src/
  components/Quiz/   # Componentes do quiz (Start, Context, Question, Email, Result)
  hooks/             # useQuiz — estado e lógica do funil
  lib/               # analytics, api, scoring, trackQuizStart
  data/              # Questões e perfis de resultado
  types/             # Tipos TypeScript
supabase/
  functions/         # Edge Functions (get-quiz-responses, get-funnel-metrics, etc.)
```

---

## Domínio customizado

Configure o DNS do domínio `quiz.sistemaacademia.com.br` apontando para o servidor de hospedagem do build estático.
