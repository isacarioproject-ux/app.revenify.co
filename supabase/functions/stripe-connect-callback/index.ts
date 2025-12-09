import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const stateParam = url.searchParams.get('state')
    
    if (!code || !stateParam) {
      return new Response('Missing code or state', { status: 400 })
    }

    const state = JSON.parse(stateParam)
    const { projectId, userId, returnUrl } = state

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })

    const { stripe_user_id, access_token, refresh_token } = response

    // Save integration to database
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        project_id: projectId,
        stripe_account_id: stripe_user_id,
        stripe_access_token: access_token,
        stripe_refresh_token: refresh_token,
        stripe_connected_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id'
      })

    if (upsertError) {
      console.error('Error saving integration:', upsertError)
      throw upsertError
    }

    // Create webhook endpoint for this connected account
    // This allows us to receive payment events from the customer's Stripe
    try {
      const webhookEndpoint = await stripe.webhookEndpoints.create({
        url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/customer-stripe-webhook`,
        enabled_events: [
          'payment_intent.succeeded',
          'charge.succeeded',
          'checkout.session.completed',
        ],
      }, {
        stripeAccount: stripe_user_id,
      })

      // Save webhook secret
      await supabase
        .from('integrations')
        .update({ webhook_secret: webhookEndpoint.secret })
        .eq('project_id', projectId)
    } catch (webhookError) {
      console.error('Error creating webhook:', webhookError)
      // Continue anyway, webhook can be set up manually
    }

    // Redirect back to app
    const redirectUrl = returnUrl || `${Deno.env.get('APP_URL')}/settings/integrations?connected=true`
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    })
  } catch (error) {
    console.error('Stripe Connect callback error:', error)
    return new Response(
      `Error: ${error.message}`,
      { status: 500 }
    )
  }
})
