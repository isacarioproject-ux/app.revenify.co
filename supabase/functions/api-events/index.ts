import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EventPayload {
  event: string;
  visitor_id: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Validate API Key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key and get project
    const { data: integration, error: authError } = await supabase
      .from("integrations")
      .select("project_id, is_active, projects!inner(user_id, name)")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (authError || !integration) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: EventPayload = await req.json();

    if (!body.event || !body.visitor_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event, visitor_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check usage limits
    const { data: usage } = await supabase
      .from("usage_stats")
      .select("events_count, events_limit")
      .eq("project_id", integration.project_id)
      .single();

    if (usage && usage.events_count >= usage.events_limit) {
      return new Response(
        JSON.stringify({ error: "Event limit exceeded. Please upgrade your plan." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert event
    const eventData = {
      project_id: integration.project_id,
      event_type: body.event,
      visitor_id: body.visitor_id,
      session_id: body.visitor_id,
      utm_source: body.properties?.utm_source as string || null,
      utm_medium: body.properties?.utm_medium as string || null,
      utm_campaign: body.properties?.utm_campaign as string || null,
      page_url: body.properties?.page as string || null,
      referrer: body.properties?.referrer as string || null,
      created_at: body.timestamp || new Date().toISOString(),
    };

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update usage count
    await supabase.rpc("increment_event_count", { p_project_id: integration.project_id });

    // Trigger webhooks if configured
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("url")
      .eq("project_id", integration.project_id)
      .eq("is_active", true)
      .eq("event_type", "event.created");

    if (webhooks && webhooks.length > 0) {
      // Fire and forget webhook calls
      for (const webhook of webhooks) {
        fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "event.created",
            data: event,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        message: "Event tracked successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
