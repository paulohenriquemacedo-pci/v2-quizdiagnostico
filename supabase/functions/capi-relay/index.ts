// Relays Lead/InitiateCheckout events from the browser to the Meta Conversions API,
// mirroring the same event_id used by the client-side Pixel call for deduplication.
//
// PII normalization/hashing uses Meta's official Conversions API Parameter Builder
// (https://github.com/facebook/capi-param-builder) instead of a hand-rolled SHA-256,
// so it stays aligned with Meta's exact normalization rules. It's a pure-JS package
// (own SHA-256 implementation, no native deps), which is why it works via Deno's npm
// specifier support in this Edge Function despite being published for Node.
import { ParamBuilder, PII_DATA_TYPE } from 'npm:capi-param-builder-nodejs@1.3.1';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';

  const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const isCustomDomain = /^https:\/\/([a-z0-9-]+\.)*sistemaacademia\.com\.br$/.test(origin);

  const allowedOrigin = isLocalhost || isCustomDomain
    ? origin
    : 'https://quiz.sistemaacademia.com.br';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

// The param builder normalizes phone digits but doesn't add a country code — BR numbers
// are captured as 10-11 digits (DDD + number), so the "55" prefix still has to be ours.
function toE164BR(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  return `55${digits}`;
}

interface CapiRelayRequestBody {
  event_name: 'Lead' | 'InitiateCheckout';
  event_id: string;
  email?: string;
  phone?: string;
  name?: string;
  value?: number;
  content_name?: string;
  fbp?: string;
  fbc?: string;
  event_source_url: string;
  /** Meta Events Manager "Test Events" code (e.g. "TEST12345") — optional, omitted in production traffic. */
  test_event_code?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as CapiRelayRequestBody;

    if (body.event_name !== 'Lead' && body.event_name !== 'InitiateCheckout') {
      return new Response(JSON.stringify({ error: 'Invalid event_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.event_id || !body.event_source_url) {
      return new Response(JSON.stringify({ error: 'Missing event_id or event_source_url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pixelId = Deno.env.get('META_PIXEL_ID');
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');

    if (!pixelId || !accessToken) {
      console.error('[capi-relay] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN secret');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Fresh instance per request — Edge Function isolates can be reused across invocations,
    // and ParamBuilder isn't meant to hold state across unrelated requests/users.
    const paramBuilder = new ParamBuilder();

    const userData: Record<string, unknown> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      fbp: body.fbp,
      fbc: body.fbc,
    };

    if (body.email) {
      const hashed = paramBuilder.getNormalizedAndHashedPII(body.email, PII_DATA_TYPE.EMAIL);
      if (hashed) userData.em = [hashed];
    }
    if (body.phone) {
      const hashed = paramBuilder.getNormalizedAndHashedPII(toE164BR(body.phone), PII_DATA_TYPE.PHONE);
      if (hashed) userData.ph = [hashed];
    }
    if (body.name) {
      const nameParts = body.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;
      if (firstName) {
        const hashed = paramBuilder.getNormalizedAndHashedPII(firstName, PII_DATA_TYPE.FIRST_NAME);
        if (hashed) userData.fn = [hashed];
      }
      if (lastName) {
        const hashed = paramBuilder.getNormalizedAndHashedPII(lastName, PII_DATA_TYPE.LAST_NAME);
        if (hashed) userData.ln = [hashed];
      }
    }

    const customData: Record<string, unknown> = {};
    if (body.value !== undefined) {
      customData.value = body.value;
      customData.currency = 'BRL';
    }
    if (body.content_name) customData.content_name = body.content_name;

    const capiPayload: Record<string, unknown> = {
      data: [
        {
          event_name: body.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: body.event_id,
          action_source: 'website',
          event_source_url: body.event_source_url,
          user_data: userData,
          custom_data: customData,
        },
      ],
    };
    if (body.test_event_code) capiPayload.test_event_code = body.test_event_code;

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
      console.error('[capi-relay] Graph API error:', graphResponse.status, JSON.stringify(graphResult));
    } else {
      console.log(`[capi-relay] Forwarded ${body.event_name} (event_id=${body.event_id})`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[capi-relay] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
