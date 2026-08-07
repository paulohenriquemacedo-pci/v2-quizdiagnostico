-- Store the full raw Greenn webhook body alongside the parsed columns. The first real webhook
-- delivery (2026-08-07) revealed our `sale.amount` interpretation is wrong (recorded R$0.14 for
-- a real ~R$11.83-R$36.90 order) and that order bumps arrive as separate sale_ids that may not
-- even be configured to hit this webhook — this column lets us inspect the ground truth directly
-- via SQL instead of guessing from incomplete public docs.
ALTER TABLE public.purchases ADD COLUMN raw_payload JSONB;
