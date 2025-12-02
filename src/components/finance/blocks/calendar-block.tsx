import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react'
import { FinanceTransaction } from '@/types/finance'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'
import { useI18n } from '@/hooks/use-i18n'

interface CalendarBlockProps extends FinanceBlockProps {
  transactions: FinanceTransaction[]
}

/**
 * Bloco de calendário financeiro
 * Visualiza transações por dia em um calendário mensal
 */
export function CalendarBlock({ transactions }: CalendarBlockProps) {
  const { t } = useI18n()
  const dateFnsLocale = useDateFnsLocale()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calcular dias do mês
  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Agrupar transações por dia
  const transactionsByDay = useMemo(() => {
    const grouped: Record<string, FinanceTransaction[]> = {}
    
    transactions.forEach((t) => {
      const date = format(parseISO(t.transaction_date), 'yyyy-MM-dd')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(t)
    })
    
    return grouped
  }, [transactions])

  // Navegar meses
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Calcular totais do dia
  const getDayTotals = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactionsByDay[dateKey] || []
    
    const income = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const expense = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    // Contar pendentes e atrasados
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const pendingCount = dayTransactions.filter(t => t.status === 'pending').length
    const overdueCount = dayTransactions.filter(t => {
      if (t.status !== 'pending') return false
      const txDate = parseISO(t.transaction_date)
      return txDate < today
    }).length
    
    return { income, expense, count: dayTransactions.length, pendingCount, overdueCount }
  }
  
  // Calcular resumo do mês
  const monthSummary = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let totalIncome = 0
    let totalExpense = 0
    let pendingCount = 0
    let overdueCount = 0
    let overdueAmount = 0
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += Number(t.amount)
      } else {
        totalExpense += Number(t.amount)
      }
      
      if (t.status === 'pending') {
        pendingCount++
        const txDate = parseISO(t.transaction_date)
        if (txDate < today) {
          overdueCount++
          overdueAmount += Number(t.amount)
        }
      }
    })
    
    return { totalIncome, totalExpense, pendingCount, overdueCount, overdueAmount }
  }, [transactions])

  return (
    <div className="space-y-4">
      {/* Alerta de contas atrasadas */}
      {monthSummary.overdueCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {monthSummary.overdueCount} {monthSummary.overdueCount === 1 ? 'conta atrasada' : 'contas atrasadas'}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Total: {formatCurrency(monthSummary.overdueAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Resumo do mês */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
          <p className="text-xs text-muted-foreground">{t('finance.charts.income')}</p>
          <p className="text-sm font-semibold text-green-600">+{formatCurrency(monthSummary.totalIncome)}</p>
        </div>
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
          <p className="text-xs text-muted-foreground">{t('finance.charts.expenses')}</p>
          <p className="text-sm font-semibold text-red-600">-{formatCurrency(monthSummary.totalExpense)}</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <p className="text-xs text-muted-foreground">{t('finance.card.balance')}</p>
          <p className={`text-sm font-semibold ${monthSummary.totalIncome - monthSummary.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthSummary.totalIncome - monthSummary.totalExpense)}
          </p>
        </div>
      </div>

      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale })}
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={today}
          >
            {t('finance.calendar.today')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendário */}
      <div className="border rounded-lg overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 bg-muted">
          {[
            t('finance.calendar.sun'),
            t('finance.calendar.mon'),
            t('finance.calendar.tue'),
            t('finance.calendar.wed'),
            t('finance.calendar.thu'),
            t('finance.calendar.fri'),
            t('finance.calendar.sat')
          ].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-semibold border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-r border-b bg-muted/30" />
          ))}

          {/* Dias */}
          {days.map((day) => {
            const { income, expense, count } = getDayTotals(day)
            const isToday = isSameDay(day, new Date())
            const hasTransactions = count > 0
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayTransactions = transactionsByDay[dateKey] || []

            const DayContent = (
              <div className="h-full flex flex-col">
                {/* Número do dia */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium ${
                      isToday ? 'text-primary font-bold' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasTransactions && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </div>

                {/* Valores */}
                {hasTransactions && (
                  <div className="flex-1 flex flex-col gap-0.5 text-[10px]">
                    {income > 0 && (
                      <div className="text-green-600 font-semibold truncate">
                        +{formatCurrency(income)}
                      </div>
                    )}
                    {expense > 0 && (
                      <div className="text-red-600 font-semibold truncate">
                        -{formatCurrency(expense)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )

            return hasTransactions ? (
              <Popover key={day.toISOString()}>
                <PopoverTrigger asChild>
                  <div
                    className={`aspect-square border-r border-b p-1 hover:bg-accent transition-colors cursor-pointer ${
                      isToday ? 'bg-primary/10' : ''
                    }`}
                  >
                    {DayContent}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      {format(day, "d 'de' MMMM", { locale: dateFnsLocale })}
                    </h4>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dayTransactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 border rounded text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {t.type === 'income' ? (
                              <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{t.description}</p>
                              <p className="text-muted-foreground">{t.category}</p>
                            </div>
                          </div>
                          <span
                            className={`font-semibold ${
                              t.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div
                key={day.toISOString()}
                className={`aspect-square border-r border-b p-1 ${
                  isToday ? 'bg-primary/10' : ''
                }`}
              >
                {DayContent}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/10 border" />
          <span>{t('finance.calendar.today')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600/20" />
          <span>{t('finance.charts.income')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600/20" />
          <span>{t('finance.charts.expenses')}</span>
        </div>
      </div>
    </div>
  )
}
