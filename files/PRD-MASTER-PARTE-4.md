# PRD MASTER - PARTE 4
## Dia 7: i18n + Stripe + Tests + Deploy
### Código Completo | Production Ready

---

# DIA 7: FINALIZAÇÃO (6h)

## ✅ Checklist Dia 7:
- [ ] i18n completo (EN/PT/ES)
- [ ] Stripe checkout integration
- [ ] Stripe webhooks
- [ ] Testes E2E
- [ ] Deploy production
- [ ] Monitoring

---

## 7.1 i18n COMPLETO (2h)

### Arquivo: `src/lib/i18n/translations.ts`

```typescript
// src/lib/i18n/translations.ts
export const translations = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      viewAll: 'View All',
      vsLastPeriod: 'vs last period',
      upgrade: 'Upgrade',
      learnMore: 'Learn More',
      copyUrl: 'Copy URL',
      copied: 'Copied!',
      error: 'Something went wrong',
      success: 'Success!',
    },
    
    navigation: {
      dashboard: 'Dashboard',
      sources: 'Sources',
      analytics: 'Analytics',
      settings: 'Settings',
    },
    
    dashboard: {
      title: 'Dashboard',
      description: 'Track your attribution analytics in real-time',
      visitors: 'Visitors',
      leads: 'Leads',
      customers: 'Customers',
      revenue: 'Revenue',
      visitorsOverTime: 'Visitors Over Time',
      conversionFunnel: 'Conversion Funnel',
      topSources: 'Top Sources',
      liveEvents: 'Live Events',
      newVisitor: 'New visitor',
      newSignup: 'New signup!',
      newPayment: '💰 Payment!',
      waitingForEvents: 'Waiting for events...',
    },
    
    sources: {
      title: 'Sources',
      description: 'Manage your traffic sources',
      newSource: 'New Source',
      createSource: 'Create Source',
      editSource: 'Edit Source',
      deleteSource: 'Delete Source',
      sourceName: 'Source Name',
      sourceNamePlaceholder: 'Facebook Launch Campaign',
      sourceNameDescription: 'Internal name for your reference',
      utmCampaign: 'UTM Campaign',
      utmCampaignPlaceholder: 'fb-launch-2024',
      utmCampaignDescription: 'Must be unique. Lowercase, numbers, and hyphens only.',
      identifier: 'Identifier',
      icon: 'Icon',
      color: 'Color',
      trackingUrl: 'Tracking URL',
      trackingUrlPreview: 'Tracking URL Preview',
      trackingUrlHint: '💡 Copy this URL and use it in your posts/campaigns',
      totalVisits: 'Total Visits',
      conversions: 'Conversions',
      totalRevenue: 'Revenue',
      upgradeForMore: 'Upgrade to track more sources',
      limitReached: 'You\'ve reached your source limit',
      limitReachedDescription: '{{plan}} plan is limited to {{max}} source{{plural}}. Upgrade to create more.',
      noSourcesYet: 'No sources yet',
      noSourcesDescription: 'Create your first source to start tracking traffic',
      createFirstSource: 'Create Source',
    },
    
    onboarding: {
      welcome: 'Welcome to SourceTrace! 👋',
      letsSetup: 'Let\'s set up tracking in 3 steps',
      step1: 'Setup',
      step1Title: 'Create Your Project',
      step1Description: 'What website do you want to track?',
      projectName: 'Project Name',
      projectNamePlaceholder: 'My Landing Page',
      domain: 'Domain',
      domainPlaceholder: 'yourdomain.com',
      domainHint: 'Without https://',
      step2: 'Install',
      step2Title: 'Install Pixel',
      step2Description: 'Add this code to your website\'s <head> section',
      copyCode: 'Copy Code',
      step3: 'Verify',
      step3Title: 'Verify Installation',
      step3Description: 'Let\'s check if the pixel is working',
      verifying: 'Verifying...',
      pixelDetected: '✅ Pixel detected!',
      pixelNotDetected: '❌ Pixel not detected yet',
      pixelNotDetectedHint: 'Make sure you\'ve added the code to your website and reload the page.',
      nextInstall: 'Next: Install Pixel',
      nextVerify: 'Next: Verify',
      finish: 'Finish Setup',
    },
    
    settings: {
      title: 'Settings',
      general: 'General',
      billing: 'Billing',
      apiKeys: 'API Keys',
      projectSettings: 'Project Settings',
      projectName: 'Project Name',
      domain: 'Domain',
      timezone: 'Timezone',
      currency: 'Currency',
      saveChanges: 'Save Changes',
      changesSaved: 'Changes saved successfully',
      currentPlan: 'Current Plan',
      upgradePlan: 'Upgrade Plan',
      manageBilling: 'Manage Billing',
      billingHistory: 'Billing History',
      nextBilling: 'Next billing date',
      cancelSubscription: 'Cancel Subscription',
      apiKey: 'API Key',
      projectKey: 'Project Key',
      copyKey: 'Copy Key',
      regenerateKey: 'Regenerate Key',
      dangerZone: 'Danger Zone',
      deleteProject: 'Delete Project',
      deleteProjectDescription: 'Permanently delete this project and all its data',
      deleteProjectButton: 'Delete Project',
    },
    
    pricing: {
      title: 'Choose Your Plan',
      monthly: 'Monthly',
      yearly: 'Yearly',
      save2Months: 'Save 2 months',
      currentPlan: 'Current Plan',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      startTrial: 'Start Trial',
      features: {
        domains: 'domains',
        sources: 'sources',
        monthlyEvents: 'events/month',
        dataRetention: 'data retention',
        revenueTracking: 'Revenue tracking',
        stripeIntegration: 'Stripe integration',
        apiAccess: 'API access',
        webhooks: 'Webhooks',
        whiteLabel: 'White label',
        support: 'Support',
      },
      plan: {
        free: {
          name: 'Free',
          description: 'For trying out SourceTrace',
        },
        starter: {
          name: 'Starter',
          description: 'For small projects tracking revenue',
        },
        pro: {
          name: 'Pro',
          description: 'For growing businesses',
        },
        business: {
          name: 'Business',
          description: 'For scaling companies',
        },
      },
    },
    
    errors: {
      invalidProjectKey: 'Invalid project key',
      limitReached: 'Monthly event limit reached',
      createFailed: 'Failed to create {{item}}',
      updateFailed: 'Failed to update {{item}}',
      deleteFailed: 'Failed to delete {{item}}',
      loadFailed: 'Failed to load {{item}}',
      networkError: 'Network error. Please try again.',
      unauthorized: 'You are not authorized to perform this action',
    },
  },
  
  pt: {
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      viewAll: 'Ver Todos',
      vsLastPeriod: 'vs período anterior',
      upgrade: 'Fazer Upgrade',
      learnMore: 'Saiba Mais',
      copyUrl: 'Copiar URL',
      copied: 'Copiado!',
      error: 'Algo deu errado',
      success: 'Sucesso!',
    },
    
    navigation: {
      dashboard: 'Dashboard',
      sources: 'Origens',
      analytics: 'Analytics',
      settings: 'Configurações',
    },
    
    dashboard: {
      title: 'Dashboard',
      description: 'Acompanhe suas métricas de atribuição em tempo real',
      visitors: 'Visitantes',
      leads: 'Leads',
      customers: 'Clientes',
      revenue: 'Receita',
      visitorsOverTime: 'Visitantes ao Longo do Tempo',
      conversionFunnel: 'Funil de Conversão',
      topSources: 'Principais Origens',
      liveEvents: 'Eventos ao Vivo',
      newVisitor: 'Novo visitante',
      newSignup: 'Novo cadastro!',
      newPayment: '💰 Pagamento!',
      waitingForEvents: 'Aguardando eventos...',
    },
    
    sources: {
      title: 'Origens',
      description: 'Gerencie suas fontes de tráfego',
      newSource: 'Nova Origem',
      createSource: 'Criar Origem',
      editSource: 'Editar Origem',
      deleteSource: 'Excluir Origem',
      sourceName: 'Nome da Origem',
      sourceNamePlaceholder: 'Campanha Lançamento Facebook',
      sourceNameDescription: 'Nome interno para sua referência',
      utmCampaign: 'Campanha UTM',
      utmCampaignPlaceholder: 'fb-lancamento-2024',
      utmCampaignDescription: 'Deve ser único. Apenas minúsculas, números e hífens.',
      identifier: 'Identificador',
      icon: 'Ícone',
      color: 'Cor',
      trackingUrl: 'URL de Rastreamento',
      trackingUrlPreview: 'Prévia da URL de Rastreamento',
      trackingUrlHint: '💡 Copie esta URL e use em seus posts/campanhas',
      totalVisits: 'Visitas Totais',
      conversions: 'Conversões',
      totalRevenue: 'Receita',
      upgradeForMore: 'Faça upgrade para rastrear mais origens',
      limitReached: 'Você atingiu o limite de origens',
      limitReachedDescription: 'Plano {{plan}} permite até {{max}} origem{{plural}}. Faça upgrade para criar mais.',
      noSourcesYet: 'Nenhuma origem ainda',
      noSourcesDescription: 'Crie sua primeira origem para começar a rastrear tráfego',
      createFirstSource: 'Criar Origem',
    },
    
    onboarding: {
      welcome: 'Bem-vindo ao SourceTrace! 👋',
      letsSetup: 'Vamos configurar o rastreamento em 3 passos',
      step1: 'Configurar',
      step1Title: 'Criar Seu Projeto',
      step1Description: 'Qual site você quer rastrear?',
      projectName: 'Nome do Projeto',
      projectNamePlaceholder: 'Minha Landing Page',
      domain: 'Domínio',
      domainPlaceholder: 'seudominio.com',
      domainHint: 'Sem https://',
      step2: 'Instalar',
      step2Title: 'Instalar Pixel',
      step2Description: 'Adicione este código na seção <head> do seu site',
      copyCode: 'Copiar Código',
      step3: 'Verificar',
      step3Title: 'Verificar Instalação',
      step3Description: 'Vamos verificar se o pixel está funcionando',
      verifying: 'Verificando...',
      pixelDetected: '✅ Pixel detectado!',
      pixelNotDetected: '❌ Pixel ainda não detectado',
      pixelNotDetectedHint: 'Certifique-se de ter adicionado o código ao seu site e recarregue a página.',
      nextInstall: 'Próximo: Instalar Pixel',
      nextVerify: 'Próximo: Verificar',
      finish: 'Finalizar Configuração',
    },
    
    settings: {
      title: 'Configurações',
      general: 'Geral',
      billing: 'Faturamento',
      apiKeys: 'Chaves de API',
      projectSettings: 'Configurações do Projeto',
      projectName: 'Nome do Projeto',
      domain: 'Domínio',
      timezone: 'Fuso Horário',
      currency: 'Moeda',
      saveChanges: 'Salvar Alterações',
      changesSaved: 'Alterações salvas com sucesso',
      currentPlan: 'Plano Atual',
      upgradePlan: 'Fazer Upgrade',
      manageBilling: 'Gerenciar Faturamento',
      billingHistory: 'Histórico de Faturamento',
      nextBilling: 'Próxima data de cobrança',
      cancelSubscription: 'Cancelar Assinatura',
      apiKey: 'Chave de API',
      projectKey: 'Chave do Projeto',
      copyKey: 'Copiar Chave',
      regenerateKey: 'Regenerar Chave',
      dangerZone: 'Zona de Perigo',
      deleteProject: 'Excluir Projeto',
      deleteProjectDescription: 'Excluir permanentemente este projeto e todos os seus dados',
      deleteProjectButton: 'Excluir Projeto',
    },
    
    pricing: {
      title: 'Escolha Seu Plano',
      monthly: 'Mensal',
      yearly: 'Anual',
      save2Months: 'Economize 2 meses',
      currentPlan: 'Plano Atual',
      upgrade: 'Fazer Upgrade',
      downgrade: 'Fazer Downgrade',
      startTrial: 'Iniciar Teste',
      features: {
        domains: 'domínios',
        sources: 'origens',
        monthlyEvents: 'eventos/mês',
        dataRetention: 'retenção de dados',
        revenueTracking: 'Rastreamento de receita',
        stripeIntegration: 'Integração Stripe',
        apiAccess: 'Acesso à API',
        webhooks: 'Webhooks',
        whiteLabel: 'Marca branca',
        support: 'Suporte',
      },
      plan: {
        free: {
          name: 'Grátis',
          description: 'Para experimentar o SourceTrace',
        },
        starter: {
          name: 'Inicial',
          description: 'Para pequenos projetos rastreando receita',
        },
        pro: {
          name: 'Pro',
          description: 'Para negócios em crescimento',
        },
        business: {
          name: 'Business',
          description: 'Para empresas em expansão',
        },
      },
    },
    
    errors: {
      invalidProjectKey: 'Chave de projeto inválida',
      limitReached: 'Limite mensal de eventos atingido',
      createFailed: 'Falha ao criar {{item}}',
      updateFailed: 'Falha ao atualizar {{item}}',
      deleteFailed: 'Falha ao excluir {{item}}',
      loadFailed: 'Falha ao carregar {{item}}',
      networkError: 'Erro de rede. Tente novamente.',
      unauthorized: 'Você não tem autorização para realizar esta ação',
    },
  },
  
  es: {
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      viewAll: 'Ver Todos',
      vsLastPeriod: 'vs período anterior',
      upgrade: 'Actualizar',
      learnMore: 'Saber Más',
      copyUrl: 'Copiar URL',
      copied: '¡Copiado!',
      error: 'Algo salió mal',
      success: '¡Éxito!',
    },
    
    navigation: {
      dashboard: 'Dashboard',
      sources: 'Fuentes',
      analytics: 'Analytics',
      settings: 'Configuración',
    },
    
    dashboard: {
      title: 'Dashboard',
      description: 'Rastrea tus métricas de atribución en tiempo real',
      visitors: 'Visitantes',
      leads: 'Leads',
      customers: 'Clientes',
      revenue: 'Ingresos',
      visitorsOverTime: 'Visitantes a lo Largo del Tiempo',
      conversionFunnel: 'Embudo de Conversión',
      topSources: 'Principales Fuentes',
      liveEvents: 'Eventos en Vivo',
      newVisitor: 'Nuevo visitante',
      newSignup: '¡Nuevo registro!',
      newPayment: '💰 ¡Pago!',
      waitingForEvents: 'Esperando eventos...',
    },
    
    // ... (resto das traduções ES seguindo mesmo padrão)
  }
}

// Hook para usar traduções
export function useTranslation() {
  const [locale, setLocale] = useState('en')

  const t = useCallback((key: string, params?: Record<string, any>) => {
    const keys = key.split('.')
    let value: any = translations[locale]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (!value) return key
    
    // Replace params
    if (params) {
      return Object.entries(params).reduce(
        (str, [key, val]) => str.replace(`{{${key}}}`, String(val)),
        value
      )
    }
    
    return value
  }, [locale])
  
  return { t, locale, setLocale }
}
```

