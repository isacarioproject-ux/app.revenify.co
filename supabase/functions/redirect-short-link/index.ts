import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GeoRule {
  country: string
  url: string
}

interface DeviceTargeting {
  desktop?: string
  mobile?: string
  tablet?: string
}

interface ShortLinkData {
  id: string
  destination_url: string
  is_active: boolean
  expires_at: string | null
  password: string | null
  password_hash: string | null
  utm_campaign: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_term: string | null
  utm_content: string | null
  // A/B Testing
  ab_test_enabled: boolean
  ab_test_url: string | null
  ab_test_split: number
  // Geo Targeting
  geo_targeting: GeoRule[] | null
  // Device Targeting
  device_targeting: DeviceTargeting | null
  // Deep Links
  deep_link_ios: string | null
  deep_link_android: string | null
  deep_link_fallback: string | null
  // Link Cloaking
  cloaking_enabled: boolean
  cloaked_title: string | null
  cloaked_description: string | null
  cloaked_image: string | null
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

    // Check for password submission
    const submittedPassword = url.searchParams.get('pwd')

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

    // Fetch short link with all fields
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

    // ============================================
    // PASSWORD PROTECTION
    // ⚠️ SECURITY TODO: Implementar bcrypt para hash de senhas
    // Atualmente as senhas são comparadas em texto plano.
    // Para produção, usar: https://deno.land/x/bcrypt
    // 1. Ao criar short link: hash = await bcrypt.hash(password)
    // 2. Ao verificar: await bcrypt.compare(submittedPassword, hash)
    // ============================================
    if (shortLink.password) {
      if (!submittedPassword) {
        // Show password form
        return new Response(getPasswordPage(shortCode), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      
      // ⚠️ INSECURE: Plain text comparison - migrate to bcrypt
      if (submittedPassword !== shortLink.password) {
        return new Response(getPasswordPage(shortCode, true), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }

    // Parse User-Agent
    const userAgent = req.headers.get('user-agent') || ''
    const deviceInfo = parseUserAgent(userAgent)

    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               '0.0.0.0'

    // Get geo location
    let countryCode = 'Unknown'
    let countryName = 'Unknown'
    let city = 'Unknown'

    try {
      if (ip !== '0.0.0.0' && ip !== '127.0.0.1' && !ip.startsWith('192.168.')) {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'Revenify/1.0' }
        })
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          countryCode = geoData.country_code || 'Unknown'
          countryName = geoData.country_name || 'Unknown'
          city = geoData.city || 'Unknown'
        }
      }
    } catch (e) {
      console.error('Failed to fetch geo data:', e)
    }

    // ============================================
    // DETERMINE FINAL DESTINATION URL
    // ============================================
    let destinationUrl = shortLink.destination_url

    // ============================================
    // DEEP LINKS (check first - highest priority)
    // ============================================
    if (shortLink.deep_link_ios || shortLink.deep_link_android) {
      const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      const isAndroid = /android/i.test(userAgent)
      
      if (isIOS && shortLink.deep_link_ios) {
        destinationUrl = shortLink.deep_link_ios
      } else if (isAndroid && shortLink.deep_link_android) {
        destinationUrl = shortLink.deep_link_android
      } else if (shortLink.deep_link_fallback) {
        destinationUrl = shortLink.deep_link_fallback
      }
    }

    // ============================================
    // DEVICE TARGETING
    // ============================================
    if (shortLink.device_targeting && typeof shortLink.device_targeting === 'object') {
      const dt = shortLink.device_targeting
      if (deviceInfo.deviceType === 'mobile' && dt.mobile) {
        destinationUrl = dt.mobile
      } else if (deviceInfo.deviceType === 'tablet' && dt.tablet) {
        destinationUrl = dt.tablet
      } else if (deviceInfo.deviceType === 'desktop' && dt.desktop) {
        destinationUrl = dt.desktop
      }
    }

