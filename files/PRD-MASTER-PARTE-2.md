# PRD MASTER - PARTE 2
## Dias 3-4: Edge Functions + UI Components
### Código Completo | Copy-Paste Ready | Zero Ambiguidade

---

# DIA 3: EDGE FUNCTIONS & PIXEL TRACKING (6h)

## ✅ Checklist Dia 3:
- [ ] Criar pixel.js (JavaScript SDK)
- [ ] Criar Edge Function track-event
- [ ] Deploy Edge Function
- [ ] Testar tracking end-to-end
- [ ] Criar queries helpers avançados

---

## 3.1 PIXEL TRACKING SDK (2h)

### Arquivo: `public/pixel/pixel.js`

**Código completo:**

```javascript
/**
 * SourceTrace Tracking Pixel
 * Version: 1.0.0
 * 
 * Usage:
 * <script>
 *   window.sourcetrace = { projectKey: 'pk_live_...' };
 * </script>
 * <script src="https://cdn.sourcetrace.io/pixel.js" async></script>
 */

(function() {
  'use strict';

  // Config
  const config = window.sourcetrace || {};
  const projectKey = config.projectKey;
  
  if (!projectKey) {
    console.error('[SourceTrace] Project key não encontrado');
    return;
  }

  const API_URL = config.apiUrl || 'https://seu-projeto.supabase.co/functions/v1/track-event';
  
  // ===================================
  // FINGERPRINTING & SESSION ID
  // ===================================
  
  function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('SourceTrace', 2, 2);
    
    return canvas.toDataURL().slice(-50);
  }
  
  function getOrCreateSessionId() {
    const COOKIE_NAME = 'st_session';
    const STORAGE_KEY = 'st_session_id';
    
    // Tentar recuperar de cookie
    let sessionId = getCookie(COOKIE_NAME);
    
    if (!sessionId) {
      // Tentar recuperar de localStorage
      sessionId = localStorage.getItem(STORAGE_KEY);
    }
    
    if (!sessionId) {
      // Criar novo session ID
      const fingerprint = generateFingerprint();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      
      sessionId = `st_${timestamp}_${fingerprint}_${random}`;
      
      // Salvar em ambos
      setCookie(COOKIE_NAME, sessionId, 30);
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  }
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  // ===================================
  // CROSS-DOMAIN TRACKING
  // ===================================
  
  function setupCrossDomainTracking(sessionId) {
    const mainDomain = window.location.hostname;
    
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;
      
      try {
        const url = new URL(link.href, window.location.href);
        
        // Verificar se é mesmo domínio raiz mas subdomínio diferente
        if (url.hostname !== mainDomain && isSameDomainFamily(url.hostname, mainDomain)) {
          // Adicionar session_id na URL
          url.searchParams.set('_st_sid', sessionId);
          link.href = url.toString();
        }
      } catch (e) {
        // URL inválida, ignorar
      }
    });
  }
  
  function isSameDomainFamily(domain1, domain2) {
    const root1 = domain1.split('.').slice(-2).join('.');
    const root2 = domain2.split('.').slice(-2).join('.');
    return root1 === root2;
  }
  
  function recoverSessionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('_st_sid');
    
    if (urlSessionId) {
      // Salvar session ID recuperado
      setCookie('st_session', urlSessionId, 30);
      localStorage.setItem('st_session_id', urlSessionId);
      
      // Limpar URL (remover parâmetro)
      params.delete('_st_sid');
      const newUrl = window.location.pathname + 
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
      
      return urlSessionId;
    }
    
    return null;
  }
  
  // ===================================
  // UTM PARAMETERS
  // ===================================
  
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
    };
  }
  
  // ===================================
  // DEVICE & BROWSER INFO
  // ===================================
  
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    
    // Detecção básica de device type
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = /iPad/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    return {
      device_type: deviceType,
      user_agent: ua,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language,
    };
  }
  
  // ===================================
  // TRACKING
  // ===================================
  
  function track(eventType, data = {}) {
    const sessionId = recoverSessionFromURL() || getOrCreateSessionId();
    const utm = getUtmParams();
    const device = getDeviceInfo();
    
    const payload = {
      project_key: projectKey,
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer || null,
      ...utm,
      ...device,
      ...data,
    };
    
    // Enviar via beacon (não bloqueia página)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
    } else {
      // Fallback para fetch
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => {
        console.error('[SourceTrace] Tracking error:', err);
      });
    }
  }
  
  // ===================================
  // AUTO-TRACKING
  // ===================================
  
  // Track page view automaticamente
  function trackPageView() {
    track('page_view');
  }
  
  // Track session start
  function trackSessionStart() {
    const SESSION_KEY = 'st_session_start';
    const lastStart = localStorage.getItem(SESSION_KEY);
    const now = Date.now();
    
    // Nova sessão se passou mais de 30 min
    if (!lastStart || (now - parseInt(lastStart)) > 30 * 60 * 1000) {
      track('session_start');
      localStorage.setItem(SESSION_KEY, now.toString());
    }
  }
  
  // ===================================
  // PUBLIC API
  // ===================================
  
  window.sourcetrace = {
    projectKey: projectKey,
    
    // Obter session ID atual
    getSessionId: function() {
      return getOrCreateSessionId();
    },
    
    // Track lead (signup)
    trackLead: function(data) {
      track('signup', {
        email: data.email,
        name: data.name || null,
      });
    },
    
    // Track custom event
    track: function(eventName, data) {
      track(eventName, data);
    },
  };
  
  // ===================================
  // INITIALIZATION
  // ===================================
  
  function init() {
    const sessionId = getOrCreateSessionId();
    
    // Setup cross-domain
    setupCrossDomainTracking(sessionId);
    
    // Track session start
    trackSessionStart();
    
    // Track page view
    trackPageView();
    
    console.log('[SourceTrace] Initialized', { sessionId, projectKey });
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
```

