import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ShortLinkData {
  id: string
  destination_url: string
  is_active: boolean
  expires_at: string | null
  password_hash: string | null
  utm_campaign: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_term: string | null
  utm_content: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Aceita código via query param (?code=abc123) ou path (/abc123)
    let shortCode = url.searchParams.get('code')
    if (!shortCode) {
      shortCode = url.pathname.split('/').pop()
    }

    if (!shortCode || shortCode === 'redirect-short-link') {
      return new Response('Short code is required. Use ?code=YOUR_CODE', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch short link
    const { data: shortLink, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('short_code', shortCode)
      .single<ShortLinkData>()

    if (error || !shortLink) {
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if active
    if (!shortLink.is_active) {
      return new Response(
        JSON.stringify({ error: 'Link is no longer active' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check expiration
    if (shortLink.expires_at) {
      const expiresAt = new Date(shortLink.expires_at)
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Link has expired' }),
          {
            status: 410,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Parse User-Agent
    const userAgent = req.headers.get('user-agent') || ''
    const deviceInfo = parseUserAgent(userAgent)

    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               '0.0.0.0'

    // Get geo location (using ipapi.co - free tier)
    let country = 'Unknown'
    let city = 'Unknown'

    try {
      // Only fetch geo for non-localhost IPs
      if (ip !== '0.0.0.0' && ip !== '127.0.0.1' && !ip.startsWith('192.168.')) {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'Revenify/1.0' }
        })
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          country = geoData.country_name || 'Unknown'
          city = geoData.city || 'Unknown'
        }
      }
    } catch (e) {
      console.error('Failed to fetch geo data:', e)
    }

    // Record click
    await supabase.from('short_link_clicks').insert({
      short_link_id: shortLink.id,
      ip_address: ip,
      user_agent: userAgent,
      referrer: req.headers.get('referer') || null,
      country_code: country,
      city,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
    })

    // Build destination URL with UTMs
    let destinationUrl = shortLink.destination_url
    const urlObj = new URL(destinationUrl)

    if (shortLink.utm_campaign) urlObj.searchParams.set('utm_campaign', shortLink.utm_campaign)
    if (shortLink.utm_source) urlObj.searchParams.set('utm_source', shortLink.utm_source)
    if (shortLink.utm_medium) urlObj.searchParams.set('utm_medium', shortLink.utm_medium)
    if (shortLink.utm_term) urlObj.searchParams.set('utm_term', shortLink.utm_term)
    if (shortLink.utm_content) urlObj.searchParams.set('utm_content', shortLink.utm_content)

    destinationUrl = urlObj.toString()

    // Redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': destinationUrl,
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper to parse User-Agent
function parseUserAgent(ua: string) {
  let deviceType = 'desktop'
  let os = 'Unknown'
  let browser = 'Unknown'

  // Device Type
  if (/mobile/i.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

  // OS
  if (/windows nt/i.test(ua)) os = 'Windows'
  else if (/mac os x/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  // Browser
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/opera/i.test(ua)) browser = 'Opera'

  return { deviceType, os, browser }
}
