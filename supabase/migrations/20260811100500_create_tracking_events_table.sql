-- Server-side audit log of every event capi-relay sends to the Meta Conversions API — lets us
-- inspect Event Match Quality inputs and Graph API responses after the fact, since capi-relay
-- itself never persisted anything before this. Same trust/RLS posture as `purchases`: only the
-- service-role key (from inside capi-relay) ever writes here, no anon/authenticated access at all.
CREATE TABLE public.tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  fbp TEXT,
  fbc TEXT,
  fbclid TEXT,
  client_ip TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  external_id TEXT,
  value NUMERIC(10, 2),
  currency TEXT,
  meta_success BOOLEAN NOT NULL,
  meta_error TEXT,
  request_payload JSONB,
  response_payload JSONB
);

CREATE INDEX idx_tracking_events_event_id ON public.tracking_events (event_id);
CREATE INDEX idx_tracking_events_created_at ON public.tracking_events (created_at);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies for anon/authenticated — only the service-role key touches this table.
