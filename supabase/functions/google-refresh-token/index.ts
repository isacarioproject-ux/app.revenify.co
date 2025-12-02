// @ts-ignore - Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 🔄 Google Refresh Token Edge Function
 * Atualiza o access_token usando o refresh_token
 */
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
    const { integration_id } = await req.json()

    if (!integration_id) {
      throw new Error('Missing integration_id')
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(
      // @ts-ignore - Deno.env
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore - Deno.env
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verificar autorização
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error('Unauthorized')

    // Buscar integração
    const { data: integration, error: fetchError } = await supabase
      .from('google_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      throw new Error('Integration not found')
    }

    if (!integration.refresh_token) {
      throw new Error('No refresh token available - user needs to reconnect')
    }

    // Fazer refresh do token
    // @ts-ignore - Deno fetch
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // @ts-ignore - Deno URLSearchParams
      body: new URLSearchParams({
        refresh_token: integration.refresh_token,
        // @ts-ignore - Deno.env
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        // @ts-ignore - Deno.env
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        grant_type: 'refresh_token'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      // @ts-ignore - Deno console
      console.error('Google token refresh failed:', errorData)
      
      // Se o refresh token for inválido, desativar integração
      if (errorData.error === 'invalid_grant') {
        await supabase
          .from('google_integrations')
          .update({ is_active: false })
          .eq('id', integration_id)
        
        throw new Error('Refresh token expired - user needs to reconnect')
      }
      
      throw new Error(`Token refresh failed: ${errorData.error}`)
    }

    const tokens = await tokenResponse.json()

    // Calcular nova expiração (Google tokens expiram em ~1 hora)
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('google_integrations')
      .update({
        access_token: tokens.access_token,
        token_expires_at: expiresAt,
        // Google pode retornar novo refresh_token (raro, mas possível)
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token })
      })
      .eq('id', integration_id)

    if (updateError) throw updateError

    console.log(`✅ Token refreshed for integration ${integration_id}`)

    // @ts-ignore - Deno Response
    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: tokens.access_token,
        expires_at: expiresAt
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
    console.error('Error in google-refresh-token:', error)
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
