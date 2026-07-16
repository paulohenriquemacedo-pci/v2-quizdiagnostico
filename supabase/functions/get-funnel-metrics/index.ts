import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';

  const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const isLovablePreview = /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/.test(origin);
  const isLovableApp = /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin);
  const isCustomDomain = /^https:\/\/([a-z0-9-]+\.)*sistemaacademia\.com\.br$/.test(origin);

  const allowedOrigin = isLocalhost || isLovablePreview || isLovableApp || isCustomDomain
    ? origin
    : 'https://quizdiagnostico.lovable.app';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using service role client
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

    console.log("[get-funnel-metrics] Admin verified:", user.email);

    // Fetch all metrics using admin client (bypasses RLS)
    const [startsResult, responsesResult, clicksResult] = await Promise.all([
      adminClient.from("quiz_starts").select("id, started_at", { count: "exact" }),
      adminClient.from("quiz_responses").select("id, created_at", { count: "exact" }),
      adminClient.from("cta_clicks").select("id, clicked_at, email, dominant_profile", { count: "exact" }),
    ]);

    const totalStarts = startsResult.count || 0;
    const totalCompletions = responsesResult.count || 0;
    const totalCtaClicks = clicksResult.count || 0;

    // Calculate rates
    const completionRate = totalStarts > 0 
      ? ((totalCompletions / totalStarts) * 100).toFixed(1) 
      : "0.0";
    
    const dropoffRate = totalStarts > 0 
      ? (((totalStarts - totalCompletions) / totalStarts) * 100).toFixed(1) 
      : "0.0";
    
    const ctaClickRate = totalCompletions > 0 
      ? ((totalCtaClicks / totalCompletions) * 100).toFixed(1) 
      : "0.0";

    // Get recent CTA clicks for display
    const { data: recentClicks } = await adminClient
      .from("cta_clicks")
      .select("*")
      .order("clicked_at", { ascending: false })
      .limit(10);

    const metrics = {
      totalStarts,
      totalCompletions,
      totalCtaClicks,
      dropoffs: totalStarts - totalCompletions,
      completionRate: parseFloat(completionRate),
      dropoffRate: parseFloat(dropoffRate),
      ctaClickRate: parseFloat(ctaClickRate),
      recentClicks: recentClicks || [],
    };

    console.log("[get-funnel-metrics] Metrics:", metrics);

    return new Response(
      JSON.stringify({ data: metrics }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