**✓ Verificação:**
```html
<!-- Testar em index.html -->
<script>
  window.sourcetrace = {
    projectKey: 'pk_test_abc123',
    apiUrl: 'http://localhost:54321/functions/v1/track-event'
  };
</script>
<script src="/pixel/pixel.js"></script>

<!-- Console deve mostrar: -->
<!-- [SourceTrace] Initialized { sessionId: "st_...", projectKey: "pk_test_..." } -->
```

---

## 3.2 EDGE FUNCTION (2h)

### Arquivo: `supabase/functions/track-event/index.ts`

**Código completo:**

```typescript
// supabase/functions/track-event/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackingPayload {
  project_key: string
  session_id: string
  event_type: string
  page_url: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  device_type?: string
  user_agent?: string
  screen_width?: number
  screen_height?: number
  language?: string
  email?: string  // Para signup events
  name?: string   // Para signup events
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse body
    const payload: TrackingPayload = await req.json()

    // Validar project_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('project_key', payload.project_key)
      .eq('is_active', true)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Invalid project key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar limites do plano
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('max_monthly_events, current_monthly_events')
      .eq('user_id', project.user_id)
      .single()

    if (subscription) {
      if (subscription.current_monthly_events >= subscription.max_monthly_events) {
        return new Response(
          JSON.stringify({ error: 'Monthly event limit reached' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Enriquecer dados
    const enrichedData = await enrichEventData(req, payload)

    // Inserir evento
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        project_id: project.id,
        session_id: payload.session_id,
        event_type: payload.event_type,
        page_url: payload.page_url,
        referrer: payload.referrer,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_term: payload.utm_term,
        utm_content: payload.utm_content,
        country_code: enrichedData.country_code,
        city: enrichedData.city,
        device_type: payload.device_type,
        browser: enrichedData.browser,
        os: enrichedData.os,
        ip_address: enrichedData.ip_address,
      })

    if (eventError) {
      console.error('Event insert error:', eventError)
      throw eventError
    }

    // Se for signup, criar lead
    if (payload.event_type === 'signup' && payload.email) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          project_id: project.id,
          session_id: payload.session_id,
          email: payload.email,
          name: payload.name,
        })

      if (leadError) {
        console.error('Lead insert error:', leadError)
      }
    }

    // Incrementar contador de eventos
    if (subscription) {
      await supabase
        .from('subscriptions')
        .update({ 
          current_monthly_events: subscription.current_monthly_events + 1 
        })
        .eq('user_id', project.user_id)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ===================================
// ENRIQUECIMENTO DE DADOS
// ===================================

async function enrichEventData(req: Request, payload: TrackingPayload) {
  // IP Address
  const ip_address = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

  // Cloudflare headers (geolocalização)
  const country_code = req.headers.get('cf-ipcountry') || null
  const city = req.headers.get('cf-ipcity') || null

  // Parse User-Agent
  const userAgent = payload.user_agent || req.headers.get('user-agent') || ''
  const { browser, os } = parseUserAgent(userAgent)

  return {
    ip_address,
    country_code,
    city,
    browser,
    os,
  }
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown'
  let os = 'Unknown'

  // Browser detection
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edge')) browser = 'Edge'

  // OS detection
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS'

  return { browser, os }
}
```

**Deploy:**
```bash
# Deploy para Supabase
supabase functions deploy track-event

# Testar
curl -X POST https://seu-projeto.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "project_key": "pk_test_abc123",
    "session_id": "test_session",
    "event_type": "page_view",
    "page_url": "https://test.com",
    "utm_campaign": "test-campaign"
  }'
```

