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

**Package manager:** use npm (`npm install`), not bun — both lockfiles exist in the repo from past drift; npm is canonical until one is removed.

Debug the result screen without completing the quiz: `http://localhost:8080/?debug=result&profile=A` (profiles: `A`–`F`).

Required `.env` (never commit — see Security below):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```
The Greenn sales-webhook secret is **not** an env var — it's a Supabase Edge Function secret only (see Tracking below).

## Architecture

### Quiz funnel (state machine in `src/hooks/useQuiz.ts`)

Single hook drives the whole funnel through `QuizState.step`: `start → context → questions → email → result`. Progress persists to `localStorage` (key `quiz_progress`) on every change except while `step === 'result'`; unlock status persists to `sessionStorage` (`quiz_unlocked_session`) so a completed diagnosis survives a refresh without re-submitting.

Scoring pipeline: `src/data/questions.ts` (each question tagged with a `ProfileCode` A–F) → `src/lib/scoring.ts` (`calculateResult` sums per-category scores, picks the dominant profile plus any secondary profiles scoring ≥5) → `src/data/profiles.ts` / `profileResults.ts` / `profileSummaries.ts` supply the display copy, descriptions and long-form result text rendered by `QuizResult.tsx`. When editing quiz content or result copy, these data files are the source of truth — not the components.

Lead capture only happens at `submitUnlock` (in `useQuiz.ts`), which calls `submitQuizToDatabase` (`src/lib/api.ts`). This function requires `privacyConsent === true` before it will insert, and does a defensive two-step insert: it first tries the full row (with consent columns), and if Supabase reports a missing column/schema-cache error it retries with a legacy payload — this exists because the remote schema may lag behind local migrations for the consent columns added in `20260804160000_add_consent_columns_to_quiz_responses.sql`. Keep both payload shapes in sync if you change `quiz_responses` columns.

### CTA → checkout flow

CTA buttons in `QuizResult.tsx` (`handleCTAClick`) link to a Greenn checkout URL and manually forward the page's current UTM query params via `window.location.href` navigation rather than relying on the anchor's default navigation or `target="_blank"`. This is deliberate: injected third-party scripts can intercept/break the default click chain and popup blockers can kill a new tab, so the checkout redirect is driven directly in the click handler.

### Tracking (clean slate as of 2026-08-11)

**All third-party tracking was deliberately removed on 2026-08-11** — the Meta Pixel, the Meta Conversions API relay (`capi-relay` Edge Function), and both Utmify `<script>` blocks in `index.html`. This was a full reset before rebuilding the tracking approach from scratch; check git history (search for `capi-relay`, `metaPixel.ts`, "Utmify Pixel Script") if you need to see what the prior implementation looked like — a fairly complete Meta Pixel + CAPI dual-fire setup with Advanced Matching existed and was verified working (EMQ 6–9/10 across the funnel) before it was intentionally torn out, not because it was broken. `sistemaacademia.com.br`'s own Meta Ads MCP tools and/or Events Manager are the place to check current Pixel/dataset state going forward, since nothing in this repo talks to Meta right now.

**What survived the cleanup** (not third-party tracking, so explicitly kept):
- `src/lib/attribution.ts` — `captureAttributionFromUrl()` (called once from `main.tsx`, before anything else) persists `utm_source`/`utm_medium`/`utm_campaign`/`utm_content`/`utm_term`/`fbclid` from the landing URL into `localStorage` (first-touch-wins), so later funnel steps still see the original attribution even if the SPA's URL has since lost the query string. `getAttribution()` reads it back anywhere; `getFbcWithFallback()` reconstructs a Meta-format `fbc` value from the stored `fbclid` if a real `_fbc` cookie was never set (ad blockers, ITP) — currently unused (no Pixel to feed it) but ready for whatever CAPI work comes next.
- `cta_clicks` inserts in `handleCTAClick` (`QuizResult.tsx`) and the `quiz_starts` insert in `src/lib/trackQuizStart.ts` — first-party Supabase analytics for the admin funnel dashboard (`get-funnel-metrics`), not shared with any third party.
- The Vendas panel (`purchases` table, `greenn-sales-webhook`, `get-sales-metrics`, `Admin.tsx`'s "Vendas" section) — see the dedicated section below. Never sent anything to Meta to begin with.

**Do not build a Purchase (or InitiateCheckout-on-checkout) relay in this repo** without first confirming Greenn's own native Meta Pixel/CAPI integration (configured in Greenn's own dashboard, not this repo) is actually off — Greenn fires `Purchase`/`OrderBumpPurchase`/`InitiateCheckout`/`AddToCart`/`AddPaymentInfo` natively today. A webhook-based relay for this existed twice before (`greenn-purchase-webhook`) and was removed both times because running it alongside Greenn's native integration double-counted every sale to Meta.

`src/lib/analytics.ts` (`trackQuizStart`, `trackQuizProgress`, `trackResultView`, `trackCTAClick`) is no-op dead code, predating even the Meta Pixel work that was just removed — kept only so existing call sites don't need touching.

### Supabase backend

- `src/integrations/supabase/client.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only, never the service role key).
- `supabase/migrations/` — schema history; `combined_schema.sql` at repo root is a flattened reference snapshot of the schema (tables, RLS policies), not something migrations are generated from.
- Tables (`quiz_responses`, `quiz_submissions`, `quiz_starts`, `cta_clicks`, `user_roles`) all have RLS enabled. Public/anon access is **insert-only** (`Anyone can insert ...` policies) — there is no public `SELECT`, `UPDATE`, or `DELETE` policy on any of them. All reads, updates, and deletes for the admin panel go through Edge Functions using the service-role key, never the anon client directly.
- `purchases` (added 2026-08-07) is different from the tables above: RLS enabled with **no policies at all** for anon/authenticated — not even insert. Only the service-role key (inside `greenn-sales-webhook`/`get-sales-metrics`) ever touches it, since it's written by a webhook the browser never calls directly.
- `supabase/functions/` — admin Edge Functions: `get-quiz-responses`, `update-quiz-response`, `delete-quiz-response`, `reset-quiz-data`, `get-funnel-metrics`, `get-sales-metrics`. Plus one data-relay function that deliberately does **not** follow the admin pattern below: `greenn-sales-webhook` (called by Greenn, no JWT at all — `verify_jwt = false` in `supabase/config.toml` — authorized by a `GREENN_SALES_WEBHOOK_SECRET` query-string token instead). See Tracking above and the Sales panel section below.

