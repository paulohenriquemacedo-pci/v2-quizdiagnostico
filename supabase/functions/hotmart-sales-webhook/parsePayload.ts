// Pure transformation: Hotmart's webhook payload -> the shape `purchases` expects. Kept separate
// from index.ts (auth, HTTP, DB) so the next time the checkout provider changes (this project has
// swapped once already, Greenn -> Hotmart), only this file needs replacing — the rest of the
// function (hottok-equivalent auth, upsert-by-sale_id, error handling) doesn't need touching.
//
// NOTE: the field mapping below (buyer/purchase/product paths, amount unit) is built from
// Hotmart's public Webhook 2.0 documentation but is UNVERIFIED against a real payload from this
// account — the exact same situation Greenn's webhook was in before its first real delivery
// revealed a wrong amount interpretation (see the raw_payload migration's commit message). Use
// Hotmart's "Enviar teste" button on the Webhook settings screen to fire a real test event at this
// endpoint, then inspect the `raw_payload` column of the row it creates in `purchases` to
// confirm/correct the paths below before trusting the sales panel numbers. Unlike Greenn (which
// sent amount in centavos), Hotmart's price fields are already in the currency's normal decimal
// unit (e.g. 97.00 for R$97) — do NOT divide by 100 here.

export interface HotmartPurchasePayload {
  event?: string;
  data?: {
    product?: { name?: string };
    buyer?: { name?: string; email?: string; checkout_phone?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      price?: { value?: number };
      full_price?: { value?: number };
      order_date?: number;
      approved_date?: number;
    };
  };
  hottok?: string;
}

export interface NormalizedSale {
  sale_id: string | null;
  status: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  amount: number;
  product_name: string | null;
  sale_created_at: string | null;
}

// Hotmart's event/status vocabulary -> the internal status vocabulary get-sales-metrics expects
// (kept identical to what greenn-sales-webhook produced, so get-sales-metrics needed zero changes
// when the provider switched, and won't need changes again if it switches once more).
export function normalizeStatus(event: string | undefined, rawStatus: string | undefined): string {
  const key = (event || rawStatus || '').toUpperCase();
  if (key.includes('APPROVED') || key.includes('COMPLETE')) return 'paid';
  if (key.includes('CHARGEBACK') || key.includes('PROTEST')) return 'chargedback';
  if (key.includes('REFUND')) return 'refunded';
  if (key.includes('CANCEL') || key.includes('EXPIRED')) return 'refused';
  if (key.includes('BILLET') || key.includes('DELAYED')) return 'waiting_payment';
  return 'created';
}

export function isHottokValid(body: HotmartPurchasePayload, expectedToken: string | undefined): boolean {
  return Boolean(expectedToken) && body.hottok === expectedToken;
}

export function hasPurchaseData(body: HotmartPurchasePayload): boolean {
  return Boolean(body.data?.purchase || body.event);
}

export function parseHotmartPayload(body: HotmartPurchasePayload): NormalizedSale {
  const purchase = body.data?.purchase;
  const buyer = body.data?.buyer;
  const product = body.data?.product;

  const saleCreatedAtMs = purchase?.approved_date ?? purchase?.order_date;

  return {
    sale_id: purchase?.transaction ?? null,
    status: normalizeStatus(body.event, purchase?.status),
    email: buyer?.email ?? null,
    name: buyer?.name ?? null,
    phone: buyer?.checkout_phone ?? null,
    amount: purchase?.price?.value ?? purchase?.full_price?.value ?? 0,
    product_name: product?.name ?? null,
    sale_created_at: saleCreatedAtMs ? new Date(saleCreatedAtMs).toISOString() : null,
  };
}
