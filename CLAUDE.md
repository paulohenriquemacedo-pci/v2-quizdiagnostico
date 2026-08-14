# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quiz diagnóstico comportamental (Sistema A.C.A.D.E.M.I.A) — identifica o perfil dominante de travamento acadêmico de pesquisadores de pós-graduação em ~3 minutos, captura lead (nome/e-mail/telefone) e conduz ao checkout de um produto (Hotmart). Produção: `https://quiz.sistemaacademia.com.br` (admin em `/admin`).

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

**Package manager:** npm (`npm install`) — the only lockfile in the repo. `bun.lock` existed from past drift and was removed 2026-08-14; don't recreate it.

Debug the result screen without completing the quiz: `http://localhost:8080/?debug=result&profile=A` (profiles: `A`–`F`).

Required `.env` (never commit — see Security below):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```
The Hotmart sales-webhook secret (`HOTMART_HOTTOK`) is **not** an env var — it's a Supabase Edge Function secret only (see Tracking below).

## Architecture

### Quiz funnel (state machine in `src/hooks/useQuiz.ts`)

Single hook drives the whole funnel through `QuizState.step`: `start → context → questions → email → result`. Progress persists to `localStorage` (key `quiz_progress`) on every change except while `step === 'result'`; unlock status persists to `sessionStorage` (`quiz_unlocked_session`) so a completed diagnosis survives a refresh without re-submitting.

Scoring pipeline: `src/data/questions.ts` (each question tagged with a `ProfileCode` A–F) → `src/lib/scoring.ts` (`calculateResult` sums per-category scores, picks the dominant profile plus any secondary profiles scoring ≥5) → `src/data/profiles.ts` / `profileResults.ts` / `profileSummaries.ts` supply the display copy, descriptions and long-form result text rendered by `QuizResult.tsx`. When editing quiz content or result copy, these data files are the source of truth — not the components.

Lead capture only happens at `submitUnlock` (in `useQuiz.ts`), which calls `submitQuizToDatabase` (`src/lib/api.ts`). This function requires `privacyConsent === true` before it will insert, and does a defensive two-step insert: it first tries the full row (with consent columns), and if Supabase reports a missing column/schema-cache error it retries with a legacy payload — this exists because the remote schema may lag behind local migrations for the consent columns added in `20260804160000_add_consent_columns_to_quiz_responses.sql`. Keep both payload shapes in sync if you change `quiz_responses` columns.

### CTA → checkout flow

Every checkout link on the site renders through `<CheckoutCTA>` (`src/components/Quiz/CheckoutCTA.tsx`), not a raw `<a>` — this is the single place that knows how to build the checkout URL and how to fire the click-tracking event; a new CTA elsewhere in the app should import it rather than hand-rolling an anchor. `CHECKOUT_URL` and `getFinalCheckoutUrl()` (merges the page's current UTM/click-id query params into the checkout URL, preserving whatever params the checkout URL itself already has, e.g. `checkoutMode`) live in `src/config/checkout.ts` — this is the one place to change when the checkout provider changes (it already has once: Greenn → Hotmart, 2026-08-14).

**The click is a real, native `<a>` navigation — `CheckoutCTA` deliberately never calls `preventDefault()`.** An earlier version of this flow intercepted the click and redirected via `window.location.href` (reasoning: defend against injected third-party scripts breaking the click chain). That turned out to break the exact category of integration it needed to support: LowTrack's `pixel.js` relies on detecting a genuine browser-native click-through to the checkout domain to fire `InitiateCheckout`, and a synthetic `window.location.href` assignment doesn't produce that. If click-based third-party tracking is added again in the future and needs to survive a page unload, prefer `navigator.sendBeacon` for the first-party insert over intercepting the click.

### Tracking

Current state (2026-08-14): **LowTrack** is the only active third-party script, loaded via a plain `<script>` block in `index.html` (`window.pixelId = "lt_px_..."`, loads `https://lowtrack.com.br/pixel.js`). A Meta Pixel base snippet was added 2026-08-13 for an initial test phase and removed the same day at the user's request — check git history (`feat(tracking): add Meta Pixel base code` / `chore(tracking): remove Meta Pixel base code`) if it needs reinstating. Before that, **all third-party tracking was deliberately removed on 2026-08-11** — the prior Meta Pixel, the Meta Conversions API relay (`capi-relay` Edge Function), and both Utmify `<script>` blocks — as a full reset before rebuilding from scratch; search git history for `capi-relay`, `metaPixel.ts`, "Utmify Pixel Script" if you need the prior implementation's shape (a fairly complete Meta Pixel + CAPI dual-fire setup with Advanced Matching, verified working at EMQ 6–9/10, torn out intentionally, not because it was broken).

