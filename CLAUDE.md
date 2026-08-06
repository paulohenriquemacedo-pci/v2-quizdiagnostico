# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quiz diagnóstico comportamental (Sistema A.C.A.D.E.M.I.A) — identifica o perfil dominante de travamento acadêmico de pesquisadores de pós-graduação em ~3 minutos, captura lead (nome/e-mail/telefone) e conduz ao checkout de um produto (Greenn). Produção: `https://quiz.sistemaacademia.com.br` (admin em `/admin`).

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

Lead capture only happens at `submitUnlock` (in `useQuiz.ts`), which calls `submitQuizToDatabase` (`src/lib/api.ts`). This function requires `privacyConsent === true` before it will insert, and does a defensive two-step insert: it first tries the full row (with consent columns), and if Supabase reports a missing column/schema-cache error it retries with a legacy payload — this exists because the remote schema may lag behind local migrations for the consent columns added in `20260804160000_add_consent_columns_to_quiz_responses.sql`. Keep both payload shapes in sync if you change `quiz_responses` columns.

### CTA → checkout flow

CTA buttons in `QuizResult.tsx` (`handleCTAClick`) link to a Greenn checkout URL and manually forward the page's current UTM query params via `window.location.href` navigation rather than relying on the anchor's default navigation or `target="_blank"`. This is deliberate: the injected Utmify pixel script (see below) can intercept/break the default click chain and popup blockers can kill a new tab, so the checkout redirect is driven directly in the click handler.

### Tracking

`src/lib/analytics.ts` (`trackQuizStart`, `trackQuizProgress`, `trackCTAClick`, etc.) is intentionally all no-ops now — first-party event tracking to Supabase (`quiz_starts`, `cta_clicks` tables) was superseded by the official Utmify Pixel + UTM tracking scripts installed directly in `index.html`. Those two `<script>` blocks are obfuscated loader snippets (base64 + XOR) that inject Utmify's real script tag — this is Utmify's official embed format, not custom obfuscation added by this project. Don't try to "clean up" or inline them without understanding this.

### Supabase backend

- `src/integrations/supabase/client.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only, never the service role key).
- `supabase/migrations/` — schema history; `combined_schema.sql` at repo root is a flattened reference snapshot of the schema (tables, RLS policies), not something migrations are generated from.
- Tables (`quiz_responses`, `quiz_submissions`, `quiz_starts`, `cta_clicks`, `user_roles`) all have RLS enabled. Public/anon access is **insert-only** (`Anyone can insert ...` policies) — there is no public `SELECT`, `UPDATE`, or `DELETE` policy on any of them. All reads, updates, and deletes for the admin panel go through Edge Functions using the service-role key, never the anon client directly.
- `supabase/functions/` — admin Edge Functions: `get-quiz-responses`, `update-quiz-response`, `delete-quiz-response`, `reset-quiz-data`, `get-funnel-metrics`.

#### Edge Function security pattern (mandatory for every admin function)

Every function in `supabase/functions/` follows the same two-stage check — copy this pattern exactly when adding a new admin function, don't shortcut it:

1. Require `Authorization: Bearer <token>`, then verify it with a Supabase client created with the **anon** key (`supabaseAuth.auth.getClaims(token)` / `getUser`) — this confirms the token is a valid, current session, not just a well-formed JWT.
2. Separately, using a **service-role** client (`supabaseAdmin`, bypasses RLS), query `user_roles` for `user_id = <claims.sub> AND role = 'admin'`. Only proceed if that row exists.

Never skip step 2 and infer admin-ness from the JWT claims alone, and never do step 2 with the anon-key client (RLS would hide the row). Both checks currently return 401/403 with a JSON `{ error }` body and are logged with a `[function-name]` prefix — match that convention.

CORS is handled per-function by a local `getCorsHeaders(req)` that echoes back `Origin` only if it's `localhost`/`127.0.0.1` or a `*.sistemaacademia.com.br` subdomain, otherwise falls back to the production origin. Never widen this to `Access-Control-Allow-Origin: *`, and never skip the `OPTIONS` preflight branch.

### Admin panel

`src/pages/Admin.tsx` authenticates with Supabase Auth (email/password via `supabase.auth`), then calls the Edge Functions above (passing the session's access token as the Bearer header) to list/edit/delete responses and pull funnel metrics — it does not query `quiz_responses` directly from the browser.

## Security notes

- `.env` and `supabase/.temp/` must never be committed (now covered by `.gitignore`); `.env` was previously tracked in git history holding only the anon/publishable key (not the service-role key), but should still be removed from tracking (`git rm --cached .env`) — ask before doing this since it rewrites tracked state.
- Do not add a public `SELECT`/`UPDATE`/`DELETE` RLS policy to `quiz_responses`/`quiz_submissions`/`cta_clicks`/`quiz_starts` — all reads/writes beyond insert must go through an Edge Function with the admin-role check above.
