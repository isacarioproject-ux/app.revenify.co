import { useMemo } from 'react'
import {
  Modal,
  ModalContent,
  ModalTitle,
} from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FinanceTransaction, FinanceCategory } from '@/types/finance'
import { TrendingUp, TrendingDown, PieChart, BarChart3, X } from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceChartsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: FinanceTransaction[]
  categories: FinanceCategory[]
}

// Cores para os gráficos
const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
]

const INCOME_COLORS = [
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const FinanceCharts = ({
  open,
  onOpenChange,
  transactions,
  categories,
}: FinanceChartsProps) => {
  const { t } = useI18n()

  // Calcular totais
  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
      .filter((t) => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return { income, expenses, balance: income - expenses }
  }, [transactions])

  // Agrupar por categoria
  const categoryData = useMemo(() => {
    const data: Record<string, { amount: number; count: number; type: string }> = {}

    transactions
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        if (!data[t.category]) {
          data[t.category] = { amount: 0, count: 0, type: t.type }
        }
        data[t.category].amount += Number(t.amount)
        data[t.category].count += 1
      })

    return Object.entries(data)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  // Preparar dados para gráfico de pizza (Despesas)
  const expenseChartData = categoryData
    .filter((c) => c.type === 'expense')
    .slice(0, 8)
    .map((cat, index) => ({
      name: cat.name,
      value: cat.amount,
      count: cat.count,
      percentage: ((cat.amount / totals.expenses) * 100).toFixed(1),
      color: COLORS[index % COLORS.length],
    }))

  // Preparar dados para gráfico de pizza (Receitas)
  const incomeChartData = categoryData
    .filter((c) => c.type === 'income')
    .slice(0, 8)
    .map((cat, index) => ({
      name: cat.name,
      value: cat.amount,
      count: cat.count,
      percentage: ((cat.amount / totals.income) * 100).toFixed(1),
      color: INCOME_COLORS[index % INCOME_COLORS.length],
    }))

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('finance.charts.value')}</span>
              <span className="font-mono font-semibold">{formatCurrency(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('finance.charts.transactions')}</span>
              <span className="font-medium">{data.count}x</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('finance.charts.percentage')}</span>
              <span className="font-medium">{data.percentage}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="p-0 [&>button]:hidden max-w-4xl max-h-[90vh]"
        drawerProps={{
          className: 'h-[96vh]',
        }}
      >
        <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b">
          <ModalTitle className="text-sm font-semibold px-2 h-7 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('finance.charts.title')}
          </ModalTitle>
          
          <div className="flex items-center gap-1">
            {/* Botão Fechar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 sm:px-4 md:px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Grid de Gráficos - Vertical em mobile, Horizontal em desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Gráfico de Despesas */}
          {expenseChartData.length > 0 && (
              <div className="flex flex-col gap-2 p-3 md:p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold">
                  {t('finance.charts.expensesByCategory')}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('finance.charts.expensesDistribution')}
                </p>
                <div className="h-[280px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="40%"
                        innerRadius={40}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        layout="horizontal"
                        align="center"
                        wrapperStyle={{ 
                          paddingTop: '10px',
                          fontSize: '11px',
                          lineHeight: '1.4'
                        }}
                        formatter={(value: string) => (
                          <span className="text-[11px] text-foreground">{value}</span>
                        )}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
          )}

          {/* Gráfico de Receitas */}
          {incomeChartData.length > 0 && (
              <div className="flex flex-col gap-2 p-3 md:p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold">
                  {t('finance.charts.incomeByCategory')}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('finance.charts.incomeDistribution')}
                </p>
                <div className="h-[280px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={incomeChartData}
                        cx="50%"
                        cy="40%"
                        innerRadius={40}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {incomeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        layout="horizontal"
                        align="center"
                        wrapperStyle={{ 
                          paddingTop: '10px',
                          fontSize: '11px',
                          lineHeight: '1.4'
                        }}
                        formatter={(value: string) => (
                          <span className="text-[11px] text-foreground">{value}</span>
                        )}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
          )}
          </div>

          {/* Empty State */}
          {categoryData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t('finance.charts.noData')}</p>
              <p className="text-xs mt-1">{t('finance.charts.addTransactions')}</p>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
