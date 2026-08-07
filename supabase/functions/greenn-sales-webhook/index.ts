// Receives Greenn's sale-status-change webhook and stores it in our own `purchases` table
// ONLY — this is deliberately NOT a Meta CAPI relay (see CLAUDE.md "Tracking": Greenn already
// fires Purchase/OrderBumpPurchase to Meta natively, a second relay here would double-count).
// This function exists purely to feed our own admin "Vendas" panel (get-sales-metrics).
//
// Greenn calls this directly (no Supabase session), so auth is a shared secret in the query
// string (?token=...), same pattern as the tracking-relay functions — not the JWT + admin-role
// pattern used by the admin functions.
//
// NOTE: `sale.amount` unit (reais vs centavos) is unconfirmed against a real Greenn payload —
// assumed centavos (divided by 100), matching most BR gateways. Verify before trusting values.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GreennSalePayload {
  sale?: {
    id?: string | number;
    transaction_id?: string;
    code?: string;
    status?: string;
    amount?: number;
    created_at?: string;
  };
  client?: {
    name?: string;
    email?: string;
    cellphone?: string;
  };
  product?: {
    name?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const expectedToken = Deno.env.get('GREENN_SALES_WEBHOOK_SECRET');

  if (!expectedToken || token !== expectedToken) {
    console.error('[greenn-sales-webhook] Invalid or missing token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as GreennSalePayload;
    const sale = body.sale;

    if (!sale?.status) {
      return new Response(JSON.stringify({ error: 'Missing sale.status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const saleId = sale.id ?? sale.transaction_id ?? sale.code;
    const amountCentavos = sale.amount ?? 0;

    const { error } = await adminClient.from('purchases').upsert(
      {
        sale_id: saleId ? String(saleId) : null,
        status: sale.status,
        email: body.client?.email ?? null,
        name: body.client?.name ?? null,
        phone: body.client?.cellphone ?? null,
        amount: amountCentavos / 100,
        product_name: body.product?.name ?? null,
        sale_created_at: sale.created_at ?? null,
        updated_at: new Date().toISOString(),
        raw_payload: body,
      },
      { onConflict: 'sale_id' }
    );

    if (error) {
      console.error('[greenn-sales-webhook] Insert error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[greenn-sales-webhook] Recorded sale (status=${sale.status}, sale_id=${saleId})`);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[greenn-sales-webhook] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
