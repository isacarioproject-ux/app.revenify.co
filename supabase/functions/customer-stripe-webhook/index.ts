import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!
    const stripeAccount = req.headers.get('stripe-account')

    // Find integration by stripe account
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*, projects(*)')
      .eq('stripe_account_id', stripeAccount)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      console.error('Integration not found for account:', stripeAccount)
      return new Response(
        JSON.stringify({ error: 'Integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        integration.webhook_secret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Received event:', event.type, 'for project:', integration.project_id)

    // Handle payment events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Extract session_id from metadata if available
        const sessionId = paymentIntent.metadata?.session_id || 
                         paymentIntent.metadata?.revenify_session ||
                         null

        // Insert payment record
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            project_id: integration.project_id,
            session_id: sessionId || `stripe_${paymentIntent.id}`,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer as string,
            status: 'succeeded',
            metadata: {
              stripe_account: stripeAccount,
              customer_email: paymentIntent.receipt_email,
            },
          })

        if (insertError) {
          console.error('Error inserting payment:', insertError)
        } else {
          console.log('Payment recorded:', paymentIntent.amount / 100, paymentIntent.currency)
        }
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        
        // Only process if no payment_intent (to avoid duplicates)
        if (!charge.payment_intent) {
          const { error: insertError } = await supabase
            .from('payments')
            .insert({
              project_id: integration.project_id,
              session_id: charge.metadata?.session_id || `stripe_charge_${charge.id}`,
              amount: charge.amount / 100,
              currency: charge.currency.toUpperCase(),
              payment_intent_id: charge.id,
              stripe_customer_id: charge.customer as string,
              status: 'succeeded',
              metadata: {
                stripe_account: stripeAccount,
                customer_email: charge.receipt_email,
              },
            })

          if (insertError) {
            console.error('Error inserting charge:', insertError)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid' && session.amount_total) {
          const { error: insertError } = await supabase
            .from('payments')
            .insert({
              project_id: integration.project_id,
              session_id: session.metadata?.session_id || session.client_reference_id || `stripe_checkout_${session.id}`,
              amount: session.amount_total / 100,
              currency: (session.currency || 'brl').toUpperCase(),
              payment_intent_id: session.payment_intent as string,
              stripe_customer_id: session.customer as string,
              status: 'succeeded',
              metadata: {
                stripe_account: stripeAccount,
                customer_email: session.customer_email,
                checkout_session_id: session.id,
              },
            })

          if (insertError) {
            console.error('Error inserting checkout payment:', insertError)
          }
        }
        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Customer webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