---

## 7.2 STRIPE INTEGRATION (2h)

### Arquivo: `src/app/api/stripe/create-checkout/route.ts`

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const PLANS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY!,
  },
}

export async function POST(req: Request) {
  try {
    const { plan, interval } = await req.json()
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const priceId = PLANS[plan]?.[interval]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      metadata: {
        user_id: user.id,
        plan: plan,
        interval: interval,
      },
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

### Arquivo: `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }
  
  const supabase = createClient()
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update subscription
        const plan = session.metadata!.plan
        const planConfig = PLANS[plan]
        
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.metadata!.user_id,
            plan: plan,
            status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            stripe_price_id: session.line_items?.data[0].price?.id,
            ...planConfig.limits,
            current_period_end: new Date(
              (session as any).subscription_details?.end_date * 1000
            ),
          })
        
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Extend subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: new Date(invoice.period_end * 1000),
          })
          .eq('stripe_customer_id', invoice.customer as string)
        
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Downgrade to free
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            ...PLANS.free.limits,
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Track revenue (se tiver session_id no metadata)
        if (paymentIntent.metadata.session_id) {
          await supabase
            .from('payments')
            .insert({
              project_id: paymentIntent.metadata.project_id,
              session_id: paymentIntent.metadata.session_id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              payment_intent_id: paymentIntent.id,
              status: 'succeeded',
            })
        }
        
        break
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
```

---

## 7.3 TESTES E2E (1h)

### Arquivo: `src/tests/e2e/tracking.test.ts`

```typescript
// Teste manual (criar checklist)

