import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface Source {
  id: string
  name: string
  utm_source?: string | null
  utm_medium?: string | null
  visitors: number
  leads: number
  revenue: number
  conversion_rate: number
  trend?: number
}

interface SourcesTableProps {
  sources: Source[]
  loading?: boolean
}

export function SourcesTable({ sources, loading = false }: SourcesTableProps) {
  const { t } = useI18n()
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sources.topSources')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('sources.noSources')}
            </p>
          ) : (
            sources.map((source, index) => (
              <div
                key={source.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{source.name}</span>
                    {source.utm_source && (
                      <Badge variant="outline" className="text-xs">
                        {source.utm_source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{source.visitors.toLocaleString()} {t('sources.visitors')}</span>
                    <span>•</span>
                    <span>{source.leads} {t('sources.leads')}</span>
                    <span>•</span>
                    <span>{source.conversion_rate.toFixed(1)}% {t('sources.conversion')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(source.revenue)}</div>
                  {source.trend !== undefined && (
                    <div className={cn(
                      'flex items-center justify-end gap-1 text-xs',
                      source.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {source.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(source.trend)}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
