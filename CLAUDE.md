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
VITE_META_PIXEL_ID=<meta-pixel-id>
```
`VITE_META_PIXEL_ID` is not secret (it's visible in any page's source once the Pixel loads). It's read in JS (`initMetaPixel()` in `src/lib/metaPixel.ts`, called from `main.tsx`), **not** via Vite's `%VAR%` HTML interpolation in `index.html` — that approach was tried first and reverted because Vite hard-fails the entire build (`URI malformed` in `decodeURI`) if the referenced var isn't defined in the build environment, rather than degrading gracefully. Any build host (Hostinger's auto-deploy included) must have `VITE_META_PIXEL_ID` set among its build env vars for the Pixel to actually initialize — if it's missing, `initMetaPixel()` just warns and no-ops instead of breaking the build. The CAPI access token and the Greenn webhook secret are **not** env vars — they're Supabase Edge Function secrets only (see Tracking below).

## Architecture

### Quiz funnel (state machine in `src/hooks/useQuiz.ts`)

Single hook drives the whole funnel through `QuizState.step`: `start → context → questions → email → result`. Progress persists to `localStorage` (key `quiz_progress`) on every change except while `step === 'result'`; unlock status persists to `sessionStorage` (`quiz_unlocked_session`) so a completed diagnosis survives a refresh without re-submitting.

Scoring pipeline: `src/data/questions.ts` (each question tagged with a `ProfileCode` A–F) → `src/lib/scoring.ts` (`calculateResult` sums per-category scores, picks the dominant profile plus any secondary profiles scoring ≥5) → `src/data/profiles.ts` / `profileResults.ts` / `profileSummaries.ts` supply the display copy, descriptions and long-form result text rendered by `QuizResult.tsx`. When editing quiz content or result copy, these data files are the source of truth — not the components.

Lead capture only happens at `submitUnlock` (in `useQuiz.ts`), which calls `submitQuizToDatabase` (`src/lib/api.ts`). This function requires `privacyConsent === true` before it will insert, and does a defensive two-step insert: it first tries the full row (with consent columns), and if Supabase reports a missing column/schema-cache error it retries with a legacy payload — this exists because the remote schema may lag behind local migrations for the consent columns added in `20260804160000_add_consent_columns_to_quiz_responses.sql`. Keep both payload shapes in sync if you change `quiz_responses` columns.

### CTA → checkout flow

CTA buttons in `QuizResult.tsx` (`handleCTAClick`) link to a Greenn checkout URL and manually forward the page's current UTM query params via `window.location.href` navigation rather than relying on the anchor's default navigation or `target="_blank"`. This is deliberate: the injected Utmify pixel script (see below) can intercept/break the default click chain and popup blockers can kill a new tab, so the checkout redirect is driven directly in the click handler.

### Tracking

The funnel is split into two halves with **different, non-overlapping owners** for Meta Pixel/CAPI — this split is deliberate, not an oversight:

- **This site (quiz + result page, up to the CTA click)**: `QuizStart`, `QuizProgress`, `Lead`, `ViewContent`, `InitiateCheckout` (fired on the CTA click itself, before the user ever reaches Greenn). Owned entirely by this repo's Pixel/CAPI code below.
- **Greenn checkout (from the moment the user lands there onward)**: its own `InitiateCheckout` (fires when the buyer fills the checkout form — a distinct, later moment than our CTA-click one, kept intentionally as a separate signal), `AddToCart` (main product + order bumps), `AddPaymentInfo`, `Purchase`, `OrderBumpPurchase`. All fired natively by Greenn's own Meta Pixel + Conversions API integration, configured directly in Greenn's dashboard with its own Pixel ID/CAPI token — **not** by anything in this repo. `PageView`/`ViewContent` on the Greenn side are currently disabled there; "trial started"/"subscribe" fire there too even though this product has neither, a quirk of Greenn's fixed event set, not a bug in this repo.

**Do not build a Purchase (or InitiateCheckout-on-checkout) relay in this repo.** One existed briefly (`greenn-purchase-webhook`, a webhook-triggered CAPI relay) and was removed (2026-08-07) once it became clear Greenn already fires `Purchase`/`OrderBumpPurchase` natively — running both sent every sale to Meta twice, uncoordinated, corrupting conversion counts. If Greenn's native integration is ever disabled, that's the trigger to reconsider a webhook relay here, not before.

Three layers cover this site's half:

1. **Utmify** (`index.html`, first two `<script>` blocks) — kept installed only for Utmify's own attribution dashboard. Those two blocks are obfuscated loader snippets (base64 + XOR) that inject Utmify's real script tag — this is Utmify's official embed format, not custom obfuscation added by this project. Don't try to "clean up" or inline them. Utmify's own Meta Ads integration is deliberately left **off** (in Utmify's dashboard) to avoid a third uncoordinated source of `Purchase`-adjacent events; Greenn's webhook still feeds Utmify's own dashboard in parallel (a separate webhook URL from anything in this repo) purely for Utmify's reporting UI.
2. **Meta Pixel (browser)** — `index.html` (third `<script>` block, standard `fbq` loader only) + `src/lib/metaPixel.ts` (typed wrapper). `initMetaPixel()` (`fbq('init', ...)` + `PageView`) is called once from `src/main.tsx`, reading `VITE_META_PIXEL_ID` via `import.meta.env` — deliberately **not** via Vite's `%VAR%` HTML interpolation (tried first, reverted: it hard-fails the whole build if the var is missing in the build environment instead of degrading gracefully). Events fired from: `useQuiz.ts` (`QuizStart` in `startQuiz()`, `QuizProgress` at 25/50/75/100% thresholds in `nextQuestion()`, `Lead` in `submitUnlock()` once the DB insert succeeds — also where `setAdvancedMatching()` re-inits the pixel with the now-known email/phone/name), and `QuizResult.tsx` (`ViewContent` on mount, `InitiateCheckout` in `handleCTAClick`).
3. **Meta Conversions API (server-side)** — one Edge Function, `capi-relay`: called by the browser (fire-and-forget `fetch`, `keepalive: true` for the `InitiateCheckout` call since navigation follows immediately) to dual-fire `Lead`/`InitiateCheckout` server-side with the **same `event_id`** as the matching browser Pixel call, for Meta-side dedup. PII normalization/hashing goes through Meta's official `capi-param-builder-nodejs` (imported via Deno's `npm:` specifier — it's pure JS with its own SHA-256, no native deps, so it runs fine despite being published for Node), not a hand-rolled hash; the BR "55" country-code prefix is still added locally since the library only normalizes digits. Captures real client IP/User-Agent from the request. Uses default Supabase JWT verification (anon key is sufficient — no admin-role check, it's a best-effort tracking relay, not an admin function).

`src/lib/analytics.ts` (`trackQuizStart`, `trackQuizProgress`, `trackResultView`, `trackCTAClick`) remains no-op dead code for the functions Meta Pixel now covers — kept only so existing call sites don't need removing; new tracking work should go through `metaPixel.ts`, not this file. `cta_clicks` inserts (used by the admin funnel dashboard's CTA-click-rate metric) were restored directly in `handleCTAClick` in `QuizResult.tsx` (previously dead — the no-op `trackCTAClick` was the only call site).

**No PII in the Greenn checkout URL:** an earlier version of `handleCTAClick` appended name/email/phone/`event_id` as query params, intended to prefill Greenn's checkout form and improve match quality. Removed (2026-08-07): confirmed live that it doesn't prefill Greenn's form (tested against the real checkout, fields stayed empty regardless of param names tried), and it has no match-quality benefit either since Greenn's own tracking reads from its own checkout form fields, not the URL. It was also a needless PII-in-query-string exposure. Only UTM passthrough remains on that redirect.

### Supabase backend

- `src/integrations/supabase/client.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only, never the service role key).
- `supabase/migrations/` — schema history; `combined_schema.sql` at repo root is a flattened reference snapshot of the schema (tables, RLS policies), not something migrations are generated from.
- Tables (`quiz_responses`, `quiz_submissions`, `quiz_starts`, `cta_clicks`, `user_roles`) all have RLS enabled. Public/anon access is **insert-only** (`Anyone can insert ...` policies) — there is no public `SELECT`, `UPDATE`, or `DELETE` policy on any of them. All reads, updates, and deletes for the admin panel go through Edge Functions using the service-role key, never the anon client directly.
- `purchases` (added 2026-08-07) is different from the tables above: RLS enabled with **no policies at all** for anon/authenticated — not even insert. Only the service-role key (inside `greenn-sales-webhook`/`get-sales-metrics`) ever touches it, since it's written by a webhook the browser never calls directly.
- `supabase/functions/` — admin Edge Functions: `get-quiz-responses`, `update-quiz-response`, `delete-quiz-response`, `reset-quiz-data`, `get-funnel-metrics`, `get-sales-metrics`. Plus two tracking/data-relay functions that deliberately do **not** follow the admin pattern below: `capi-relay` (called by the browser, default JWT verification, no admin-role check) and `greenn-sales-webhook` (called by Greenn, no JWT at all — `verify_jwt = false` in `supabase/config.toml` — authorized by a `GREENN_SALES_WEBHOOK_SECRET` query-string token instead, same pattern the old `greenn-purchase-webhook` used before it was removed). See Tracking above.

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
- **Meta Pixel + CAPI:** implemented (2026-08-06), scope corrected (2026-08-07) after learning Greenn already fires `InitiateCheckout`/`AddToCart`/`AddPaymentInfo`/`Purchase`/`OrderBumpPurchase` natively — see Tracking above for the current split of ownership. Don't re-add a Purchase relay here without first confirming Greenn's native integration is actually off.
- **Consent scope for Advanced Matching:** the mandatory `privacyConsent` checkbox copy in `QuizEmail.tsx` authorizes data use "para gerar e disponibilizar o diagnóstico," not explicitly ad-platform PII sharing. Advanced Matching/CAPI is standard practice for Meta advertisers and this site already runs the Meta ecosystem via Utmify, but confirm the linked privacy policy (`PRIVACY_POLICY_URL` in `phoneUtils.ts`) covers this use if it ever comes into question.

## Security notes

- `.env` and `supabase/.temp/` are gitignored and untracked (cleaned up 2026-08-06). `.env` previously held the anon/publishable key (not service-role) in git history on this public repo — low practical risk given RLS, but never re-add these paths to tracking.
- Do not add a public `SELECT`/`UPDATE`/`DELETE` RLS policy to `quiz_responses`/`quiz_submissions`/`cta_clicks`/`quiz_starts` — all reads/writes beyond insert must go through an Edge Function with the admin-role check above.
- `META_CAPI_ACCESS_TOKEN` and `GREENN_SALES_WEBHOOK_SECRET` are Edge Function secrets only (`supabase secrets set`) — never put them in `.env`, client code, or a `VITE_`-prefixed var. `META_PIXEL_ID` is also set as an Edge Function secret (separate from the client's `VITE_META_PIXEL_ID`, same value) since Deno Edge Functions don't read Vite's `.env`.
- Never put personal data (name/email/phone) in a URL query string, including the Greenn checkout redirect — see the "No PII in the Greenn checkout URL" note under Tracking.
