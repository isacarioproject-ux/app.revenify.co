// supabase/functions/track-consent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConsentPayload {
  project_key: string
  visitor_id: string
  consent_given: boolean
  consent_analytics?: boolean
  consent_marketing?: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: ConsentPayload = await req.json()

    // Validar project_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('project_key', payload.project_key)
      .eq('is_active', true)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Invalid project key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // IP e User Agent
    const ip_address = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = req.headers.get('user-agent') || ''

    // Inserir consent log
    const { error: consentError } = await supabase
      .from('consent_logs')
      .insert({
        project_id: project.id,
        visitor_id: payload.visitor_id,
        consent_given: payload.consent_given,
        consent_analytics: payload.consent_analytics ?? payload.consent_given,
        consent_marketing: payload.consent_marketing ?? false,
        ip_address,
        user_agent,
      })

    if (consentError) {
      console.error('Consent insert error:', consentError)
      throw consentError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
