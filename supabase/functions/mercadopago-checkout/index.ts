// supabase/functions/mercadopago-checkout/index.ts
// Edge Function para criar checkout do Mercado Pago

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Credenciais de PRODUÇÃO do Mercado Pago (do Supabase Secrets)
const MP_PUBLIC_KEY = Deno.env.get('MERCADOPAGO_PUBLIC_KEY') || ''
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Preços dos planos em BRL
const PRICES: Record<string, Record<string, { amount: number; title: string }>> = {
  starter: {
    monthly: { amount: 39, title: 'Revenify Starter - Mensal' },
    yearly: { amount: 349, title: 'Revenify Starter - Anual' },
  },
  pro: {
    monthly: { amount: 99, title: 'Revenify Pro - Mensal' },
    yearly: { amount: 949, title: 'Revenify Pro - Anual' },
  },
  business: {
    monthly: { amount: 249, title: 'Revenify Business - Mensal' },
    yearly: { amount: 2390, title: 'Revenify Business - Anual' },
  },
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { planId, interval, userId, userEmail } = body

    console.log('Checkout request:', { planId, interval, userId, userEmail })

    // Validar dados
    if (!planId || !interval || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId, interval, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar preço do plano
    const priceData = PRICES[planId]?.[interval]
    if (!priceData) {
      return new Response(
        JSON.stringify({ error: `Plano inválido: ${planId} ${interval}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar preferência de pagamento no Mercado Pago
    const preferenceData = {
      items: [
        {
          id: `${planId}_${interval}`,
          title: priceData.title,
          description: `Assinatura ${priceData.title}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: priceData.amount,
        },
      ],
      payer: {
        email: userEmail || undefined,
      },
      back_urls: {
        success: 'https://app.revenify.co/dashboard?payment=success',
        failure: 'https://app.revenify.co/settings/billing?payment=failure',
        pending: 'https://app.revenify.co/settings/billing?payment=pending',
      },
      auto_return: 'approved',
      statement_descriptor: 'REVENIFY',
      external_reference: JSON.stringify({
        user_id: userId,
        plan_id: planId,
        interval: interval,
      }),
      notification_url: 'https://gyqohtqfyzzifxjkuuiz.supabase.co/functions/v1/mercadopago-webhook',
    }

    console.log('Creating MP preference:', JSON.stringify(preferenceData))

    // Chamar API do Mercado Pago - Checkout Pro
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${planId}-${interval}-${Date.now()}`,
      },
      body: JSON.stringify(preferenceData),
    })

    const mpResult = await mpResponse.json()

    console.log('MP Response status:', mpResponse.status)
    console.log('MP Response:', JSON.stringify(mpResult))

    if (!mpResponse.ok) {
      console.error('MP Error:', JSON.stringify(mpResult))
      return new Response(
        JSON.stringify({ 
          error: mpResult.message || 'Erro ao criar checkout',
          details: mpResult,
        }),
        { status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retornar URL do checkout (init_point é produção, sandbox_init_point é sandbox)
    const checkoutUrl = mpResult.init_point

    console.log('Checkout URL:', checkoutUrl)

    return new Response(
      JSON.stringify({ 
        url: checkoutUrl,
        preference_id: mpResult.id,
        public_key: MP_PUBLIC_KEY,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
