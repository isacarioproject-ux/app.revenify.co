// @ts-ignore - Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno runtime
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    // @ts-ignore - Deno Response
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { code, workspace_id } = await req.json()

    if (!code || !workspace_id) {
      throw new Error('Missing required parameters')
    }

    // Trocar código por tokens
    // @ts-ignore - Deno fetch
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // @ts-ignore - Deno URLSearchParams
      body: new URLSearchParams({
        code,
        // @ts-ignore - Deno.env
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        // @ts-ignore - Deno.env
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        // @ts-ignore - Deno.env
        redirect_uri: `${Deno.env.get('APP_URL')}/integrations/google/callback`,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens = await tokenResponse.json()

    // Obter email do usuário
    // @ts-ignore - Deno fetch
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }
    )

    const userInfo = await userInfoResponse.json()

    // Salvar no Supabase
    const supabase = createClient(
      // @ts-ignore - Deno.env
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore - Deno.env
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obter usuário autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error('Unauthorized')

    // Inserir/atualizar integração
    const { error: dbError } = await supabase
      .from('google_integrations')
      .upsert({
        user_id: user.id,
        workspace_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope.split(' '),
        google_email: userInfo.email,
        is_active: true
      }, {
        onConflict: 'user_id,workspace_id'
      })

    if (dbError) throw dbError

    // @ts-ignore - Deno Response
    return new Response(
      JSON.stringify({ 
        success: true,
        email: userInfo.email 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error: any) {
    // @ts-ignore - Deno console
    console.error('Error in google-oauth-exchange:', error)
    // @ts-ignore - Deno Response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
