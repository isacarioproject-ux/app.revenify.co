# 🚀 REVENIFY - PRD PARTE 6: MELHORIAS 2025

## ATUALIZAÇÃO COMPLETA + FEATURES MODERNAS
### Tooltips | Limites | Templates | URL Shortener | AI Assistant

---

**Versão:** 6.0  
**Data:** Dezembro 2025  
**Status:** ✅ Pronto para Implementação  
**Tempo Estimado:** DIA 8-10 (18h total)

---

# 📋 ÍNDICE

```
PARTE 6.1: TOOLTIPS INFORMATIVOS (2h)
PARTE 6.2: SISTEMA DE LIMITES E UPGRADE (3h)
PARTE 6.3: URL SHORTENER INTEGRADO (4h)
PARTE 6.4: TEMPLATES PAGE COM DIALOG (3h)
PARTE 6.5: AI ASSISTANT (EDGE FUNCTION) (4h)
PARTE 6.6: ATUALIZAÇÕES DE TABELAS (2h)
```

---

# 🎯 CONTEXTO

## O Que Já Temos (PRDs 1-5):
✅ Database completo (8 tabelas)  
✅ Pixel tracking funcional  
✅ Dashboard com métricas  
✅ Sources & Attribution  
✅ Stripe integration  
✅ i18n (EN/PT/ES)

## O Que Falta (Pedidos do Usuário):
❌ Tooltips explicativos em tudo  
❌ Sistema de contagem (eventos/links/projetos) com upgrade  
❌ Templates page bonita com dialog  
❌ URL Shortener integrado  
❌ AI Assistant para ajuda contextual  
❌ Melhor UX para usuários leigos

## Tendências 2025 Implementadas:
🔥 AI Assistant contextual (85% SaaS têm IA)  
🔥 Smart analytics com insights automáticos  
🔥 Interactive dashboards (42% usuários querem)  
🔥 Real-time collaborative features  
🔥 Predictive alerts e anomaly detection  
🔥 Embedded analytics avançado

---

# 6.1 TOOLTIPS INFORMATIVOS (2h)

## Objetivo

Adicionar tooltips **ELEGANTES** estilo dub.co/huly.io em TODAS as funções importantes do app para usuários leigos entenderem o que cada coisa faz.

---

## 6.1.1 COMPONENTE TOOLTIP UNIVERSAL (30min)

### Arquivo: `src/components/ui/info-tooltip.tsx`

```typescript
'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Info, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  content: React.ReactNode
  icon?: 'info' | 'help' | 'lightbulb' | 'alert'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  children?: React.ReactNode
  maxWidth?: number
}

export function InfoTooltip({
  content,
  icon = 'info',
  side = 'top',
  className,
  children,
  maxWidth = 300,
}: InfoTooltipProps) {
  const icons = {
    info: Info,
    help: HelpCircle,
    lightbulb: Lightbulb,
    alert: AlertCircle,
  }

  const Icon = icons[icon]

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center',
                'text-muted-foreground hover:text-foreground',
                'transition-colors',
                className
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          )}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className={cn(
              'z-50 overflow-hidden rounded-lg border bg-popover px-4 py-3 text-sm shadow-xl',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <div className="space-y-1.5">
              {typeof content === 'string' ? (
                <p className="text-foreground font-medium">{content}</p>
              ) : (
                content
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-border" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Tooltip com título + descrição
export function InfoTooltipRich({
  title,
  description,
  icon = 'info',
  side = 'top',
  className,
  children,
}: {
  title: string
  description: string
  icon?: 'info' | 'help' | 'lightbulb' | 'alert'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <InfoTooltip
      icon={icon}
      side={side}
      className={className}
      maxWidth={320}
      content={
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  )
}

// Tooltip com exemplo de código
export function InfoTooltipCode({
  title,
  description,
  code,
  side = 'top',
  className,
}: {
  title: string
  description: string
  code: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}) {
  return (
    <InfoTooltip
      icon="help"
      side={side}
      className={className}
      maxWidth={400}
      content={
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-foreground mb-1">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <pre className="bg-muted rounded-md p-2 text-xs font-mono overflow-x-auto">
            {code}
          </pre>
        </div>
      }
    />
  )
}
```

