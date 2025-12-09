import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface LeadPayload {
  email: string;
  visitor_id: string;
  name?: string;
  properties?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key
    const { data: integration, error: authError } = await supabase
      .from("integrations")
      .select("project_id, is_active")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (authError || !integration) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: LeadPayload = await req.json();

    if (!body.email || !body.visitor_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, visitor_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert or update lead
    const { data: lead, error: upsertError } = await supabase
      .from("leads")
      .upsert({
        project_id: integration.project_id,
        email: body.email,
        visitor_id: body.visitor_id,
        name: body.name,
        properties: body.properties || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "project_id,email" })
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to create lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger webhooks
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("url")
      .eq("project_id", integration.project_id)
      .eq("is_active", true)
      .eq("event_type", "lead.created");

    if (webhooks && webhooks.length > 0) {
      for (const webhook of webhooks) {
        fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lead.created",
            data: lead,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: "Lead tracked successfully",
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
