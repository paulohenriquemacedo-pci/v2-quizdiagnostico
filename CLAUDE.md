# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quiz diagnóstico comportamental (Sistema A.C.A.D.E.M.I.A) — identifica o perfil dominante de travamento acadêmico de pesquisadores de pós-graduação em ~3 minutos, captura lead (nome/e-mail/telefone) e disponibiliza o diagnóstico. Produção: `https://quiz.sistemaacademia.com.br` (admin em `/admin`).

**Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, Supabase (Postgres + Edge Functions) as backend, deployed as a static build (Hostinger).

## Commands

```sh
npm run dev          # dev server at http://localhost:8080
npm run build         # production build
npm run build:dev     # build with development mode env
npm run lint           # eslint .
npm run test            # vitest run (single run, CI mode)
npm run test:watch       # vitest watch mode
npm run preview           # preview a production build locally
```

Run a single test file: `npx vitest run src/test/scoring.test.ts`
Run tests matching a name: `npx vitest run -t "nome do teste"`

**Package manager:** npm (`npm install`) — the only lockfile in the repo.

Debug the result screen without completing the quiz: `http://localhost:8080/?debug=result&profile=A` (profiles: `A`–`F`).

Required `.env` (never commit — see Security below):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

## Architecture

### Quiz funnel (state machine in `src/hooks/useQuiz.ts`)

Single hook drives the whole funnel through `QuizState.step`: `start → context → questions → email → result`. Progress persists to `localStorage` (key `quiz_progress`) on every change except while `step === 'result'`; unlock status persists to `sessionStorage` (`quiz_unlocked_session`) so a completed diagnosis survives a refresh without re-submitting.

Scoring pipeline: `src/data/questions.ts` (each question tagged with a `ProfileCode` A–F) → `src/lib/scoring.ts` (`calculateResult` sums per-category scores, picks the dominant profile plus any secondary profiles scoring ≥5) → `src/data/profiles.ts` / `profileResults.ts` / `profileSummaries.ts` supply the display copy, descriptions and long-form result text rendered by `QuizResult.tsx`. When editing quiz content or result copy, these data files are the source of truth — not the components.

Lead capture only happens at `submitUnlock` (in `useQuiz.ts`), which calls `submitQuizToDatabase` (`src/lib/api.ts`). This function requires `privacyConsent === true` before it will insert, and saves the lead details, answers and scoring into `quiz_responses`.

### CTA flow

Every final CTA link on the result page renders through `<CheckoutCTA>` (`src/components/Quiz/CheckoutCTA.tsx`), pointing to `CHECKOUT_URL` in `src/config/checkout.ts`. It is kept neutral and uncoupled from external marketing/checkout providers.

### Tracking & Analytics

The codebase contains **no external pixels, tracking scripts, GTM, analytics or UTM capture**. It is purely dedicated to the quiz experience and direct lead capture in Supabase.

### Supabase backend

- `src/integrations/supabase/client.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `supabase/migrations/` — schema history; `combined_schema.sql` at repo root is a flattened reference snapshot.
- Tables (`quiz_responses`, `user_roles`) have RLS enabled. Public access to `quiz_responses` is insert-only. All admin queries and operations go through authenticated Edge Functions with admin-role verification.
- `supabase/functions/` — admin Edge Functions: `get-quiz-responses`, `update-quiz-response`, `delete-quiz-response`, `reset-quiz-data`.

### Admin panel

`src/pages/Admin.tsx` authenticates with Supabase Auth (email/password via `supabase.auth`), then calls the Edge Functions to list, search, edit, delete responses and export data to CSV.

## Product content

When editing quiz result copy, profile descriptions, or messaging, the source of truth is `docs/produto/<arquivo>.md`. Check there first before editing components/data files (`profileResults.ts`, `profileSummaries.ts`, `questions.ts`, etc.) directly.
