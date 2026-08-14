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

interface PurchaseRow {
  id: string;
  sale_id: string | null;
  status: string;
  email: string | null;
  name: string | null;
  amount: number | null;
  product_name: string | null;
  sale_created_at: string | null;
  created_at: string;
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

    console.log("[get-sales-metrics] Admin verified:", user.email);

    const [purchasesResult, responsesResult] = await Promise.all([
      adminClient
        .from("purchases")
        .select("id, sale_id, status, email, name, amount, product_name, sale_created_at, created_at")
        .order("created_at", { ascending: false }),
      adminClient
        .from("quiz_responses")
        .select("email, utm_source, utm_medium, utm_campaign"),
    ]);

    const purchases = (purchasesResult.data || []) as PurchaseRow[];
    const responses = responsesResult.data || [];

    // Map email -> UTM captured at lead time, for attributing purchases back to campaigns.
    // The sales webhook (hotmart-sales-webhook) doesn't reliably carry UTM data, but we already
    // have it from our own funnel — joining by email is a simple, self-contained way to
    // attribute revenue.
    const utmByEmail = new Map<string, { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }>();
    for (const r of responses) {
      if (r.email) utmByEmail.set(r.email.toLowerCase(), { utm_source: r.utm_source, utm_medium: r.utm_medium, utm_campaign: r.utm_campaign });
    }

    const paid = purchases.filter((p) => p.status === 'paid');
    const pending = purchases.filter((p) => p.status === 'waiting_payment' || p.status === 'created');
    const refused = purchases.filter((p) => p.status === 'refused');
    const refundedOrChargedBack = purchases.filter((p) => p.status === 'refunded' || p.status === 'chargedback');

    const totalRevenue = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSalesCount = paid.length;
    const totalSalesAttempted = purchases.length;
    const arpu = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    const revenueByCampaign = new Map<string, { source: string; campaign: string; revenue: number; sales: number }>();
    for (const p of paid) {
      const utm = p.email ? utmByEmail.get(p.email.toLowerCase()) : undefined;
      const source = utm?.utm_source || 'desconhecido';
      const campaign = utm?.utm_campaign || 'desconhecido';
      const key = `${source}|${campaign}`;
      const existing = revenueByCampaign.get(key) || { source, campaign, revenue: 0, sales: 0 };
      existing.revenue += p.amount || 0;
      existing.sales += 1;
      revenueByCampaign.set(key, existing);
    }

    // Lead counts per campaign — reuses the same `responses` fetch as utmByEmail above, so the
    // CampaignsPanel dashboard can compute CPL (spend/leads) without a separate function/query.
    const leadsByCampaign = new Map<string, { source: string; campaign: string; count: number }>();
    for (const r of responses) {
      const source = r.utm_source || 'desconhecido';
      const campaign = r.utm_campaign || 'desconhecido';
      const key = `${source}|${campaign}`;
      const existing = leadsByCampaign.get(key) || { source, campaign, count: 0 };
      existing.count += 1;
      leadsByCampaign.set(key, existing);
    }

    const metrics = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalSalesCount,
      totalSalesAttempted,
      pendingCount: pending.length,
      refusedCount: refused.length,
      refundedCount: refundedOrChargedBack.length,
      arpu: Number(arpu.toFixed(2)),
      revenueByCampaign: Array.from(revenueByCampaign.values()).sort((a, b) => b.revenue - a.revenue),
      leadsByCampaign: Array.from(leadsByCampaign.values()).sort((a, b) => b.count - a.count),
      recentPurchases: purchases.slice(0, 10),
    };

    console.log("[get-sales-metrics] Metrics:", metrics);

    return new Response(
      JSON.stringify({ data: metrics }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[get-sales-metrics] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
