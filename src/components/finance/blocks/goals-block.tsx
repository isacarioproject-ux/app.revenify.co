import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Trash2, Target, TrendingUp, AlertTriangle, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { FinanceTransaction } from '@/types/finance'
import { useI18n } from '@/hooks/use-i18n'

interface Goal {
  id: string
  user_id: string
  finance_document_id: string
  category: string
  target_amount: number
  period: 'monthly' | 'yearly'
  created_at: string
  updated_at: string
}

interface GoalsBlockProps extends FinanceBlockProps {
  categories: string[]
  transactions: FinanceTransaction[]
}

export const GoalsBlock = ({
  documentId,
  categories,
  transactions,
}: GoalsBlockProps) => {
  const { t } = useI18n()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)
  
  // Estado para nova linha
  const [newCategory, setNewCategory] = useState('')
  const [newPeriod, setNewPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [newAmount, setNewAmount] = useState('')

  useEffect(() => {
    loadGoals()
  }, [documentId])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finance_goals')
        .select('*')
        .eq('finance_document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (err: any) {
      console.error('Error loading goals:', err)
      toast.error(t('finance.goals.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Adicionar nova meta
  const handleAddGoal = useCallback(async () => {
    if (!newCategory) {
      toast.error(t('finance.goals.selectCategory'))
      return
    }
    
    if (!newAmount) {
      toast.error(t('finance.goals.enterValue'))
      return
    }

    const value = parseFloat(newAmount.replace(',', '.'))
    if (isNaN(value) || value <= 0) {
      toast.error(t('finance.goals.valueMustBePositive'))
      return
    }

    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('finance.goals.userNotAuthenticated'))
        return
      }

      const { data, error } = await supabase
        .from('finance_goals')
        .insert({
          user_id: user.id,
          finance_document_id: documentId,
          category: newCategory,
          target_amount: value,
          period: newPeriod,
        })
        .select()
        .single()

      if (error) throw error

      // Atualização otimista
      if (data) {
        setGoals(prev => [data, ...prev])
      }

      // Reset
      setNewCategory('')
      setNewPeriod('monthly')
      setNewAmount('')
      
      toast.success(t('finance.goals.added'))
    } catch (err: any) {
      toast.error(t('finance.goals.errorAdd'), {
        description: err.message,
      })
    } finally {
      setAdding(false)
    }
  }, [newCategory, newAmount, newPeriod, documentId, t])

  // Atualizar meta existente
  const updateGoal = useCallback(async (goalId: string, field: string, value: any) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    // Atualização otimista
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, [field]: value } : g
    ))

    try {
      const { error } = await supabase
        .from('finance_goals')
        .update({ [field]: value })
        .eq('id', goalId)

      if (error) throw error
    } catch (err: any) {
      // Reverter
      setGoals(prev => prev.map(g => 
        g.id === goalId ? goal : g
      ))
      toast.error(t('finance.goals.errorUpdate'), {
        description: err.message,
      })
    }
  }, [goals, t])

  const deleteGoal = async (id: string) => {
    if (deleting === id) return

    setDeleting(id)
    try {
      const { error } = await supabase
        .from('finance_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      setGoals(goals.filter(g => g.id !== id))
      toast.success(t('finance.goals.removed'))
    } catch (err: any) {
      toast.error(t('finance.goals.errorRemove'), {
        description: err.message,
      })
    } finally {
      setDeleting(null)
    }
  }

  // Calcular gastos por categoria
  const spendingByCategory = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return transactions
      .filter(t => {
        if (t.type !== 'expense' || t.status !== 'completed') return false
        
        const transactionDate = new Date(t.transaction_date)
        const isCurrentMonth = transactionDate.getMonth() === currentMonth && 
                               transactionDate.getFullYear() === currentYear
        
        return isCurrentMonth
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)
  }, [transactions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="h-10 text-xs">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="h-10 text-xs">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-10 text-xs text-right">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead className="h-10 text-xs text-right hidden md:table-cell">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="h-10 text-xs text-center">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-10 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="h-12">
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-2 w-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-6" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Tabela inline estilo Notion */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 text-xs">{t('finance.table.category')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.goals.period')}</TableHead>
              <TableHead className="h-8 text-xs text-right">{t('finance.goals.target')}</TableHead>
              <TableHead className="h-8 text-xs text-right">{t('finance.goals.spent')}</TableHead>
              <TableHead className="h-8 text-xs text-center">{t('finance.goals.progress')}</TableHead>
              <TableHead className="h-8 w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Linha para adicionar nova meta - sempre visível no topo */}
            <TableRow className="h-8 bg-muted/20">
              {/* Categoria */}
              <TableCell className="text-xs py-0 px-2">
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-xs h-7 px-2 hover:bg-muted rounded min-w-[100px]">
                      <span className={newCategory ? 'text-foreground' : 'text-muted-foreground'}>
                        {newCategory || t('finance.table.category')}
                      </span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    <div className="max-h-48 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setNewCategory(cat)
                            setCategoryOpen(false)
                          }}
                          className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>

              {/* Período */}
              <TableCell className="text-xs py-0 px-2">
                <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-xs h-7 px-2 hover:bg-muted rounded">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {newPeriod === 'monthly' ? t('finance.goals.monthly') : t('finance.goals.yearly')}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1" align="start">
                    <button
                      onClick={() => { setNewPeriod('monthly'); setPeriodOpen(false) }}
                      className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                    >
                      {t('finance.goals.monthly')}
                    </button>
                    <button
                      onClick={() => { setNewPeriod('yearly'); setPeriodOpen(false) }}
                      className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                    >
                      {t('finance.goals.yearly')}
                    </button>
                  </PopoverContent>
                </Popover>
              </TableCell>

              {/* Valor Meta */}
              <TableCell className="text-xs py-0 px-2 text-right">
                <Input
                  type="text"
                  placeholder="0,00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGoal()
                  }}
                  className="h-6 text-xs text-right w-24 border-0 bg-transparent focus-visible:ring-1 px-1"
                />
              </TableCell>

              {/* Gasto - vazio para nova linha */}
              <TableCell className="text-xs py-0 px-2 text-right text-muted-foreground">
                -
              </TableCell>

              {/* Progresso - vazio para nova linha */}
              <TableCell className="text-xs py-0 px-2 text-center text-muted-foreground">
                -
              </TableCell>

              {/* Botão Adicionar */}
              <TableCell className="text-xs py-0 px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGoal}
                  disabled={adding || !newCategory || !newAmount}
                  className="h-6 w-6 p-0"
                >
                  {adding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </TableCell>
            </TableRow>

            {/* Metas existentes */}
            {goals.map((goal) => {
              const spent = spendingByCategory[goal.category] || 0
              const percentage = goal.target_amount > 0 ? (spent / goal.target_amount) * 100 : 0
              const isOverBudget = percentage >= 100
              const isWarning = percentage >= 80 && percentage < 100

              return (
                <TableRow key={goal.id} className="h-8 hover:bg-muted/30 group">
                  {/* Categoria - Edição inline */}
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === goal.id && editingCell?.field === 'category' ? (
                      <Popover open onOpenChange={(open) => !open && setEditingCell(null)}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 text-xs h-7 px-2 bg-muted rounded">
                            <span>{goal.category}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          <div className="max-h-48 overflow-y-auto">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => {
                                  updateGoal(goal.id, 'category', cat)
                                  setEditingCell(null)
                                }}
                                className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: goal.id, field: 'category' })}
                        className="flex items-center gap-1.5 text-xs h-7 px-2 hover:bg-muted rounded w-full text-left"
                      >
                        <span className="font-medium">{goal.category}</span>
                        {isOverBudget && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        {isWarning && !isOverBudget && <TrendingUp className="h-3 w-3 text-yellow-500" />}
                      </button>
                    )}
                  </TableCell>

                  {/* Período - Edição inline */}
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === goal.id && editingCell?.field === 'period' ? (
                      <Popover open onOpenChange={(open) => !open && setEditingCell(null)}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 text-xs h-7 px-2 bg-muted rounded">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {goal.period === 'monthly' ? t('finance.goals.monthly') : t('finance.goals.yearly')}
                            </Badge>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1" align="start">
                          <button
                            onClick={() => { updateGoal(goal.id, 'period', 'monthly'); setEditingCell(null) }}
                            className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                          >
                            {t('finance.goals.monthly')}
                          </button>
                          <button
                            onClick={() => { updateGoal(goal.id, 'period', 'yearly'); setEditingCell(null) }}
                            className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded"
                          >
                            {t('finance.goals.yearly')}
                          </button>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <button
                        onClick={() => setEditingCell({ rowId: goal.id, field: 'period' })}
                        className="h-7 px-2 hover:bg-muted rounded"
                      >
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {goal.period === 'monthly' ? t('finance.goals.monthly') : t('finance.goals.yearly')}
                        </Badge>
                      </button>
                    )}
                  </TableCell>

                  {/* Valor Meta - Edição inline */}
                  <TableCell className="text-xs py-0 px-2 text-right">
                    {editingCell?.rowId === goal.id && editingCell?.field === 'target_amount' ? (
                      <Input
                        type="text"
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => {
                          const value = parseFloat(editingValue.replace(',', '.'))
                          if (!isNaN(value) && value > 0) {
                            updateGoal(goal.id, 'target_amount', value)
                          }
                          setEditingCell(null)
                          setEditingValue('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseFloat(editingValue.replace(',', '.'))
                            if (!isNaN(value) && value > 0) {
                              updateGoal(goal.id, 'target_amount', value)
                            }
                            setEditingCell(null)
                            setEditingValue('')
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null)
                            setEditingValue('')
                          }
                        }}
                        className="h-6 text-xs text-right w-24 border-0 bg-muted focus-visible:ring-1 px-1"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCell({ rowId: goal.id, field: 'target_amount' })
                          setEditingValue(goal.target_amount.toString())
                        }}
                        className="h-7 px-2 hover:bg-muted rounded font-mono"
                      >
                        {formatCurrency(goal.target_amount)}
                      </button>
                    )}
                  </TableCell>

                  {/* Valor Gasto */}
                  <TableCell className="text-xs py-0 px-2 text-right font-mono">
                    <span className={isOverBudget ? 'text-red-600' : 'text-muted-foreground'}>
                      {formatCurrency(spent)}
                    </span>
                  </TableCell>

                  {/* Progresso */}
                  <TableCell className="text-xs py-0 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-muted rounded-full overflow-hidden h-1.5 min-w-[40px]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full ${
                            isOverBudget ? 'bg-red-500' : 
                            isWarning ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs min-w-[2rem] text-right ${
                        isOverBudget ? 'text-red-600' : 
                        isWarning ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Botão Deletar */}
                  <TableCell className="text-xs py-0 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      disabled={deleting === goal.id}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    >
                      {deleting === goal.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com estatísticas */}
      {goals.length > 0 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
          <span>{goals.length} {goals.length === 1 ? t('finance.goals.goal') : t('finance.goals.goals')}</span>
          <span>
            {goals.filter(g => (spendingByCategory[g.category] || 0) / g.target_amount >= 1).length} {t('finance.goals.exceeded')}
          </span>
        </div>
      )}

      {/* Estado vazio */}
      {goals.length === 0 && (
        <div className="text-center py-6">
          <div className="flex flex-col items-center gap-2">
            <Target className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{t('finance.goals.noGoals')}</p>
            <p className="text-xs text-muted-foreground">{t('finance.goals.addFirst')}</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
