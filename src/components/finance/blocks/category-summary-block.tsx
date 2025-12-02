import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingDown, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react'
import { FinanceTransaction } from '@/types/finance'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { useI18n } from '@/hooks/use-i18n'

interface CategorySummaryBlockProps extends FinanceBlockProps {
  transactions: FinanceTransaction[]
}

/**
 * Bloco de resumo por categoria - Tabela inline estilo Notion
 * Mostra gastos/receitas agrupados por categoria com valores e percentuais
 */
export const CategorySummaryBlock = ({
  transactions,
}: CategorySummaryBlockProps) => {
  const { t } = useI18n()
  
  // Agrupar transações por categoria
  const summary = useMemo(() => {
    const groups: Record<string, {
      category: string
      type: 'income' | 'expense'
      amount: number
      count: number
    }> = {}

    transactions
      .filter((t) => t.status === 'completed' && t.type !== 'transfer')
      .forEach((t) => {
        if (!groups[t.category]) {
          groups[t.category] = {
            category: t.category,
            type: t.type as 'income' | 'expense',
            amount: 0,
            count: 0,
          }
        }
        groups[t.category].amount += Number(t.amount)
        groups[t.category].count += 1
      })

    return Object.values(groups).sort((a, b) => b.amount - a.amount)
  }, [transactions])

  // Calcular totais
  const totals = useMemo(() => {
    const expenses = summary
      .filter((s) => s.type === 'expense')
      .reduce((sum, s) => sum + s.amount, 0)
    
    const income = summary
      .filter((s) => s.type === 'income')
      .reduce((sum, s) => sum + s.amount, 0)

    return { expenses, income, total: income - expenses }
  }, [summary])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPercentage = (amount: number, total: number) => {
    if (total === 0) return '0%'
    return `${((amount / total) * 100).toFixed(1)}%`
  }

  if (summary.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <BarChart3 className="h-8 w-8 opacity-50" />
          <p className="text-sm">{t('finance.charts.noData')}</p>
          <p className="text-xs">{t('finance.charts.addTransactions')}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Card de totais compacto */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-muted-foreground">{t('finance.charts.income')}</span>
          </div>
          <p className="text-sm font-bold text-green-600">
            {formatCurrency(totals.income)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span className="text-xs text-muted-foreground">{t('finance.charts.expenses')}</span>
          </div>
          <p className="text-sm font-bold text-red-600">
            {formatCurrency(totals.expenses)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-3 w-3 text-foreground" />
            <span className="text-xs text-muted-foreground">{t('finance.charts.balance')}</span>
          </div>
          <p className={`text-sm font-bold ${totals.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.total)}
          </p>
        </div>
      </div>

      {/* Tabela inline estilo Notion */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-10 hover:bg-muted/50">
              <TableHead className="h-10 text-xs font-semibold w-12">Tipo</TableHead>
              <TableHead className="h-10 text-xs font-semibold">Categoria</TableHead>
              <TableHead className="h-10 text-xs font-semibold text-center">Qtd</TableHead>
              <TableHead className="h-10 text-xs font-semibold text-right">Valor</TableHead>
              <TableHead className="h-10 text-xs font-semibold text-right hidden md:table-cell">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((item, index) => {
              const total = item.type === 'expense' ? totals.expenses : totals.income
              const percentage = formatPercentage(item.amount, total)
              
              return (
                <motion.tr
                  key={item.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-muted/30 group transition-colors"
                >
                  <TableCell className="py-2 px-3">
                    {item.type === 'expense' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                  </TableCell>
                  
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.category}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-2 px-3 text-center">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5 bg-muted text-muted-foreground font-medium"
                    >
                      {item.count}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="py-2 px-3 text-right">
                    <span className={`text-sm font-semibold ${
                      item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="py-2 px-3 text-right hidden md:table-cell">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex-1 max-w-[60px] bg-muted rounded-full overflow-hidden h-1.5">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            item.type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((item.amount / total) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem]">
                        {percentage}
                      </span>
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com estatísticas */}
      <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
        <span>{summary.length} categorias</span>
        <span>{transactions.filter(t => t.status === 'completed' && t.type !== 'transfer').length} transações</span>
      </div>
    </motion.div>
  )
}
