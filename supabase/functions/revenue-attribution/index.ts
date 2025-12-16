import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RevenueAttributionPayload {
  project_id: string;
  visitor_id: string;
  amount: number;
  currency?: string;
  transaction_id?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  metadata?: Record<string, any>;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for API key authentication
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required. Use X-API-Key header or Bearer token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate API key and get project
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("project_id, is_active")
      .eq("api_key", apiKey)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!integration.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RevenueAttributionPayload = await req.json();

    // Validate required fields
    if (!body.visitor_id || body.amount === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: visitor_id, amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectId = integration.project_id;

    // Find visitor and their attribution data
    const { data: visitor } = await supabase
      .from("visitors")
      .select("id, first_source, first_medium, first_campaign, last_source, last_medium, last_campaign")
      .eq("project_id", projectId)
      .eq("visitor_id", body.visitor_id)
      .single();

    // Create revenue attribution record
    const attributionData = {
      project_id: projectId,
      visitor_id: body.visitor_id,
      amount: body.amount,
      currency: body.currency || "BRL",
      transaction_id: body.transaction_id,
      source: body.source || visitor?.last_source || body.utm_source,
      medium: visitor?.last_medium || body.utm_medium,
      campaign: visitor?.last_campaign || body.utm_campaign,
      first_touch_source: visitor?.first_source,
      first_touch_medium: visitor?.first_medium,
      first_touch_campaign: visitor?.first_campaign,
      last_touch_source: visitor?.last_source || body.utm_source,
      last_touch_medium: visitor?.last_medium || body.utm_medium,
      last_touch_campaign: visitor?.last_campaign || body.utm_campaign,
      metadata: body.metadata,
      created_at: new Date().toISOString(),
    };

    const { data: attribution, error: attributionError } = await supabase
      .from("revenue_attributions")
      .insert(attributionData)
      .select()
      .single();

    if (attributionError) {
      console.error("Attribution error:", attributionError);
      return new Response(
        JSON.stringify({ error: "Failed to create attribution", details: attributionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dispatch webhook if configured
    const { data: webhook } = await supabase
      .from("webhooks")
      .select("url, is_active")
      .eq("project_id", projectId)
      .single();

    if (webhook?.url && webhook?.is_active) {
      const webhookPayload = {
        type: "revenue.attributed",
        data: {
          attribution_id: attribution.id,
          project_id: projectId,
          visitor_id: body.visitor_id,
          amount: body.amount,
          currency: body.currency || "BRL",
          transaction_id: body.transaction_id,
          attribution: {
            first_touch: {
              source: attributionData.first_touch_source,
              medium: attributionData.first_touch_medium,
              campaign: attributionData.first_touch_campaign,
            },
            last_touch: {
              source: attributionData.last_touch_source,
              medium: attributionData.last_touch_medium,
              campaign: attributionData.last_touch_campaign,
            },
          },
          timestamp: new Date().toISOString(),
        },
      };

      try {
        const startTime = Date.now();
        const webhookResponse = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Revenify-Webhook/1.0",
            "X-Revenify-Event": "revenue.attributed",
          },
          body: JSON.stringify(webhookPayload),
        });

        const duration = Date.now() - startTime;

        // Log webhook
        await supabase.from("webhook_logs").insert({
          project_id: projectId,
          webhook_url: webhook.url,
          event_type: "revenue.attributed",
          payload: webhookPayload,
          status_code: webhookResponse.status,
          response_time_ms: duration,
          success: webhookResponse.ok,
        });
      } catch (webhookError) {
        console.error("Webhook dispatch error:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        attribution_id: attribution.id,
        message: "Revenue attributed successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Revenue attribution error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