**LowTrack's `InitiateCheckout` detection is click-based and automatic, not called from this repo's code** — confirmed working after the `CheckoutCTA` native-navigation fix above, but its exact detection mechanism (domain allowlist configured in LowTrack's dashboard? a generic outbound-link listener?) is opaque from this repo, since `lowtrack.com.br` blocks automated fetches (403). If a future checkout provider change stops IC from firing again, check `CheckoutCTA`'s native-navigation behavior first (that's the part this repo controls) before assuming LowTrack's own config needs updating.

**`src/lib/events.ts`** is the single home for every first-party funnel event (`quiz_starts`, `cta_clicks` inserts) — before 2026-08-14 these lived scattered across a dead no-op `analytics.ts`, a separate `trackQuizStart.ts` module, and an inline insert in `QuizResult.tsx`, with no shared contract. `trackQuizStarted()` and `trackCtaClicked()` both call a `fireThirdPartyEvent()` stub (currently no-op) — wire a real call there once a platform's manual event-firing API is confirmed, instead of touching every call site again. `trackCtaClicked()` takes an `isDebugMode` flag and no-ops entirely when true — the `?debug=result&profile=X` shortcut (see Commands above) must never write to `cta_clicks`; it already polluted that table once, during tracking tests, before this guard existed.

`src/lib/attribution.ts` is unchanged: `captureAttributionFromUrl()` (called once from `main.tsx`) persists `utm_source`/`utm_medium`/`utm_campaign`/`utm_content`/`utm_term`/`fbclid` into `localStorage` (first-touch-wins); `getAttribution()` reads it back anywhere; `getFbcWithFallback()` reconstructs a Meta-format `fbc` from `fbclid` — still unused (no CAPI relay exists), kept ready for if one is built.

The Vendas panel (`purchases` table, `hotmart-sales-webhook`, `get-sales-metrics`, `Admin.tsx`'s "Vendas" section) never sent anything to Meta to begin with — see the dedicated section below.

**Do not build a Purchase (or InitiateCheckout-on-checkout) relay in this repo** without first confirming whether the checkout provider's own native Pixel/CAPI integration is active (configured in that provider's own dashboard, not this repo). This has bitten the project twice already with a prior checkout provider (Greenn): a webhook-based relay (`greenn-purchase-webhook`) was built and removed twice because running it alongside the provider's native integration double-counted every sale to Meta. Hotmart's own native tracking/pixel setup for this product hasn't been audited from this repo — check it before wiring any Purchase-type event here.

`src/lib/analytics.ts` (`trackQuizProgress`, `trackQuizComplete`, `trackResultView`) is intentionally-disabled instrumentation for behavioral remarketing (e.g. "reached 75% of the quiz but never unlocked") that's been discussed but never given a destination or an identifier (email/phone) to act on — see the file's header comment before wiring these up. `trackQuizStart`/`trackCTAClick` used to also live here as no-ops that shadowed the real, working implementations in `events.ts`; they were removed 2026-08-14 since that duplication was actively confusing.

### Supabase backend

- `src/integrations/supabase/client.ts` — the browser client, built from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only, never the service role key).
- `supabase/migrations/` — schema history; `combined_schema.sql` at repo root is a flattened reference snapshot of the schema (tables, RLS policies), not something migrations are generated from.
- Tables (`quiz_responses`, `quiz_submissions`, `quiz_starts`, `cta_clicks`, `user_roles`) all have RLS enabled. Public/anon access is **insert-only** (`Anyone can insert ...` policies) — there is no public `SELECT`, `UPDATE`, or `DELETE` policy on any of them. All reads, updates, and deletes for the admin panel go through Edge Functions using the service-role key, never the anon client directly.
- `purchases` (added 2026-08-07, checkout provider swapped from Greenn to Hotmart 2026-08-14) is different from the tables above: RLS enabled with **no policies at all** for anon/authenticated — not even insert. Only the service-role key (inside `hotmart-sales-webhook`/`get-sales-metrics`) ever touches it, since it's written by a webhook the browser never calls directly.
- `supabase/functions/` — admin Edge Functions: `get-quiz-responses`, `update-quiz-response`, `delete-quiz-response`, `reset-quiz-data`, `get-funnel-metrics`, `get-sales-metrics`. Plus one data-relay function that deliberately does **not** follow the admin pattern below: `hotmart-sales-webhook` (called by Hotmart, no JWT at all — `verify_jwt = false` in `supabase/config.toml` — authorized by comparing the `hottok` field Hotmart sends inside the JSON body against a `HOTMART_HOTTOK` secret, not a query-string token). See Tracking above and the Sales panel section below.

#### Sales panel (`purchases` table + `hotmart-sales-webhook` + `get-sales-metrics`)

Added 2026-08-07 so the admin panel could show revenue/sales data without touching Meta at all — deliberately separate from anything CAPI-related, to avoid ever re-creating the double-Purchase-to-Meta problem noted above. `hotmart-sales-webhook/index.ts` handles only auth (hottok) + HTTP + the upsert; the actual payload parsing (Hotmart's payload shape -> the `purchases` row shape, including the `event`/`status` vocabulary normalization to `paid`/`waiting_payment`/`refused`/`refunded`/`chargedback`/`created`) lives in the sibling `parsePayload.ts`, kept separate on purpose so the next provider swap only requires replacing that one file. It upserts keyed by `sale_id` (Hotmart's `transaction` code), so repeated webhook deliveries for the same sale — approved → refunded → chargeback, etc. — update one row instead of creating duplicates. It never calls the Graph API. `get-sales-metrics` (admin-auth pattern) reads `purchases` + `quiz_responses`, and attributes revenue to a UTM campaign by **joining on email** — the webhook doesn't reliably carry UTM data itself, but we already have it captured at lead time in `quiz_responses`. The field mapping in `hotmart-sales-webhook` (buyer/purchase/product paths, and treating `price.value` as already being in reais, not centavos) is built from Hotmart's public docs but **unconfirmed against a real payload from this account** — the exact situation that previously produced a wrong Greenn amount interpretation (see the `raw_payload` column, kept for this reason). Use Hotmart's "Enviar teste" button on the Webhook settings screen and check the resulting row's `raw_payload` before trusting the revenue figures the sales panel shows. `reset-quiz-data` includes `purchases` in its default/whitelisted table list, and `Admin.tsx` has a "Vendas" section (revenue, ARPU, pending/refused/refunded counts, revenue-by-campaign table) alongside the existing funnel metrics.

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
- **Third-party event wiring:** `fireThirdPartyEvent()` in `src/lib/events.ts` is a no-op stub. LowTrack's `InitiateCheckout` fires on its own (click-based, automatic), but there's no manual-fire call anywhere yet — if a `Lead` event (on successful quiz unlock) or a `Purchase`-adjacent event is ever wanted, confirm the platform's manual event API first, then wire it into that one function.
- **`analytics.ts`'s three remaining placeholders** (`trackQuizProgress`, `trackQuizComplete`, `trackResultView`) still have no destination or identifier — see that file's header. Needed for the "75%-quiz-no-checkout" / "unlocked-no-purchase" remarketing use case the user has described wanting, but requires a product decision (where does this data go, and does it carry email/phone) before implementing.
- **Consent scope for Advanced Matching:** if/when Advanced Matching or CAPI PII sharing is reintroduced, note the mandatory `privacyConsent` checkbox copy in `QuizEmail.tsx` authorizes data use "para gerar e disponibilizar o diagnóstico," not explicitly ad-platform PII sharing. Confirm the linked privacy policy (`PRIVACY_POLICY_URL` in `phoneUtils.ts`) covers that use if it ever comes into question.

## Security notes

- `.env` and `supabase/.temp/` are gitignored and untracked (cleaned up 2026-08-06). `.env` previously held the anon/publishable key (not service-role) in git history on this public repo — low practical risk given RLS, but never re-add these paths to tracking.
- Do not add a public `SELECT`/`UPDATE`/`DELETE` RLS policy to `quiz_responses`/`quiz_submissions`/`cta_clicks`/`quiz_starts` — all reads/writes beyond insert must go through an Edge Function with the admin-role check above.
- `HOTMART_HOTTOK` is an Edge Function secret only (`supabase secrets set`) — never put it in `.env`, client code, or a `VITE_`-prefixed var.
- Never put personal data (name/email/phone) in a URL query string, including the checkout redirect — a prior version of `handleCTAClick` appended name/email/phone as query params to try to prefill the checkout provider's form; removed 2026-08-07 after confirming live it didn't prefill anything and was just needless PII exposure.
