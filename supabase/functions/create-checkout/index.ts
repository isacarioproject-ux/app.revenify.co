// supabase/functions/create-checkout/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { planId, interval, userId, userEmail, successUrl, cancelUrl } = body

    console.log('Checkout request:', { planId, interval, userId, userEmail })

    // Price IDs mapping - Production USD prices
    const PRICE_IDS: Record<string, Record<string, string>> = {
      starter: {
        monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || 'price_1SeNTlGv40SOibxN3LFF9alH',
        yearly: Deno.env.get('STRIPE_PRICE_STARTER_YEARLY') || 'price_1SeNWvGv40SOibxNQ4X9jiDg',
      },
      pro: {
        monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || 'price_1SeNYPGv40SOibxNAUmjt7i4',
        yearly: Deno.env.get('STRIPE_PRICE_PRO_YEARLY') || 'price_1SeNaWGv40SOibxNP08riw0f',
      },
      business: {
        monthly: Deno.env.get('STRIPE_PRICE_BUSINESS_MONTHLY') || 'price_1SeNcsGv40SOibxNDeuginH2',
        yearly: Deno.env.get('STRIPE_PRICE_BUSINESS_YEARLY') || 'price_1SeNeRGv40SOibxNgbyIZ1NI',
      },
    }

    const priceId = PRICE_IDS[planId]?.[interval]
    if (!priceId) {
      console.error('Invalid price:', { planId, interval, availablePrices: PRICE_IDS })
      return new Response(
        JSON.stringify({ error: `Invalid plan: ${planId} ${interval}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Using priceId:', priceId)

    // Create checkout session using Stripe API directly
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': successUrl || 'http://localhost:5173/dashboard?upgraded=true',
        'cancel_url': cancelUrl || 'http://localhost:5173/settings/billing',
        'customer_email': userEmail || '',
        'client_reference_id': userId || '',
        'metadata[user_id]': userId || '',
        'metadata[plan]': planId,
        'metadata[interval]': interval,
      }),
    })

    const session = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', session)
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Stripe error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
