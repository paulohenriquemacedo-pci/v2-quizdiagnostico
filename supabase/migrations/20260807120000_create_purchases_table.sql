-- Sales data from Greenn's webhook, captured purely for our own admin dashboard (revenue by
-- UTM campaign, ARPU, sales/pending/refused counts). This does NOT relay anything to Meta —
-- Greenn already fires Purchase/OrderBumpPurchase to Meta natively via its own Pixel/CAPI
-- integration (see CLAUDE.md "Tracking"). Only the greenn-sales-webhook Edge Function
-- (service-role key) writes here; there is no public insert policy, unlike quiz_responses/
-- cta_clicks/quiz_starts which the anon client inserts directly.
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id TEXT UNIQUE,
  status TEXT NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  amount NUMERIC(10, 2),
  product_name TEXT,
  sale_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_email ON public.purchases (email);
CREATE INDEX idx_purchases_status ON public.purchases (status);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies for anon/authenticated roles — only the service-role key
-- (bypasses RLS, used inside greenn-sales-webhook and get-sales-metrics) can read or write.