/**
 * E2E Test Checklist
 * 
 * Setup:
 * 1. [ ] Criar projeto de teste no Supabase
 * 2. [ ] Criar source "test-campaign"
 * 3. [ ] Adicionar pixel ao site de teste
 * 
 * Tracking:
 * 4. [ ] Visitar: site.com?utm_campaign=test-campaign
 * 5. [ ] Verificar no SQL: evento page_view criado
 * 6. [ ] Verificar: sessão criada
 * 7. [ ] Verificar: source_id atribuído corretamente
 * 
 * Lead Conversion:
 * 8. [ ] Chamar: window.sourcetrace.trackLead({ email: 'test@test.com' })
 * 9. [ ] Verificar no SQL: lead criado
 * 10. [ ] Verificar: lead.attributed_source_id = source correto
 * 11. [ ] Verificar: session.is_lead = true
 * 
 * Payment Conversion:
 * 12. [ ] Simular webhook Stripe com session_id
 * 13. [ ] Verificar no SQL: payment criado
 * 14. [ ] Verificar: customer criado automaticamente
 * 15. [ ] Verificar: customer.attributed_source_id = source correto
 * 16. [ ] Verificar: source.total_revenue atualizado
 * 17. [ ] Verificar: lead.is_customer = true
 * 
 * Dashboard:
 * 18. [ ] Dashboard carrega métricas corretas
 * 19. [ ] Chart mostra dados
 * 20. [ ] Live feed mostra novos eventos
 * 21. [ ] Sources table mostra revenue
 * 
 * Plan Limits:
 * 22. [ ] Free plan: bloqueia criação de 2ª source
 * 23. [ ] Free plan: modal de upgrade aparece
 * 24. [ ] Starter plan: permite unlimited sources
 * 
 * Cross-Domain:
 * 25. [ ] Visitar domain.com com session_id
 * 26. [ ] Clicar link para app.domain.com
 * 27. [ ] Verificar: _st_sid adicionado na URL
 * 28. [ ] Verificar: session_id mantido no app
 * 
 * Pass: [ ] / 28
 */