#### Sales panel (`purchases` table + `greenn-sales-webhook` + `get-sales-metrics`)

Added 2026-08-07 so the admin panel could show revenue/sales data without touching Meta at all — deliberately separate from anything CAPI-related, to avoid ever re-creating the double-Purchase-to-Meta problem that got `greenn-purchase-webhook` removed (see Tracking above). `greenn-sales-webhook` only upserts Greenn's sale payload (keyed by `sale_id`, so repeated webhook deliveries for the same sale — created → paid → refunded — update one row instead of creating duplicates) into `purchases`; it never calls the Graph API. `get-sales-metrics` (admin-auth pattern) reads `purchases` + `quiz_responses`, and attributes revenue to a UTM campaign by **joining on email** — Greenn's webhook doesn't reliably carry UTM data itself, but we already have it captured at lead time in `quiz_responses`. `sale.amount`'s unit (reais vs. centavos) is unconfirmed against a real Greenn payload — `greenn-sales-webhook` assumes centavos (divides by 100), matching most BR gateways; verify before trusting the revenue figures the sales panel shows. `reset-quiz-data` now includes `purchases` in its default/whitelisted table list, and `Admin.tsx` has a "Vendas" section (revenue, ARPU, pending/refused/refunded counts, revenue-by-campaign table) alongside the existing funnel metrics.

#### Edge Function security pattern (mandatory for every admin function)

Every function in `supabase/functions/` follows the same two-stage check — copy this pattern exactly when adding a new admin function, don't shortcut it:

