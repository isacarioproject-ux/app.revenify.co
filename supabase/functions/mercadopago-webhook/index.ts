// supabase/functions/mercadopago-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de planos para limites
const PLAN_LIMITS: Record<string, any> = {
  starter: {
    max_projects: 3,
    max_sources: -1,
    max_monthly_events: 5000,
    max_short_links: 100,
    max_ai_messages: 50,
    data_retention_days: 30,
  },
  pro: {
    max_projects: 10,
    max_sources: -1,
    max_monthly_events: 200000,
    max_short_links: 1000,
    max_ai_messages: 200,
    data_retention_days: 365,
  },
  business: {
    max_projects: -1,
    max_sources: -1,
    max_monthly_events: 500000,
    max_short_links: -1,
    max_ai_messages: 1000,
    data_retention_days: 1095,
  },
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MERCADOPAGO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Mercado Pago envia notificações via query params ou body
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    // Também pode vir no body
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body vazio é OK para algumas notificações
    }

    const paymentId = id || body?.data?.id
    const notificationType = topic || body?.type || body?.action

    console.log('MercadoPago webhook:', { notificationType, paymentId, body })

    // Ignorar notificações que não são de pagamento
    if (notificationType !== 'payment' && notificationType !== 'payment.created' && notificationType !== 'payment.updated') {
      console.log('Ignoring notification type:', notificationType)
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!paymentId) {
      console.log('No payment ID in notification')
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar detalhes do pagamento
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment:', await paymentResponse.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payment = await paymentResponse.json()
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    })

    // Só processar pagamentos aprovados
    if (payment.status !== 'approved') {
      console.log('Payment not approved:', payment.status)
      return new Response(
        JSON.stringify({ received: true, status: payment.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair dados do external_reference
    let referenceData: { user_id: string; plan: string; interval: string }
    try {
      referenceData = JSON.parse(payment.external_reference)
    } catch {
      console.error('Invalid external_reference:', payment.external_reference)
      return new Response(
        JSON.stringify({ error: 'Invalid external_reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id, plan, interval } = referenceData
    console.log('Processing subscription:', { user_id, plan, interval })

    // Calcular data de expiração
    const now = new Date()
    const expiresAt = new Date(now)
    if (interval === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // Atualizar subscription no banco
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan: plan,
        status: 'active',
        mercadopago_payment_id: payment.id.toString(),
        billing_interval: interval,
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
        ...limits,
        updated_at: now.toISOString(),
      })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Failed to update subscription:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Subscription updated successfully:', { user_id, plan })

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id,
        plan,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
