// supabase/functions/track-event/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app.revenify.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

interface TrackingPayload {
  project_key: string
  session_id: string
  visitor_id?: string  // Persistente entre sessões
  event_type: string
  page_url: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  device_type?: string
  user_agent?: string
  screen_width?: number
  screen_height?: number
  language?: string
  email?: string  // Para signup events
  name?: string   // Para signup events
  amount?: number // Para purchase events
  currency?: string
  order_id?: string
  customer_email?: string
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

    // Parse body
    const payload: TrackingPayload = await req.json()

    // Validar project_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('project_key', payload.project_key)
      .eq('is_active', true)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Invalid project key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar limites do plano
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('max_monthly_events, current_monthly_events')
      .eq('user_id', project.user_id)
      .single()

    if (subscription) {
      if (subscription.current_monthly_events >= subscription.max_monthly_events) {
        return new Response(
          JSON.stringify({ error: 'Monthly event limit reached' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Enriquecer dados
    const enrichedData = await enrichEventData(req, payload)

    // Inserir evento
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        project_id: project.id,
        session_id: payload.session_id,
        visitor_id: payload.visitor_id,
        event_type: payload.event_type,
        page_url: payload.page_url,
        referrer: payload.referrer,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_term: payload.utm_term,
        utm_content: payload.utm_content,
        country_code: enrichedData.country_code,
        city: enrichedData.city,
        device_type: payload.device_type,
        browser: enrichedData.browser,
        os: enrichedData.os,
        ip_address: enrichedData.ip_address,
      })

    if (eventError) {
      console.error('Event insert error:', eventError)
      throw eventError
    }

    // Se for signup, criar lead
    if (payload.event_type === 'signup' && payload.email) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          project_id: project.id,
          session_id: payload.session_id,
          email: payload.email,
          name: payload.name,
        })

      if (leadError) {
        console.error('Lead insert error:', leadError)
      }
    }

    // Se for purchase, criar payment
    if (payload.event_type === 'purchase' && payload.amount) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          project_id: project.id,
          session_id: payload.session_id,
          visitor_id: payload.visitor_id,
          amount: payload.amount,
          currency: payload.currency || 'BRL',
          customer_email: payload.customer_email || payload.email,
          metadata: { order_id: payload.order_id },
        })

      if (paymentError) {
        console.error('Payment insert error:', paymentError)
      }
    }

    // Incrementar contador de eventos
    if (subscription) {
      await supabase
        .from('subscriptions')
        .update({ 
          current_monthly_events: subscription.current_monthly_events + 1 
        })
        .eq('user_id', project.user_id)
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

// ===================================
// ENRIQUECIMENTO DE DADOS
// ===================================

async function enrichEventData(req: Request, payload: TrackingPayload) {
  // IP Address
  const ip_address = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

  // Cloudflare headers (geolocalização)
  const country_code = req.headers.get('cf-ipcountry') || null
  const city = req.headers.get('cf-ipcity') || null

  // Parse User-Agent
  const userAgent = payload.user_agent || req.headers.get('user-agent') || ''
  const { browser, os } = parseUserAgent(userAgent)

  return {
    ip_address,
    country_code,
    city,
    browser,
    os,
  }
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown'
  let os = 'Unknown'

  // Browser detection
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edge')) browser = 'Edge'

  // OS detection
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS'

  return { browser, os }
}
