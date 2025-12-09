// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Limites por plano
const PLAN_LIMITS = {
  free: {
    max_monthly_events: 1000,
    max_domains: 1,
    max_sources: 1,
  },
  starter: {
    max_monthly_events: 10000,
    max_domains: 1,
    max_sources: -1, // unlimited
  },
  pro: {
    max_monthly_events: 50000,
    max_domains: 5,
    max_sources: -1,
  },
  business: {
    max_monthly_events: 200000,
    max_domains: -1,
    max_sources: -1,
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar assinatura do webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing event:', event.type)

    switch (event.type) {
      // Checkout concluído - criar/atualizar subscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan || 'starter'

        if (!userId) {
          console.error('No user_id in metadata')
          break
        }

        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter

        // Verificar se já existe subscription para o usuário
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (existingSub) {
          // Atualizar subscription existente
          await supabase
            .from('subscriptions')
            .update({
              plan: plan,
              status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              max_monthly_events: limits.max_monthly_events,
              current_monthly_events: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        } else {
          // Criar nova subscription
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan: plan,
              status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              max_monthly_events: limits.max_monthly_events,
              current_monthly_events: 0,
            })
        }

        console.log(`Subscription created/updated for user ${userId}, plan: ${plan}`)
        break
      }

      // Pagamento de invoice bem-sucedido - renovar subscription
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        if (invoice.billing_reason === 'subscription_cycle') {
          // Resetar contador de eventos no início do novo ciclo
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_monthly_events: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)

          console.log(`Subscription renewed for customer ${customerId}`)
        }
        break
      }

      // Pagamento falhou
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        console.log(`Payment failed for customer ${customerId}`)
        break
      }

      // Subscription cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade para free
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            max_monthly_events: PLAN_LIMITS.free.max_monthly_events,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      // Subscription atualizada (upgrade/downgrade)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Buscar o plano pelo price_id
        const priceId = subscription.items.data[0]?.price.id
        let plan = 'starter'

        // Mapear price_id para plano (configurar no .env)
        const priceMap: Record<string, string> = {
          [Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') ?? '']: 'starter',
          [Deno.env.get('STRIPE_PRICE_STARTER_YEARLY') ?? '']: 'starter',
          [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') ?? '']: 'pro',
          [Deno.env.get('STRIPE_PRICE_PRO_YEARLY') ?? '']: 'pro',
          [Deno.env.get('STRIPE_PRICE_BUSINESS_MONTHLY') ?? '']: 'business',
          [Deno.env.get('STRIPE_PRICE_BUSINESS_YEARLY') ?? '']: 'business',
        }

        if (priceId && priceMap[priceId]) {
          plan = priceMap[priceId]
        }

        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

        await supabase
          .from('subscriptions')
          .update({
            plan: plan,
            status: subscription.status === 'active' ? 'active' : 'past_due',
            max_monthly_events: limits.max_monthly_events,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        console.log(`Subscription updated for customer ${customerId}, new plan: ${plan}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