**✓ Verificação:**
```sql
-- Ver eventos inseridos
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;

-- Ver sessões criadas
SELECT * FROM sessions ORDER BY started_at DESC LIMIT 10;
```

---

## 3.3 QUERIES HELPERS AVANÇADOS (1h)

### Arquivo: `src/lib/supabase/queries.ts`

**Adicionar queries avançados:**

```typescript
// src/lib/supabase/queries.ts (adicionar ao existente)

// ===================================
// REAL-TIME SUBSCRIPTIONS
// ===================================

export function subscribeToEvents(
  projectId: string,
  callback: (event: any) => void
) {
  const supabase = createClient()
  
  const channel = supabase
    .channel('events-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

// ===================================
// DASHBOARD METRICS
// ===================================

export async function getDashboardMetrics(
  projectId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = createClient()
  
  // Total visitors (unique sessions)
  const { count: totalVisitors } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString())
  
  // Total leads
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  // Total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  // Total revenue
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('project_id', projectId)
    .eq('status', 'succeeded')
    .gte('paid_at', startDate.toISOString())
    .lte('paid_at', endDate.toISOString())
  
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  
  // Previous period (para calcular trends)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
  const prevEndDate = new Date(startDate)
  
  const { count: prevVisitors } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('started_at', prevStartDate.toISOString())
    .lte('started_at', prevEndDate.toISOString())
  
  const { count: prevLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString())
  
  const { count: prevCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString())
  
  const { data: prevPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('project_id', projectId)
    .eq('status', 'succeeded')
    .gte('paid_at', prevStartDate.toISOString())
    .lte('paid_at', prevEndDate.toISOString())
  
  const prevRevenue = prevPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  
  // Calculate trends
  const visitorsTrend = prevVisitors ? ((totalVisitors! - prevVisitors) / prevVisitors) * 100 : 0
  const leadsTrend = prevLeads ? ((totalLeads! - prevLeads) / prevLeads) * 100 : 0
  const customersTrend = prevCustomers ? ((totalCustomers! - prevCustomers) / prevCustomers) * 100 : 0
  const revenueTrend = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
  
  return {
    totalVisitors: totalVisitors || 0,
    totalLeads: totalLeads || 0,
    totalCustomers: totalCustomers || 0,
    totalRevenue,
    conversionRate: totalVisitors ? (totalCustomers! / totalVisitors) * 100 : 0,
    visitorsTrend: Math.round(visitorsTrend * 10) / 10,
    leadsTrend: Math.round(leadsTrend * 10) / 10,
    customersTrend: Math.round(customersTrend * 10) / 10,
    revenueTrend: Math.round(revenueTrend * 10) / 10,
  }
}

// ===================================
// CHART DATA
// ===================================

export async function getVisitorsChartData(
  projectId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('created_at')
    .eq('project_id', projectId)
    .eq('event_type', 'page_view')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Agrupar por dia
  const dayGroups = new Map<string, number>()
  
  data?.forEach(event => {
    const date = new Date(event.created_at)
    const dayKey = date.toISOString().split('T')[0]
    dayGroups.set(dayKey, (dayGroups.get(dayKey) || 0) + 1)
  })
  
  // Converter para array
  const chartData = Array.from(dayGroups.entries()).map(([date, count]) => ({
    date,
    visitors: count,
  }))
  
  return chartData
}

// ===================================
// TOP SOURCES
// ===================================

export async function getTopSources(projectId: string, limit = 5) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('source_stats')
    .select('*')
    .eq('project_id', projectId)
    .order('revenue', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ===================================
// CONVERSION FUNNEL
// ===================================

export async function getConversionFunnel(projectId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('conversion_funnel')
    .select('*')
    .eq('project_id', projectId)
    .single()
  
  if (error) throw error
  return data
}
```

**✓ Verificação:**
```typescript
// Testar queries
const metrics = await getDashboardMetrics(projectId, startDate, endDate)
console.log('Metrics:', metrics)
// { totalVisitors: 1234, totalLeads: 68, ... }

const chartData = await getVisitorsChartData(projectId, startDate, endDate)
console.log('Chart:', chartData)
// [{ date: '2024-01-01', visitors: 123 }, ...]
```

---

## 3.4 TESTAR END-TO-END (1h)

### Cenário Completo de Teste:

