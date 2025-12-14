import { Users, UserCheck, DollarSign, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface FunnelData {
  visitors: number
  leads: number
  customers: number
  revenue: number
}

interface ConversionFunnelProps {
  data: FunnelData
  loading?: boolean
}

export function ConversionFunnel({ data, loading = false }: ConversionFunnelProps) {
  const { t } = useI18n()
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const calculateRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current / previous) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stages = [
    {
      label: t('funnel.visitors'),
      value: data.visitors,
      icon: Users,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      rate: null,
    },
    {
      label: t('funnel.leads'),
      value: data.leads,
      icon: UserCheck,
      color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
      rate: calculateRate(data.leads, data.visitors),
    },
    {
      label: t('funnel.customers'),
      value: data.customers,
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
      rate: calculateRate(data.customers, data.leads),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('funnel.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label}>
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-lg', stage.color)}>
                  <stage.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stage.label}</p>
                  <p className="text-2xl font-bold">{stage.value.toLocaleString()}</p>
                </div>
                {stage.rate !== null && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('funnel.rate')}</p>
                    <p className="text-lg font-semibold text-primary">{stage.rate}%</p>
                  </div>
                )}
              </div>
              {index < stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('funnel.totalRevenue')}</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">{t('funnel.valuePerVisitor')}</span>
              <span className="text-sm font-medium">
                {data.visitors > 0 ? formatCurrency(data.revenue / data.visitors) : 'R$ 0,00'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
