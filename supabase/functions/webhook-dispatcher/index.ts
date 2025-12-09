import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WebhookTestPayload {
  webhook_url: string;
  project_id: string;
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WebhookTestPayload = await req.json();

    if (!body.webhook_url || !body.project_id) {
      return new Response(
        JSON.stringify({ error: "Missing webhook_url or project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    try {
      new URL(body.webhook_url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid webhook URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send test webhook
    const testPayload = {
      type: "webhook.test",
      data: {
        message: "This is a test webhook from Revenify",
        project_id: body.project_id,
        timestamp: new Date().toISOString(),
      },
    };

    const startTime = Date.now();
    
    try {
      const response = await fetch(body.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Revenify-Webhook/1.0",
          "X-Revenify-Event": "webhook.test",
        },
        body: JSON.stringify(testPayload),
      });

      const duration = Date.now() - startTime;

      // Log webhook attempt
      await supabase.from("webhook_logs").insert({
        project_id: body.project_id,
        webhook_url: body.webhook_url,
        event_type: "webhook.test",
        payload: testPayload,
        status_code: response.status,
        response_time_ms: duration,
        success: response.ok,
      });

      if (response.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            status_code: response.status,
            response_time_ms: duration,
            message: "Webhook delivered successfully",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            status_code: response.status,
            response_time_ms: duration,
            message: `Webhook failed with status ${response.status}`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fetchError) {
      const duration = Date.now() - startTime;
      
      // Log failed attempt
      await supabase.from("webhook_logs").insert({
        project_id: body.project_id,
        webhook_url: body.webhook_url,
        event_type: "webhook.test",
        payload: testPayload,
        status_code: 0,
        response_time_ms: duration,
        success: false,
        error_message: String(fetchError),
      });

      return new Response(
        JSON.stringify({
          success: false,
          status_code: 0,
          response_time_ms: duration,
          message: `Failed to reach webhook: ${fetchError}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
