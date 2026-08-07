// Receives Greenn's sale-status-change webhook and relays paid sales to Meta CAPI as Purchase.
// Greenn calls this directly (no Supabase session), so auth is a shared secret in the query
// string (?token=...) rather than the JWT + admin-role pattern used by the admin functions —
// this endpoint is deliberately public-but-secret, not a Supabase-authenticated admin function.
//
// NOTE: `sale.amount` unit (reais vs centavos) has not been confirmed against a real Greenn
// payload yet. This assumes centavos (divides by 100), matching most BR payment gateways —
// verify against a real "paid" webhook delivery before trusting reported Purchase values.

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function toE164BR(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  return `55${digits}`;
}

function extractMetaValue(saleMetas: unknown, key: string): string | undefined {
  if (!Array.isArray(saleMetas)) return undefined;
  for (const entry of saleMetas) {
    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const entryKey = record.key ?? record.name;
      if (entryKey === key && typeof record.value === 'string') {
        return record.value;
      }
    }
  }
  return undefined;
}

interface GreennSalePayload {
  type?: string;
  event?: string;
  sale?: {
    id?: string | number;
    transaction_id?: string;
    code?: string;
    status?: string;
    amount?: number;
    created_at?: string;
    updated_at?: string;
  };
  client?: {
    name?: string;
    email?: string;
    cellphone?: string;
  };
  product?: {
    id?: string | number;
    name?: string;
  };
  saleMetas?: unknown;
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
  const expectedToken = Deno.env.get('GREENN_WEBHOOK_SECRET');

  if (!expectedToken || token !== expectedToken) {
    console.error('[greenn-purchase-webhook] Invalid or missing token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as GreennSalePayload;
    const sale = body.sale;
    const client = body.client;
    const product = body.product;

    if (sale?.status !== 'paid') {
      console.log(`[greenn-purchase-webhook] Skipping non-paid status: ${sale?.status}`);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pixelId = Deno.env.get('META_PIXEL_ID');
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');

    if (!pixelId || !accessToken) {
      console.error('[greenn-purchase-webhook] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN secret');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prefer a stable transaction identifier so Greenn retries don't double-count in Meta
    // (Meta dedupes on event_id automatically); fall back to a deterministic hash of sale
    // details so identical retried payloads still produce the same event_id.
    const transactionId = sale.id ?? sale.transaction_id ?? sale.code;
    const eventId = transactionId
      ? `greenn-${transactionId}`
      : await sha256Hex(`${client?.email ?? ''}|${sale.created_at ?? ''}|${product?.id ?? ''}`);

    const userData: Record<string, unknown> = {};
    if (client?.email) userData.em = [await sha256Hex(normalizeEmail(client.email))];
    if (client?.cellphone) userData.ph = [await sha256Hex(toE164BR(client.cellphone))];
    if (client?.name) {
      const nameParts = client.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0]?.toLowerCase();
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : undefined;
      if (firstName) userData.fn = [await sha256Hex(firstName)];
      if (lastName) userData.ln = [await sha256Hex(lastName)];
    }

    const amountCentavos = sale.amount ?? 0;
    const value = amountCentavos / 100;

    const eventSourceUrl = extractMetaValue(body.saleMetas, 'event_source_url') ?? 'https://payfast.greenn.com.br/';

    const capiPayload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'system_generated',
          event_source_url: eventSourceUrl,
          user_data: userData,
          custom_data: {
            value,
            currency: 'BRL',
            content_name: product?.name,
          },
        },
      ],
    };

    const graphResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiPayload),
      }
    );

    const graphResult = await graphResponse.json().catch(() => null);

    if (!graphResponse.ok) {
      console.error('[greenn-purchase-webhook] Graph API error:', graphResponse.status, JSON.stringify(graphResult));
    } else {
      console.log(`[greenn-purchase-webhook] Forwarded Purchase (event_id=${eventId}, value=${value})`);
    }

    return new Response(JSON.stringify({ received: true, forwarded: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[greenn-purchase-webhook] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
