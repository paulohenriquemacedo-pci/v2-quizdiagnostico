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

    console.log("[reset-quiz-data] Admin verified:", user.email);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { tables } = body;

    // Default to all tables if not specified
    const tablesToReset = tables || ["quiz_starts", "quiz_responses", "cta_clicks"];

    const results: Record<string, { deleted: number; error?: string }> = {};

    // Delete data from each specified table
    for (const table of tablesToReset) {
      if (!["quiz_starts", "quiz_responses", "cta_clicks"].includes(table)) {
        results[table] = { deleted: 0, error: "Invalid table name" };
        continue;
      }

      try {
        // Count existing records first
        const { count: beforeCount } = await adminClient
          .from(table)
          .select("id", { count: "exact", head: true });

        // Delete all records
        const { error: deleteError } = await adminClient
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

        if (deleteError) {
          console.error(`[reset-quiz-data] Error deleting from ${table}:`, deleteError);
          results[table] = { deleted: 0, error: deleteError.message };
        } else {
          results[table] = { deleted: beforeCount || 0 };
          console.log(`[reset-quiz-data] Deleted ${beforeCount || 0} records from ${table}`);
        }
      } catch (err) {
        console.error(`[reset-quiz-data] Error with ${table}:`, err);
        results[table] = { deleted: 0, error: String(err) };
      }
    }

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.deleted, 0);

    console.log("[reset-quiz-data] Reset complete:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalDeleted} registros removidos`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[reset-quiz-data] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
