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
// Payload parsing lives in parsePayload.ts, not here — see that file for the field-mapping caveats
// (unverified against a real payload) and for why it's kept separate from this HTTP/auth/DB layer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  HotmartPurchasePayload,
  hasPurchaseData,
  isHottokValid,
  parseHotmartPayload,
} from './parsePayload.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as HotmartPurchasePayload;

    if (!isHottokValid(body, Deno.env.get('HOTMART_HOTTOK'))) {
      console.error('[hotmart-sales-webhook] Invalid or missing hottok');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!hasPurchaseData(body)) {
      return new Response(JSON.stringify({ error: 'Missing purchase data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sale = parseHotmartPayload(body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await adminClient.from('purchases').upsert(
      {
        ...sale,
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

    console.log(`[hotmart-sales-webhook] Recorded sale (event=${body.event}, sale_id=${sale.sale_id})`);

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
