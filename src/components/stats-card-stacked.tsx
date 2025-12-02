"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardStacked, CardsStackContainer } from '@/components/ui/cards-stack'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardStackedProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: 'up' | 'down'
  trendValue?: string
  className?: string
  index: number
}

export const StatsCardStacked = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  index,
}: StatsCardStackedProps) => (
  <CardStacked
    index={index}
    total={4}
    className="w-full"
  >
    <Card className={cn('relative overflow-hidden backdrop-blur-sm border-2', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

      <CardHeader className="relative flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-1">
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {value}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium pt-2',
              trend === 'up'
                ? 'text-green-600 dark:text-green-500'
                : 'text-red-600 dark:text-red-500'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trendValue}</span>
            <span className="text-xs text-muted-foreground">vs último período</span>
          </div>
        )}
      </CardContent>
    </Card>
  </CardStacked>
)

interface StatsCardsContainerProps {
  children: React.ReactNode
  className?: string
}

export const StatsCardsContainer = ({ children, className }: StatsCardsContainerProps) => (
  <CardsStackContainer className={cn(className)}>
    {children}
  </CardsStackContainer>
)
