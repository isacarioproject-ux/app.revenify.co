import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Zap, Link as LinkIcon, FolderOpen, Infinity } from 'lucide-react'
import { useUsage, getNextPlan } from '@/hooks/use-usage'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface UsageWidgetProps {
  projectId: string | null
  compact?: boolean
}

// Formatar número ou mostrar "Ilimitado"
function formatLimit(value: number): string {
  if (value >= 999999) return '∞'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toLocaleString()
}

export function UsageWidget({ projectId, compact = false }: UsageWidgetProps) {
  const { usage, limits, isLoading } = useUsage(projectId)
  const navigate = useNavigate()

  if (isLoading || !projectId) return null

  // Links ilimitados = não mostrar porcentagem
  const isLinksUnlimited = limits.shortLinks >= 999999
  const eventsPercentage = limits.events > 0 ? (usage.events / limits.events) * 100 : 0
  const linksPercentage = isLinksUnlimited ? 0 : (limits.shortLinks > 0 ? (usage.shortLinks / limits.shortLinks) * 100 : 0)

  const isNearLimit = eventsPercentage > 80 || (!isLinksUnlimited && linksPercentage > 80)
  const hasExceeded = eventsPercentage >= 100 || (!isLinksUnlimited && linksPercentage >= 100)

  if (compact) {
    return (
      <div className="px-2 py-2 space-y-2.5 rounded-lg bg-muted/30">
        {/* Eventos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Eventos
            </span>
            <span className={cn(
              'font-mono text-[11px]',
              eventsPercentage >= 100 && 'text-destructive font-medium',
              eventsPercentage >= 80 && eventsPercentage < 100 && 'text-yellow-600'
            )}>
              {formatLimit(usage.events)} / {formatLimit(limits.events)}
            </span>
          </div>
          <Progress 
            value={Math.min(eventsPercentage, 100)} 
            className={cn(
              'h-1',
              eventsPercentage >= 100 && '[&>div]:bg-destructive',
              eventsPercentage >= 80 && eventsPercentage < 100 && '[&>div]:bg-yellow-500'
            )}
          />
        </div>

        {/* Links */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Links
            </span>
            <span className={cn(
              'font-mono text-[11px]',
              !isLinksUnlimited && linksPercentage >= 100 && 'text-destructive font-medium',
              !isLinksUnlimited && linksPercentage >= 80 && linksPercentage < 100 && 'text-yellow-600'
            )}>
              {usage.shortLinks} / {formatLimit(limits.shortLinks)}
            </span>
          </div>
          <Progress 
            value={isLinksUnlimited ? 0 : Math.min(linksPercentage, 100)} 
            className={cn(
              'h-1',
              !isLinksUnlimited && linksPercentage >= 100 && '[&>div]:bg-destructive',
              !isLinksUnlimited && linksPercentage >= 80 && linksPercentage < 100 && '[&>div]:bg-yellow-500'
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'border-2',
      hasExceeded && 'border-destructive bg-destructive/5',
      isNearLimit && !hasExceeded && 'border-yellow-500/50 bg-yellow-500/5'
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Uso Este Mês</h3>
          <InfoTooltip
            content="Seu uso reseta no dia 1 de cada mês"
            icon="info"
          />
        </div>

        {/* Events */}
        <UsageMetric
          icon={Zap}
          label="Eventos"
          used={usage.events}
          limit={limits.events}
          percentage={eventsPercentage}
          nextPlan={getNextPlan(limits.plan, 'events')}
        />

        {/* Short Links */}
        <UsageMetric
          icon={LinkIcon}
          label="Links Curtos"
          used={usage.shortLinks}
          limit={limits.shortLinks}
          percentage={linksPercentage}
          nextPlan={getNextPlan(limits.plan, 'links')}
        />

        {/* Projects */}
        <UsageMetric
          icon={FolderOpen}
          label="Projetos"
          used={usage.projects}
          limit={limits.projects}
          percentage={(usage.projects / limits.projects) * 100}
          nextPlan={getNextPlan(limits.plan, 'projects')}
          hideProgress
        />

        {/* CTA */}
        {(isNearLimit || hasExceeded) && (
          <Button
            className="w-full"
            variant={hasExceeded ? 'default' : 'outline'}
            size="sm"
            onClick={() => navigate('/pricing')}
          >
            {hasExceeded ? 'Fazer Upgrade Agora' : 'Ver Planos'}
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
  const isUnlimited = limit >= 999999
  const isExceeded = !isUnlimited && percentage >= 100
  const isWarning = !isUnlimited && percentage >= 80 && percentage < 100

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
            {used.toLocaleString()} / {formatLimit(limit)}
          </span>

          {/* Hover Tooltip com próximo plano - só se não for ilimitado */}
          {nextPlan && !isUnlimited && (
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50">
              <div className="bg-popover border rounded-lg shadow-xl p-3 w-64">
                <p className="text-xs font-semibold mb-1">Precisa de mais {label.toLowerCase()}?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Upgrade para <strong>{nextPlan.name}</strong> por {formatLimit(nextPlan.limit)} {label.toLowerCase()}/mês
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    R${nextPlan.price}
                    <span className="text-xs text-muted-foreground">/mês</span>
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

      {!hideProgress && !isUnlimited && (
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