---

## 6.1.2 TOOLTIPS NO PROJETO (1h30)

### Dashboard Metrics

```typescript
// src/app/dashboard/page.tsx

<div className="grid gap-4 md:grid-cols-4">
  {/* Visitors Card */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle>Visitors</CardTitle>
        <InfoTooltipRich
          title="Total Visitors"
          description="Unique visitors tracked by their session ID. Each visitor is counted once per session, even if they visit multiple pages."
          icon="info"
        />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{metrics.totalVisitors}</div>
      {/* ... */}
    </CardContent>
  </Card>

  {/* Leads Card */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle>Leads</CardTitle>
        <InfoTooltipRich
          title="Qualified Leads"
          description="Users who completed a signup or registration form on your site. Automatically tracked when you call trackLead() with email."
          icon="info"
        />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{metrics.totalLeads}</div>
    </CardContent>
  </Card>

  {/* Revenue Card */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle>Revenue</CardTitle>
        <InfoTooltipRich
          title="Attributed Revenue"
          description="Total revenue from payments that were attributed to specific marketing sources. Synced automatically from your Stripe account."
          icon="info"
        />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {formatCurrency(metrics.totalRevenue, 'USD')}
      </div>
    </CardContent>
  </Card>

  {/* Conversion Rate Card */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <CardTitle>Conv. Rate</CardTitle>
        <InfoTooltipRich
          title="Conversion Rate"
          description="Percentage of visitors who became paying customers. Calculated as (Customers / Visitors) × 100."
          icon="help"
        />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {((metrics.totalCustomers / metrics.totalVisitors) * 100).toFixed(1)}%
      </div>
    </CardContent>
  </Card>
</div>
```

### Project Settings

```typescript
// src/app/projects/[id]/settings/page.tsx

<div className="space-y-6">
  {/* Project Key */}
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label>Project Key</Label>
      <InfoTooltipCode
        title="What is Project Key?"
        description="Your unique identifier used to track events. Add this to your website's pixel code."
        code={`<script>
window.revenify = { projectKey: '${project.project_key}' }
</script>`}
      />
    </div>
    <div className="flex gap-2">
      <Input value={project.project_key} readOnly />
      <Button onClick={() => copy(project.project_key)}>
        Copy
      </Button>
    </div>
  </div>

  {/* Pixel Code */}
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label>Pixel Installation</Label>
      <InfoTooltipRich
        title="Installing Your Tracking Pixel"
        description="Copy this code and paste it just before the closing </head> tag on every page you want to track. The pixel will automatically start collecting visitor data."
        icon="lightbulb"
      />
    </div>
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
      <code>{pixelCode}</code>
    </pre>
  </div>
</div>
```

### Sources Page

```typescript
// src/app/sources/page.tsx

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>
        <div className="flex items-center gap-2">
          Source Name
          <InfoTooltip
            content="The marketing channel or campaign that brought traffic to your site"
            icon="info"
          />
        </div>
      </TableHead>
      <TableHead>
        <div className="flex items-center gap-2">
          UTM Campaign
          <InfoTooltipRich
            title="UTM Campaign Parameter"
            description="The campaign identifier added to your links (utm_campaign=). Used to automatically attribute visitors to this source."
            icon="help"
          />
        </div>
      </TableHead>
      <TableHead>
        <div className="flex items-center gap-2">
          Visitors
          <InfoTooltip
            content="Total unique visitors from this source"
            icon="info"
          />
        </div>
      </TableHead>
      <TableHead>
        <div className="flex items-center gap-2">
          Revenue
          <InfoTooltip
            content="Total revenue attributed to this source"
            icon="info"
          />
        </div>
      </TableHead>
      <TableHead>
        <div className="flex items-center gap-2">
          ROI
          <InfoTooltipRich
            title="Return on Investment"
            description="Calculated as (Revenue - Cost) / Cost × 100. Shows how profitable this source is."
            icon="lightbulb"
          />
        </div>
      </TableHead>
    </TableRow>
  </TableHeader>
  {/* ... */}
</Table>
```

