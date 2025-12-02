import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, Line, LineChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { FinanceTransaction } from '@/types/finance'
import { useI18n } from '@/hooks/use-i18n'

interface MonthlyReportBlockProps extends FinanceBlockProps {
  transactions: FinanceTransaction[]
}

export const MonthlyReportBlock = ({
  transactions,
}: MonthlyReportBlockProps) => {
  const { t } = useI18n()
  
  const report = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filtrar transações do mês atual
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date)
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear &&
             t.status === 'completed'
    })

    // Dados para gráfico de área (últimos 30 dias)
    const dailyData: Record<string, { income: number; expenses: number }> = {}
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyData[dateStr] = { income: 0, expenses: 0 }
    }

    currentMonthTransactions.forEach(t => {
      const dateStr = t.transaction_date
      if (dailyData[dateStr]) {
        if (t.type === 'income') {
          dailyData[dateStr].income += Number(t.amount)
        } else {
          dailyData[dateStr].expenses += Number(t.amount)
        }
      }
    })

    const chartData = Object.entries(dailyData).map(([date, values]) => ({
      date: new Date(date).getDate().toString(),
      receitas: values.income,
      despesas: values.expenses,
    }))

    // Top 5 categorias de despesas
    const expensesByCategory = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, value]) => ({
        category,
        value,
      }))

    return {
      chartData,
      topCategories,
      transactionCount: currentMonthTransactions.length,
    }
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const chartConfig = {
    receitas: {
      label: t('finance.charts.income'),
      color: 'hsl(var(--chart-1))',
    },
    despesas: {
      label: t('finance.charts.expenses'),
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  const barChartConfig = {
    value: {
      label: t('finance.table.value'),
      color: 'hsl(var(--chart-3))',
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Gráfico de Área - Fluxo Diário */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">{t('finance.monthlyReport.financialFlow')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('finance.monthlyReport.trackDaily')}
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={report.chartData}
            margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
          >
            <defs>
              <linearGradient id="fillReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-receitas)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-receitas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-despesas)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-despesas)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="receitas"
              type="natural"
              fill="url(#fillReceitas)"
              fillOpacity={1}
              stroke="var(--color-receitas)"
              strokeWidth={2}
            />
            <Area
              dataKey="despesas"
              type="natural"
              fill="url(#fillDespesas)"
              fillOpacity={1}
              stroke="var(--color-despesas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {report.transactionCount} {t('finance.monthlyReport.transactionsRecorded')}
          </span>
          <span className="text-muted-foreground">
            {t('finance.monthlyReport.period')} {monthName}
          </span>
        </div>
      </div>

      {/* Gráfico de Linha - Top Categorias */}
      {report.topCategories.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">{t('finance.monthlyReport.topCategories')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('finance.monthlyReport.whereMostSpent')}
            </p>
          </div>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <LineChart
              data={report.topCategories}
              margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="value"
                type="natural"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-value)",
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
          <div className="text-sm text-muted-foreground text-right">
            {t('finance.monthlyReport.totalTop5')} {formatCurrency(
              report.topCategories.reduce((sum, cat) => sum + cat.value, 0)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