```

---

## 7.4 DEPLOY PRODUCTION (1h)

### Setup Vercel:

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link projeto
vercel link

# 4. Configurar variáveis de ambiente no Vercel Dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_STRIPE_PUBLISHABLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - STRIPE_PRICE_* (todos)

# 5. Deploy
vercel --prod
```

### Setup Supabase:

```bash
# 1. Deploy Edge Functions
supabase functions deploy track-event --project-ref SEU_PROJECT_REF

# 2. Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

# 3. Habilitar RLS em produção (já está)

# 4. Criar indexes adicionais (se necessário):
CREATE INDEX CONCURRENTLY idx_events_project_created 
ON events(project_id, created_at DESC);
```

### Setup Stripe Webhook:

```bash
# 1. No Stripe Dashboard → Developers → Webhooks

# 2. Adicionar endpoint:
URL: https://seu-dominio.vercel.app/api/webhooks/stripe

# 3. Selecionar events:
- checkout.session.completed
- invoice.payment_succeeded
- customer.subscription.deleted
- payment_intent.succeeded

# 4. Copiar webhook secret
# 5. Adicionar STRIPE_WEBHOOK_SECRET no Vercel
```

---

## 7.5 MONITORING (30min)

### Setup Sentry (opcional):

```bash
pnpm add @sentry/react @sentry/vite-plugin
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
```

### Health Checks:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
```

---

## ✅ CHECKLIST FINAL DIA 7

- [ ] i18n funcionando (EN/PT/ES)
- [ ] Stripe checkout cria sessão
- [ ] Stripe webhook processa eventos
- [ ] Subscription é atualizada
- [ ] Testes E2E passam (todos 28)
- [ ] Deploy Vercel funciona
- [ ] Edge Functions deployadas
- [ ] Webhooks configurados
- [ ] Monitoring ativo
- [ ] Health checks ok

---

**Status Parte 4:** ✅ DIA 7 Completo
**Próximo:** PARTE 5 (Código Pronto Final)