**1. Setup:**
```html
<!-- index.html -->
<script>
  window.sourcetrace = {
    projectKey: 'pk_test_abc123',
    apiUrl: 'http://localhost:54321/functions/v1/track-event'
  };
</script>
<script src="/pixel/pixel.js"></script>

<button onclick="testSignup()">Test Signup</button>

<script>
  function testSignup() {
    window.sourcetrace.trackLead({
      email: 'test@example.com',
      name: 'Test User'
    });
    alert('Signup tracked!');
  }
</script>
```

**2. Visitar página:**
```
http://localhost:5173?utm_source=facebook&utm_campaign=test-2024
```

**3. Verificar no Supabase:**
```sql
-- Ver evento page_view
SELECT * FROM events 
WHERE utm_campaign = 'test-2024' 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver sessão criada
SELECT * FROM sessions 
WHERE utm_campaign = 'test-2024'
ORDER BY started_at DESC
LIMIT 1;

-- Ver source atribuída
SELECT s.* FROM sources s
JOIN events e ON e.source_id = s.id
WHERE e.utm_campaign = 'test-2024'
LIMIT 1;
```

**4. Clicar "Test Signup"**

**5. Verificar lead:**
```sql
SELECT * FROM leads
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**✓ Checklist:**
- [ ] Pixel carrega sem erros
- [ ] Session ID é gerado
- [ ] Evento page_view é enviado
- [ ] Source é atribuída corretamente (via utm_campaign)
- [ ] Sessão é criada/atualizada
- [ ] Signup cria lead
- [ ] Lead herda source_id da sessão

---

# DIA 4: UI COMPONENTS (6h)

## ✅ Checklist Dia 4:
- [ ] MetricCard component
- [ ] VisitorsChart component
- [ ] LiveEventsFeed component
- [ ] SourcesTable component
- [ ] ConversionFunnel component
- [ ] CreateSourceDialog component
- [ ] UpgradeModal component

---

## 4.1 METRIC CARD (45min)

### Arquivo: `src/components/dashboard/metric-card.tsx`

```typescript
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  color?: 'blue' | 'green' | 'purple' | 'orange'
  loading?: boolean
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    icon: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
    trend: 'text-green-600 dark:text-green-400',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950',
    trend: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
    trend: 'text-orange-600 dark:text-orange-400',
  },
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = trend && trend.value >= 0 ? TrendingUp : TrendingDown
  const trendColor = trend && trend.value >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorClasses[color].icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <TrendIcon className={cn('h-3 w-3', trendColor)} />
            <span className={trendColor}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Usage:**
```tsx
<MetricCard
  title="Total Visitors"
  value="1,234"
  icon={Users}
  trend={{ value: 12.5, label: 'vs last period' }}
  color="blue"
/>
```

---

## 4.2 VISITORS CHART (1h)

### Arquivo: `src/components/dashboard/visitors-chart.tsx`

```typescript
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartDataPoint {
  date: string
  visitors: number
}

interface VisitorsChartProps {
  data: ChartDataPoint[]
  loading?: boolean
}

export function VisitorsChart({ data, loading = false }: VisitorsChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: format(new Date(point.date), 'MMM dd'),
    }))
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="formattedDate"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 4.3 LIVE EVENTS FEED (1h)

### Arquivo: `src/components/dashboard/live-events-feed.tsx`

```typescript
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { User, UserCheck, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { subscribeToEvents } from '@/lib/supabase/queries'
import { formatDistanceToNow } from 'date-fns'

interface LiveEvent {
  id: string
  event_type: string
  created_at: string
  utm_source?: string
  country_code?: string
}

interface LiveEventsFeedProps {
  projectId: string
}

export function LiveEventsFeed({ projectId }: LiveEventsFeedProps) {
  const [events, setEvents] = useState<LiveEvent[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToEvents(projectId, (newEvent) => {
      setEvents(prev => [newEvent, ...prev].slice(0, 10))
    })

    return unsubscribe
  }, [projectId])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <User className="h-4 w-4" />
      case 'signup':
        return <UserCheck className="h-4 w-4" />
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'page_view':
        return 'secondary'
      case 'signup':
        return 'default'
      case 'payment':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'page_view':
        return 'New visitor'
      case 'signup':
        return 'New signup!'
      case 'payment':
        return '💰 Payment!'
      default:
        return type
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔴 Live Events
          {events.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {events.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Waiting for events...
            </div>
          ) : (
            events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getEventLabel(event.event_type)}
                    </span>
                    {event.utm_source && (
                      <Badge variant={getEventColor(event.event_type)} className="text-xs">
                        {event.utm_source}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    {event.country_code && ` • ${event.country_code}`}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
```

---

*[CONTINUA na PARTE 3...]*

**Status Parte 2:** ✅ DIA 3 Completo, DIA 4 50% completo
**Próximo:** Completar DIA 4 + PARTE 3
**Total páginas até agora:** ~60