---

## 6.1.3 MAPA DE TOOLTIPS (Referência Rápida)

```typescript
// src/lib/tooltips.ts

export const TOOLTIPS = {
  // Dashboard
  visitors: {
    title: 'Total Visitors',
    description: 'Unique visitors tracked by session ID. Each visitor counted once per session.',
  },
  leads: {
    title: 'Qualified Leads',
    description: 'Users who completed signup/registration. Tracked via trackLead() calls.',
  },
  revenue: {
    title: 'Attributed Revenue',
    description: 'Total revenue from payments attributed to marketing sources via Stripe.',
  },
  conversionRate: {
    title: 'Conversion Rate',
    description: 'Percentage of visitors who became paying customers (Customers/Visitors×100).',
  },

  // Project Settings
  projectKey: {
    title: 'Project Key',
    description: 'Unique identifier for tracking events. Add to your pixel code.',
    code: `window.revenify = { projectKey: 'pk_...' }`,
  },
  pixelCode: {
    title: 'Tracking Pixel',
    description: 'JavaScript snippet that collects visitor data. Paste before </head>.',
  },

  // Sources
  sourceName: {
    title: 'Source Name',
    description: 'Marketing channel or campaign that brought traffic.',
  },
  utmCampaign: {
    title: 'UTM Campaign',
    description: 'Campaign identifier in links (utm_campaign=). Used for auto-attribution.',
  },
  roi: {
    title: 'Return on Investment',
    description: 'Profitability metric: (Revenue - Cost) / Cost × 100.',
  },

  // Templates (nova feature)
  templateName: {
    title: 'Template Name',
    description: 'Friendly name to identify this UTM template.',
  },
  utmSource: {
    title: 'UTM Source',
    description: 'Where traffic is coming from (e.g., google, facebook, newsletter).',
  },
  utmMedium: {
    title: 'UTM Medium',
    description: 'Marketing medium (e.g., cpc, email, social, referral).',
  },
  utmTerm: {
    title: 'UTM Term',
    description: 'Paid search keywords (optional). Used for PPC campaigns.',
  },
  utmContent: {
    title: 'UTM Content',
    description: 'Differentiate similar content (e.g., logo-link vs text-link).',
  },
  utmReferral: {
    title: 'UTM Referral',
    description: 'Specific referrer URL (optional). Track affiliate partners.',
  },

  // URL Shortener (nova feature)
  shortLink: {
    title: 'Short Link',
    description: 'Branded short URL that redirects to your destination. Trackable and shareable.',
  },
  clicks: {
    title: 'Total Clicks',
    description: 'Number of times this short link was clicked.',
  },
  qrCode: {
    title: 'QR Code',
    description: 'Scannable QR code for offline campaigns. Generated automatically.',
  },
}
```

---

# 6.2 SISTEMA DE LIMITES E UPGRADE (3h)

## Objetivo

Implementar **sistema de contagem de uso** (eventos, short links, projetos) com **hover mostrando próximo plano** igual ao dub.co, e **gatilhos para upgrade** quando o limite é atingido.

---

## 6.2.1 ATUALIZAR SCHEMA (30min)

### Migration SQL:

