-- Adds utm_content/utm_term/fbclid capture, missing until now, to the three funnel tables that
-- already track utm_source/utm_medium/utm_campaign. Nullable, no RLS changes needed — the
-- existing insert-only anon policies already cover new nullable columns.
ALTER TABLE public.quiz_starts
  ADD COLUMN utm_content TEXT,
  ADD COLUMN utm_term TEXT,
  ADD COLUMN fbclid TEXT;

ALTER TABLE public.quiz_responses
  ADD COLUMN utm_content TEXT,
  ADD COLUMN utm_term TEXT,
  ADD COLUMN fbclid TEXT;

ALTER TABLE public.cta_clicks
  ADD COLUMN utm_content TEXT,
  ADD COLUMN utm_term TEXT,
  ADD COLUMN fbclid TEXT;
