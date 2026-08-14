-- tracking_events was created (20260811100500) to audit events capi-relay sent to the Meta
-- Conversions API. capi-relay was deleted the same day as part of the full tracking teardown, and
-- nothing has written to this table since — it's dead schema. Dropping it now as part of cleaning
-- up orphaned tracking infrastructure (see CLAUDE.md Tracking section).
DROP TABLE IF EXISTS public.tracking_events;