```sql
-- =============================================
-- USAGE TRACKING & LIMITS
-- =============================================

-- Adicionar campos de uso aos projetos
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS events_count_current_month INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS short_links_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela de uso histórico (para analytics)
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- '2025-01'
  events_count INT DEFAULT 0,
  short_links_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, month_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usage_history_project 
ON usage_history(project_id, month_year DESC);

-- Tabela de limites por plano
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'business'
  events_per_month INT NOT NULL,
  short_links_limit INT NOT NULL,
  projects_limit INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir limites padrão
INSERT INTO plan_limits (plan_name, events_per_month, short_links_limit, projects_limit)
VALUES
  ('free', 10000, 25, 1),
  ('starter', 100000, 100, 3),
  ('pro', 500000, 500, 10),
  ('business', 2000000, 2000, 50)
ON CONFLICT (plan_name) DO NOTHING;

-- Function para resetar contagem mensal
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Salvar histórico
  INSERT INTO usage_history (project_id, month_year, events_count, short_links_count)
  SELECT 
    id,
    TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM'),
    events_count_current_month,
    short_links_count
  FROM projects
  WHERE events_count_current_month > 0 OR short_links_count > 0;

  -- Resetar contadores
  UPDATE projects
  SET events_count_current_month = 0,
      last_reset_at = NOW();
END;
$$;

-- Trigger para incrementar contador de eventos
CREATE OR REPLACE FUNCTION increment_events_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET events_count_current_month = events_count_current_month + 1
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_events ON events;
CREATE TRIGGER trigger_increment_events
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION increment_events_counter();

-- Function para checar limites
CREATE OR REPLACE FUNCTION check_usage_limits(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_project RECORD;
  v_limits RECORD;
  v_result JSON;
BEGIN
  -- Buscar projeto
  SELECT p.*, u.plan
  INTO v_project
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE p.id = p_project_id;

  -- Buscar limites do plano
  SELECT *
  INTO v_limits
  FROM plan_limits
  WHERE plan_name = v_project.plan;

  -- Retornar JSON com status
  SELECT json_build_object(
    'events', json_build_object(
      'used', v_project.events_count_current_month,
      'limit', v_limits.events_per_month,
      'percentage', ROUND((v_project.events_count_current_month::FLOAT / v_limits.events_per_month::FLOAT) * 100, 1),
      'exceeded', v_project.events_count_current_month >= v_limits.events_per_month
    ),
    'short_links', json_build_object(
      'used', v_project.short_links_count,
      'limit', v_limits.short_links_limit,
      'percentage', ROUND((v_project.short_links_count::FLOAT / v_limits.short_links_limit::FLOAT) * 100, 1),
      'exceeded', v_project.short_links_count >= v_limits.short_links_limit
    ),
    'projects', json_build_object(
      'used', (SELECT COUNT(*) FROM projects WHERE user_id = v_project.user_id),
      'limit', v_limits.projects_limit,
      'exceeded', (SELECT COUNT(*) FROM projects WHERE user_id = v_project.user_id) >= v_limits.projects_limit
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

---

## 6.2.2 USAGE WIDGET NO SIDEBAR (1h)

### Arquivo: `src/components/layout/usage-widget.tsx`

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Zap, TrendingUp, Link as LinkIcon } from 'lucide-react'
import { useUsage } from '@/hooks/use-usage'
import { cn } from '@/lib/utils'

interface UsageWidgetProps {
  projectId: string
}

export function UsageWidget({ projectId }: UsageWidgetProps) {
  const { usage, limits, isLoading } = useUsage(projectId)

  if (isLoading) return null

  const eventsPercentage = (usage.events / limits.events) * 100
  const linksPercentage = (usage.shortLinks / limits.shortLinks) * 100
  const projectsPercentage = (usage.projects / limits.projects) * 100

  const isNearLimit = eventsPercentage > 80 || linksPercentage > 80
  const hasExceeded = eventsPercentage >= 100 || linksPercentage >= 100

  return (
    <Card className={cn(
      'border-2',
      hasExceeded && 'border-destructive bg-destructive/5',
      isNearLimit && !hasExceeded && 'border-yellow-500/50 bg-yellow-500/5'
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Usage This Month</h3>
          <InfoTooltip
            content="Your plan usage resets on the 1st of each month"
            icon="info"
          />
        </div>

        {/* Events */}
        <UsageMetric
          icon={Zap}
          label="Events"
          used={usage.events}
          limit={limits.events}
          percentage={eventsPercentage}
          nextPlan={getNextPlan(limits.plan, 'events')}
        />

        {/* Short Links */}
        <UsageMetric
          icon={LinkIcon}
          label="Short Links"
          used={usage.shortLinks}
          limit={limits.shortLinks}
          percentage={linksPercentage}
          nextPlan={getNextPlan(limits.plan, 'links')}
        />

        {/* Projects */}
        <UsageMetric
          icon={TrendingUp}
          label="Projects"
          used={usage.projects}
          limit={limits.projects}
          percentage={projectsPercentage}
          nextPlan={getNextPlan(limits.plan, 'projects')}
          hideProgress
        />

        {/* CTA */}
        {(isNearLimit || hasExceeded) && (
          <Button
            className="w-full"
            variant={hasExceeded ? 'default' : 'outline'}
            size="sm"
          >
            {hasExceeded ? 'Upgrade Now' : 'Upgrade Plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface UsageMetricProps {
  icon: React.ElementType
  label: string
  used: number
  limit: number
  percentage: number
  nextPlan?: { name: string; limit: number; price: number }
  hideProgress?: boolean
}

function UsageMetric({
  icon: Icon,
  label,
  used,
  limit,
  percentage,
  nextPlan,
  hideProgress = false,
}: UsageMetricProps) {
  const isExceeded = percentage >= 100
  const isWarning = percentage >= 80 && percentage < 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{label}</span>
        </div>
        <div className="group relative">
          <span className={cn(
            'font-mono text-xs',
            isExceeded && 'text-destructive font-semibold',
            isWarning && 'text-yellow-600 font-semibold'
          )}>
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>

          {/* Hover Tooltip com próximo plano */}
          {nextPlan && (
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50">
              <div className="bg-popover border rounded-lg shadow-xl p-3 w-64">
                <p className="text-xs font-semibold mb-1">Need more {label.toLowerCase()}?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Upgrade to <strong>{nextPlan.name}</strong> for {nextPlan.limit.toLocaleString()} {label.toLowerCase()}/month
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    ${nextPlan.price}
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </span>
                  <Button size="sm" variant="default" className="h-7 text-xs">
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!hideProgress && (
        <Progress
          value={Math.min(percentage, 100)}
          className={cn(
            'h-1.5',
            isExceeded && '[&>div]:bg-destructive',
            isWarning && '[&>div]:bg-yellow-500'
          )}
        />
      )}
    </div>
  )
}

// Helper para determinar próximo plano
function getNextPlan(currentPlan: string, metric: 'events' | 'links' | 'projects') {
  const plans = {
    free: {
      name: 'Starter',
      price: 29,
      events: 100000,
      links: 100,
      projects: 3,
    },
    starter: {
      name: 'Pro',
      price: 99,
      events: 500000,
      links: 500,
      projects: 10,
    },
    pro: {
      name: 'Business',
      price: 299,
      events: 2000000,
      links: 2000,
      projects: 50,
    },
  }

  const nextPlan = plans[currentPlan as keyof typeof plans]
  if (!nextPlan) return undefined

  return {
    name: nextPlan.name,
    price: nextPlan.price,
    limit: nextPlan[metric],
  }
}
```

