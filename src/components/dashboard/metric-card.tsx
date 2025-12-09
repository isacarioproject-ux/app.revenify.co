import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
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
  tooltip?: {
    title: string
    description: string
  }
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
  },
  green: {
    icon: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950',
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
  },
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
  tooltip,
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {tooltip && (
            <InfoTooltipRich
              title={tooltip.title}
              description={tooltip.description}
              icon="info"
            />
          )}
        </div>
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
