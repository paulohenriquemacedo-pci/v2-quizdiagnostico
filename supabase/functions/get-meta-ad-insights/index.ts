import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface MetaInsightsRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  reach?: string;
}

interface CampaignInsight {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
}

// Follows Meta's paging.next cursor defensively — campaign-level insights over a short date
// range is usually one page, but don't assume it for accounts with many campaigns.
async function fetchAllPages(url: string): Promise<MetaInsightsRow[]> {
  const all: MetaInsightsRow[] = [];
  let next: string | null = url;
  let safety = 20; // prevent runaway pagination on a buggy/unexpected response
  while (next && safety-- > 0) {
    const resp = await fetch(next);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Meta API ${resp.status}: ${text.slice(0, 300)}`);
    }
    const data = await resp.json();
    if (Array.isArray(data.data)) all.push(...data.data);
    next = data.paging?.next || null;
  }
  return all;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Not authorized - admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[get-meta-ad-insights] Admin verified:", user.email);

    const accessToken = Deno.env.get("META_MARKETING_ACCESS_TOKEN");
    const adAccountId = Deno.env.get("META_AD_ACCOUNT_ID");

    if (!accessToken || !adAccountId) {
      console.error("[get-meta-ad-insights] Missing META_MARKETING_ACCESS_TOKEN or META_AD_ACCOUNT_ID secret");
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: { since?: string; until?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

    const since = body.since && ymdPattern.test(body.since) ? body.since : ymd(sevenDaysAgo);
    const until = body.until && ymdPattern.test(body.until) ? body.until : ymd(today);

    const accountId = adAccountId.replace(/^act_/, '');
    const url = `https://graph.facebook.com/v21.0/act_${accountId}/insights` +
      `?level=campaign` +
      `&fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,ctr,reach` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      `&limit=500` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    let rows: MetaInsightsRow[];
    try {
      rows = await fetchAllPages(url);
    } catch (error) {
      console.error("[get-meta-ad-insights] Graph API error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Meta API error' }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaigns: CampaignInsight[] = rows.map((r) => ({
      campaignId: r.campaign_id || '',
      campaignName: r.campaign_name || '',
      spend: parseFloat(r.spend || '0'),
      impressions: parseInt(r.impressions || '0', 10) || 0,
      clicks: parseInt(r.clicks || '0', 10) || 0,
      cpc: parseFloat(r.cpc || '0'),
      cpm: parseFloat(r.cpm || '0'),
      ctr: parseFloat(r.ctr || '0'),
      reach: parseInt(r.reach || '0', 10) || 0,
    }));

    const totalSpend = Number(campaigns.reduce((sum, c) => sum + c.spend, 0).toFixed(2));

    return new Response(
      JSON.stringify({ data: { campaigns, totalSpend, since, until } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[get-meta-ad-insights] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