### Hook: `src/hooks/use-usage.ts`

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Usage {
  events: number
  shortLinks: number
  projects: number
}

interface Limits {
  plan: string
  events: number
  shortLinks: number
  projects: number
}

export function useUsage(projectId: string) {
  const [usage, setUsage] = useState<Usage>({ events: 0, shortLinks: 0, projects: 0 })
  const [limits, setLimits] = useState<Limits>({ plan: 'free', events: 10000, shortLinks: 25, projects: 1 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUsage() {
      const supabase = createClient()

      // Buscar limites do projeto
      const { data, error } = await supabase
        .rpc('check_usage_limits', { p_project_id: projectId })

      if (!error && data) {
        setUsage({
          events: data.events.used,
          shortLinks: data.short_links.used,
          projects: data.projects.used,
        })
        setLimits({
          plan: 'free', // TODO: buscar do user
          events: data.events.limit,
          shortLinks: data.short_links.limit,
          projects: data.projects.limit,
        })
      }

      setIsLoading(false)
    }

    if (projectId) {
      fetchUsage()

      // Real-time updates
      const supabase = createClient()
      const channel = supabase
        .channel('usage-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${projectId}`,
          },
          () => {
            fetchUsage()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [projectId])

  return { usage, limits, isLoading }
}
```

---

## 6.2.3 LIMITE ATINGIDO - MODAL (30min)

### Arquivo: `src/components/modals/limit-reached-modal.tsx`

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  limitType: 'events' | 'links' | 'projects'
  currentPlan: string
}

export function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentPlan,
}: LimitReachedModalProps) {
  const messages = {
    events: {
      title: 'Event Limit Reached',
      description: "You've reached your monthly event tracking limit. Upgrade to continue tracking or wait until next month.",
      icon: Zap,
    },
    links: {
      title: 'Short Link Limit Reached',
      description: "You've created the maximum number of short links for your plan. Upgrade to create more.",
      icon: TrendingUp,
    },
    projects: {
      title: 'Project Limit Reached',
      description: "You've reached the maximum number of projects for your plan. Upgrade to create more.",
      icon: TrendingUp,
    },
  }

  const { title, description, icon: Icon } = messages[limitType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Current plan: <strong className="capitalize">{currentPlan}</strong>
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base">
          {description}
        </DialogDescription>

        <div className="grid gap-3 mt-4">
          <Button size="lg" className="w-full">
            View Upgrade Options
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={onClose}>
            I'll Upgrade Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Questions? <a href="/support" className="underline">Contact Support</a>
        </p>
      </DialogContent>
    </Dialog>
  )
}
```

---

# 6.3 URL SHORTENER INTEGRADO (4h)

## Objetivo

Implementar **URL Shortener profissional** completo integrado ao Revenify com:
- Links curtos branded (rvnfy.co/abc123)
- Analytics completo (clicks, devices, locations)
- QR Codes automáticos
- Integração com Sources & Attribution

---

## 6.3.1 SCHEMA DO URL SHORTENER (30min)

```sql
-- =============================================
-- URL SHORTENER
-- =============================================

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Link data
  short_code TEXT NOT NULL UNIQUE, -- 'abc123'
  destination_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Source attribution (opcional)
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  password_hash TEXT, -- Para links privados
  
  -- Analytics
  clicks_count INT DEFAULT 0,
  unique_clicks_count INT DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clicks
CREATE TABLE IF NOT EXISTS short_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  
  -- Visitor info
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  
  -- Parsed data
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  device_vendor TEXT, -- 'Apple', 'Samsung', etc
  os TEXT, -- 'iOS', 'Android', 'Windows', 'macOS'
  browser TEXT, -- 'Chrome', 'Safari', 'Firefox'
  
  -- Session tracking (se houver)
  session_id TEXT,
  
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_short_link_clicks_link_id (short_link_id, clicked_at DESC)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_short_links_project 
ON short_links(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_short_links_code 
ON short_links(short_code);

CREATE INDEX IF NOT EXISTS idx_short_links_source 
ON short_links(source_id) WHERE source_id IS NOT NULL;

-- Trigger para incrementar contador de clicks
CREATE OR REPLACE FUNCTION increment_short_link_clicks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE short_links
  SET 
    clicks_count = clicks_count + 1,
    last_clicked_at = NOW()
  WHERE id = NEW.short_link_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_short_link_clicks ON short_link_clicks;
CREATE TRIGGER trigger_increment_short_link_clicks
AFTER INSERT ON short_link_clicks
FOR EACH ROW
EXECUTE FUNCTION increment_short_link_clicks();

-- Function para gerar código único
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..7 LOOP
      code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM short_links WHERE short_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para incrementar contador de short links no projeto
CREATE OR REPLACE FUNCTION increment_short_links_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET short_links_count = short_links_count + 1
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_short_links ON short_links;
CREATE TRIGGER trigger_increment_short_links
AFTER INSERT ON short_links
FOR EACH ROW
EXECUTE FUNCTION increment_short_links_counter();
```

---

## 6.3.2 EDGE FUNCTION - REDIRECT (1h)

### Arquivo: `supabase/functions/redirect-short-link/index.ts`

```typescript
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

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const shortCode = url.pathname.split('/').pop()

    if (!shortCode) {
      return new Response('Short code is required', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar short link
    const { data: shortLink, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('short_code', shortCode)
      .single<ShortLinkData>()

    if (error || !shortLink) {
      return new Response('Link not found', {
        status: 404,
        headers: corsHeaders,
      })
    }

    // Checar se está ativo
    if (!shortLink.is_active) {
      return new Response('Link is no longer active', {
        status: 410,
        headers: corsHeaders,
      })
    }

    // Checar expiração
    if (shortLink.expires_at) {
      const expiresAt = new Date(shortLink.expires_at)
      if (expiresAt < new Date()) {
        return new Response('Link has expired', {
          status: 410,
          headers: corsHeaders,
        })
      }
    }

    // Parse User-Agent
    const userAgent = req.headers.get('user-agent') || ''
    const deviceInfo = parseUserAgent(userAgent)

    // Get IP (Deno Deploy)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               '0.0.0.0'

    // Get geo location (usando ipapi.co)
    let country = 'Unknown'
    let city = 'Unknown'
    
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        country = geoData.country_name || 'Unknown'
        city = geoData.city || 'Unknown'
      }
    } catch (e) {
      console.error('Failed to fetch geo data:', e)
    }

    // Registrar click
    await supabase.from('short_link_clicks').insert({
      short_link_id: shortLink.id,
      ip_address: ip,
      user_agent: userAgent,
      referrer: req.headers.get('referer') || null,
      country,
      city,
      device_type: deviceInfo.deviceType,
      device_vendor: deviceInfo.deviceVendor,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
    })

    // Construir destination URL com UTMs
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
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    })
  }
})

// Helper para parse User-Agent
function parseUserAgent(ua: string) {
  let deviceType = 'desktop'
  let deviceVendor = 'Unknown'
  let os = 'Unknown'
  let browser = 'Unknown'

  // Device Type
  if (/mobile/i.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

  // Device Vendor
  if (/iphone|ipad|ipod/i.test(ua)) deviceVendor = 'Apple'
  else if (/samsung/i.test(ua)) deviceVendor = 'Samsung'
  else if (/huawei/i.test(ua)) deviceVendor = 'Huawei'
  else if (/xiaomi/i.test(ua)) deviceVendor = 'Xiaomi'

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

  return { deviceType, deviceVendor, os, browser }
}
```

---

## 6.3.3 UI - SHORT LINKS PAGE (1h30)

### Arquivo: `src/app/short-links/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Plus, Link2, Copy, QrCode, BarChart3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
import { CreateShortLinkDialog } from '@/components/dialogs/create-short-link-dialog'
import { QRCodeDialog } from '@/components/dialogs/qrcode-dialog'
import { useShortLinks } from '@/hooks/use-short-links'
import { format } from 'date-fns'

export default function ShortLinksPage() {
  const { shortLinks, isLoading, createShortLink, deleteShortLink } = useShortLinks()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<any>(null)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: toast
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Short Links</h1>
          <p className="text-muted-foreground mt-1">
            Create branded short links with tracking and analytics
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Short Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shortLinks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shortLinks.reduce((sum, link) => sum + link.clicks_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shortLinks.filter(l => l.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Short Link
                    <InfoTooltipRich
                      title="Short Link"
                      description="Branded short URL that redirects to your destination"
                      icon="info"
                    />
                  </div>
                </TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Clicks
                    <InfoTooltipRich
                      title="Total Clicks"
                      description="Number of times this link was clicked"
                      icon="info"
                    />
                  </div>
                </TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span>rvnfy.co/{link.short_code}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`https://rvnfy.co/${link.short_code}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a
                      href={link.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {link.destination_url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {link.clicks_count.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(link.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {link.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLink(link)
                          setIsQRDialogOpen(true)
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteShortLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateShortLinkDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={createShortLink}
      />

      {selectedLink && (
        <QRCodeDialog
          isOpen={isQRDialogOpen}
          onClose={() => {
            setIsQRDialogOpen(false)
            setSelectedLink(null)
          }}
          shortLink={selectedLink}
        />
      )}
    </div>
  )
}
```

---

**[CONTINUA NA PARTE 2 - Faltam Templates Page, AI Assistant, e Atualizações Finais]**

**Próximo arquivo:** `PRD-UPDATE-PARTE-6-MELHORIAS-2025-PARTE-2.md`