    // ============================================
    // GEO TARGETING
    // ============================================
    if (shortLink.geo_targeting && Array.isArray(shortLink.geo_targeting) && shortLink.geo_targeting.length > 0) {
      for (const rule of shortLink.geo_targeting) {
        if (rule.country && rule.url) {
          if (rule.country.toUpperCase() === countryCode.toUpperCase()) {
            destinationUrl = rule.url
            break
          }
        }
      }
    }

    // ============================================
    // A/B TESTING
    // ============================================
    if (shortLink.ab_test_enabled && shortLink.ab_test_url) {
      const splitPercentage = shortLink.ab_test_split || 50
      const random = Math.random() * 100
      
      if (random > splitPercentage) {
        destinationUrl = shortLink.ab_test_url
      }
    }

    // ============================================
    // LINK CLOAKING (return HTML with meta tags)
    // ============================================
    if (shortLink.cloaking_enabled && (shortLink.cloaked_title || shortLink.cloaked_description || shortLink.cloaked_image)) {
      // Check if request is from a bot/crawler
      const isBot = /bot|crawler|spider|facebook|twitter|linkedin|whatsapp|telegram|slack|discord/i.test(userAgent)
      
      if (isBot) {
        return new Response(getCloakedPage(shortLink, destinationUrl), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }

    // Record click
    await supabase.from('short_link_clicks').insert({
      short_link_id: shortLink.id,
      ip_address: ip,
      user_agent: userAgent,
      referrer: req.headers.get('referer') || null,
      country_code: countryCode,
      city,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
    })

    // Build destination URL with UTMs
    try {
      const urlObj = new URL(destinationUrl)
      if (shortLink.utm_campaign) urlObj.searchParams.set('utm_campaign', shortLink.utm_campaign)
      if (shortLink.utm_source) urlObj.searchParams.set('utm_source', shortLink.utm_source)
      if (shortLink.utm_medium) urlObj.searchParams.set('utm_medium', shortLink.utm_medium)
      if (shortLink.utm_term) urlObj.searchParams.set('utm_term', shortLink.utm_term)
      if (shortLink.utm_content) urlObj.searchParams.set('utm_content', shortLink.utm_content)
      destinationUrl = urlObj.toString()
    } catch (e) {
      // If URL parsing fails, use as-is (for deep links like app://)
    }

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
  if (/mobile|iphone|android(?!.*tablet)/i.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

  // OS
  if (/windows nt/i.test(ua)) os = 'Windows'
  else if (/mac os x/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  // Browser
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/opera/i.test(ua)) browser = 'Opera'

  return { deviceType, os, browser }
}

// Password protection page
function getPasswordPage(shortCode: string, error = false): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Protegido - Revenify</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .lock-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    h1 { color: #1f2937; margin-bottom: 8px; font-size: 24px; }
    p { color: #6b7280; margin-bottom: 24px; }
    .error { color: #ef4444; font-size: 14px; margin-bottom: 16px; }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #667eea; }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
    .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="lock-icon">🔒</div>
    <h1>Link Protegido</h1>
    <p>Este link requer uma senha para acessar.</p>
    ${error ? '<p class="error">Senha incorreta. Tente novamente.</p>' : ''}
    <form method="GET">
      <input type="hidden" name="code" value="${shortCode}">
      <input type="password" name="pwd" placeholder="Digite a senha" required autofocus>
      <button type="submit">Acessar Link</button>
    </form>
    <p class="footer">Powered by <a href="https://revenify.co" target="_blank">Revenify</a></p>
  </div>
</body>
</html>`
}

// Link cloaking page (for bots/crawlers)
function getCloakedPage(link: ShortLinkData, destinationUrl: string): string {
  const title = link.cloaked_title || 'Revenify Link'
  const description = link.cloaked_description || ''
  const image = link.cloaked_image || ''
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
  <meta property="og:type" content="website">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
  
  <!-- Redirect for non-bots -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destinationUrl)}">
  <script>window.location.href = "${escapeJs(destinationUrl)}";</script>
</head>
<body>
  <p>Redirecionando...</p>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
}