1. Require `Authorization: Bearer <token>`, then verify it with a Supabase client created with the **anon** key (`supabaseAuth.auth.getClaims(token)` / `getUser`) — this confirms the token is a valid, current session, not just a well-formed JWT.
2. Separately, using a **service-role** client (`supabaseAdmin`, bypasses RLS), query `user_roles` for `user_id = <claims.sub> AND role = 'admin'`. Only proceed if that row exists.

Never skip step 2 and infer admin-ness from the JWT claims alone, and never do step 2 with the anon-key client (RLS would hide the row). Both checks currently return 401/403 with a JSON `{ error }` body and are logged with a `[function-name]` prefix — match that convention.

CORS is handled per-function by a local `getCorsHeaders(req)` that echoes back `Origin` only if it's `localhost`/`127.0.0.1` or a `*.sistemaacademia.com.br` subdomain, otherwise falls back to the production origin. Never widen this to `Access-Control-Allow-Origin: *`, and never skip the `OPTIONS` preflight branch.

### Admin panel

`src/pages/Admin.tsx` authenticates with Supabase Auth (email/password via `supabase.auth`), then calls the Edge Functions above (passing the session's access token as the Bearer header) to list/edit/delete responses and pull funnel metrics — it does not query `quiz_responses` directly from the browser.

## Product content

When editing quiz result copy, profile descriptions, or funnel messaging, the source of truth is `docs/produto/<arquivo>.md` — curated, versioned excerpts triaged out of the broader product knowledge base. Check there first before editing components/data files (`profileResults.ts`, `profileSummaries.ts`, `questions.ts`, etc.) directly, since the docs may already capture the intended copy or explain why the current text diverges from an older version.

## Planned future work

- **Quiz reformulation:** the quiz has been reformulated before (30→18 questions, see `docs/produto/HISTORICO_perguntas_quiz_v1_30_perguntas.md`) and may be again. Before touching `questions.ts`/`scoring.ts`/`profileResults.ts`, check `docs/produto/` and confirm with the user which parts of the broader product knowledge base (outside this repo) should drive the new copy/structure.
- **Tracking rebuild:** Meta Pixel + CAPI (and Utmify) were implemented (2026-08-06/07), verified working, then fully removed (2026-08-11) for a clean-slate rebuild — see Tracking above for exactly what was torn out vs. kept (`src/lib/attribution.ts` survives, unused, ready for the next implementation). Whoever picks this up next should confirm with the user what the new approach should be (Pixel+CAPI again, a different provider, Utmify, some combination) before writing code — don't assume it's a straight repeat of the prior implementation.
- **Consent scope for Advanced Matching:** if/when Advanced Matching or CAPI PII sharing is reintroduced, note the mandatory `privacyConsent` checkbox copy in `QuizEmail.tsx` authorizes data use "para gerar e disponibilizar o diagnóstico," not explicitly ad-platform PII sharing. Confirm the linked privacy policy (`PRIVACY_POLICY_URL` in `phoneUtils.ts`) covers that use if it ever comes into question.

## Security notes

- `.env` and `supabase/.temp/` are gitignored and untracked (cleaned up 2026-08-06). `.env` previously held the anon/publishable key (not service-role) in git history on this public repo — low practical risk given RLS, but never re-add these paths to tracking.
- Do not add a public `SELECT`/`UPDATE`/`DELETE` RLS policy to `quiz_responses`/`quiz_submissions`/`cta_clicks`/`quiz_starts` — all reads/writes beyond insert must go through an Edge Function with the admin-role check above.
- `GREENN_SALES_WEBHOOK_SECRET` is an Edge Function secret only (`supabase secrets set`) — never put it in `.env`, client code, or a `VITE_`-prefixed var.
- Never put personal data (name/email/phone) in a URL query string, including the Greenn checkout redirect — a prior version of `handleCTAClick` appended name/email/phone as query params to try to prefill Greenn's checkout form; removed 2026-08-07 after confirming live it didn't prefill anything and was just needless PII exposure.
