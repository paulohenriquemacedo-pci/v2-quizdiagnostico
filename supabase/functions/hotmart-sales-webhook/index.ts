// Receives Hotmart's purchase webhook and stores it in our own `purchases` table ONLY — this is
// deliberately NOT a Meta CAPI relay. Before ever building one here, confirm whether Hotmart's own
// native Pixel/CAPI integration for this product is active — a second relay to the same
// destination has double-counted sales to Meta twice before in this project (see CLAUDE.md
// "Tracking", greenn-purchase-webhook history). This function exists purely to feed our own admin
// "Vendas" panel (get-sales-metrics).
//
// Auth: Hotmart delivers its account-specific verification token ("Hottok") inside the JSON body
// itself (field `hottok`), not as a header or query param. Compare it against the HOTMART_HOTTOK
// secret — get the real value from this product's Webhook settings screen in Hotmart and set it
// with `supabase secrets set HOTMART_HOTTOK=...`.
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface HotmartPurchasePayload {
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

// Hotmart's event/status vocabulary -> the internal status vocabulary get-sales-metrics expects
// (kept identical to what greenn-sales-webhook produced, so get-sales-metrics needed zero changes).
function normalizeStatus(event: string | undefined, rawStatus: string | undefined): string {
  const key = (event || rawStatus || '').toUpperCase();
  if (key.includes('APPROVED') || key.includes('COMPLETE')) return 'paid';
  if (key.includes('CHARGEBACK') || key.includes('PROTEST')) return 'chargedback';
  if (key.includes('REFUND')) return 'refunded';
  if (key.includes('CANCEL') || key.includes('EXPIRED')) return 'refused';
  if (key.includes('BILLET') || key.includes('DELAYED')) return 'waiting_payment';
  return 'created';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as HotmartPurchasePayload;

    const expectedToken = Deno.env.get('HOTMART_HOTTOK');
    if (!expectedToken || body.hottok !== expectedToken) {
      console.error('[hotmart-sales-webhook] Invalid or missing hottok');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const purchase = body.data?.purchase;
    const buyer = body.data?.buyer;
    const product = body.data?.product;

    if (!purchase && !body.event) {
      return new Response(JSON.stringify({ error: 'Missing purchase data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const saleId = purchase?.transaction ?? null;
    const amount = purchase?.price?.value ?? purchase?.full_price?.value ?? 0;
    const saleCreatedAtMs = purchase?.approved_date ?? purchase?.order_date;

    const { error } = await adminClient.from('purchases').upsert(
      {
        sale_id: saleId,
        status: normalizeStatus(body.event, purchase?.status),
        email: buyer?.email ?? null,
        name: buyer?.name ?? null,
        phone: buyer?.checkout_phone ?? null,
        amount,
        product_name: product?.name ?? null,
        sale_created_at: saleCreatedAtMs ? new Date(saleCreatedAtMs).toISOString() : null,
        updated_at: new Date().toISOString(),
        raw_payload: body,
      },
      { onConflict: 'sale_id' }
    );

    if (error) {
      console.error('[hotmart-sales-webhook] Insert error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[hotmart-sales-webhook] Recorded sale (event=${body.event}, sale_id=${saleId})`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[hotmart-sales-webhook] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
