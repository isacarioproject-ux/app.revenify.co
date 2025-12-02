import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  DollarSign,
} from 'lucide-react'
import { FinanceBudget, FinanceCategory, PAYMENT_METHODS } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface BudgetTrackerProps {
  documentId: string
  month: number
  year: number
  categories: FinanceCategory[]
  onRefresh: () => void
}

interface IncomeEntry {
  id: string
  name: string
  value: number
  percentage: number
}

interface ReserveEntry {
  id: string
  name: string
  type: 'reserve' | 'investment'
  value: number
  date: string
}

interface MetaEntry {
  id: string
  name: string
  type: 'meta' | 'investment'
  value: number
  date: string
  month: number
  year: number
}

interface ExpenseEntry {
  id: string
  category: string
  paymentMethod: string
  value: number
  date: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const getMonthName = (month: number, t: (key: string) => string) => {
  const monthKeys = [
    'finance.budget.month.january',
    'finance.budget.month.february',
    'finance.budget.month.march',
    'finance.budget.month.april',
    'finance.budget.month.may',
    'finance.budget.month.june',
    'finance.budget.month.july',
    'finance.budget.month.august',
    'finance.budget.month.september',
    'finance.budget.month.october',
    'finance.budget.month.november',
    'finance.budget.month.december',
  ]
  return t(monthKeys[month - 1] || '') || ''
}

export const BudgetTracker = ({
  documentId,
  month,
  year,
  categories,
  onRefresh,
}: BudgetTrackerProps) => {
  const { t } = useI18n()
  const [budgets, setBudgets] = useState<FinanceBudget[]>([])
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [reserveEntries, setReserveEntries] = useState<ReserveEntry[]>([])
  const [metaEntries, setMetaEntries] = useState<MetaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    fetchAllData()
  }, [documentId, month, year])

  const fetchAllData = async () => {
    if (!documentId) {
      setBudgets([])
      setIncomeEntries([])
      setExpenseEntries([])
      setReserveEntries([])
      setMetaEntries([])
      setLoading(false)
      setIsInitializing(false)
      return
    }

    setLoading(true)
    setIsInitializing(true)
    try {
      // Buscar documento para pegar template_config
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const config = doc?.template_config || {}

      // Carregar entradas (incomes) - não filtrado por mês (são gerais)
      const incomes = config.incomes || []
      const totalIncome = incomes.reduce((sum: number, e: any) => sum + (e.value || 0), 0)
      setIncomeEntries(incomes.map((e: any) => ({
        id: e.id || Date.now().toString() + Math.random(),
        name: e.name || '',
        value: e.value || 0,
        percentage: totalIncome > 0 ? ((e.value || 0) / totalIncome) * 100 : 0
      })))

      // Carregar reservas - não filtrado por mês (são gerais)
      const reserves = config.reserves || []
      setReserveEntries(reserves.map((r: any) => ({
        id: r.id || Date.now().toString() + Math.random(),
        name: r.name || '',
        type: r.type || 'reserve',
        value: r.value || 0,
        date: r.date || new Date().toISOString().split('T')[0]
      })))

      // Carregar metas - FILTRADO por mês/ano atual
      const metas = config.metas || []
      const metasDoMes = metas.filter((m: any) => m.month === month && m.year === year)
      setMetaEntries(metasDoMes.map((m: any) => ({
        id: m.id || Date.now().toString() + Math.random(),
        name: m.name,
        type: m.type || 'meta',
        value: m.value || 0,
        date: m.date || new Date(year, month - 1, 1).toISOString().split('T')[0],
        month: m.month,
        year: m.year
      })))

      // Carregar gastos das transações - FILTRADO por mês/ano atual
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('finance_document_id', documentId)
        .eq('type', 'expense')
        .eq('status', 'completed')
        .gte('transaction_date', startDate)
        .lt('transaction_date', endDate)

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      }

      const expenses = (transactions || []).map((t: any) => ({
        id: t.id,
        category: t.category || '',
        paymentMethod: t.payment_method || 'cash',
        value: Number(t.amount) || 0,
        date: t.transaction_date || new Date().toISOString().split('T')[0]
      }))
      setExpenseEntries(expenses)

      // Buscar budgets - FILTRADO por mês/ano atual
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('finance_document_id', documentId)
        .eq('month', month)
        .eq('year', year)
        .order('category_name')

      if (budgetsError) throw budgetsError

      // Calcular spent_amount baseado nas transações do mês/ano atual
      if (budgetsData && budgetsData.length > 0) {
        const budgetsWithSpent = (budgetsData || []).map((budget) => {
          const categoryTransactions = (transactions || []).filter(
            (t) => t.category === budget.category_name
          )
          const spent = categoryTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          )

          return {
            ...budget,
            spent_amount: spent,
          }
        })

        setBudgets(budgetsWithSpent)
      } else {
        setBudgets([])
      }
    } catch (err: any) {
      console.error('BudgetTracker - Erro ao buscar dados:', err)
      toast.error(t('finance.budget.errorLoad'), {
        description: err.message,
      })
      setBudgets([])
      setIncomeEntries([])
      setExpenseEntries([])
      setReserveEntries([])
      setMetaEntries([])
    } finally {
      setLoading(false)
      setTimeout(() => setIsInitializing(false), 300)
    }
  }

  const handleDeleteBudget = useCallback(async (id: string) => {
    if (!confirm(t('finance.budget.confirmDelete'))) return

    // Guardar para reverter em caso de erro
    const previousBudgets = budgets
    
    // Remover otimisticamente
    setBudgets(prev => prev.filter(b => b.id !== id))

    try {
      const { error } = await supabase
        .from('finance_budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(t('finance.budget.deleted'))
    } catch (err: any) {
      // Reverter em caso de erro
      setBudgets(previousBudgets)
      toast.error(t('finance.budget.errorDelete'), {
        description: err.message,
      })
    }
  }, [t, budgets])

  // Handlers para edição inline
  const handleCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const budget = budgets.find(b => b.id === rowId)
    if (!budget) {
      setEditingCell(null)
      setEditingValue('')
      return
    }

    const updateData: any = {}
    
    if (field === 'category_name') {
      updateData.category_name = editingValue.trim()
    } else if (field === 'planned_amount') {
      updateData.planned_amount = parseFloat(editingValue) || 0
    }

    // Atualização otimista - atualizar estado local primeiro
    setBudgets(prev => prev.map(b => 
      b.id === rowId ? { ...b, ...updateData } : b
    ))
    
    setEditingCell(null)
    setEditingValue('')

    try {
      const { error } = await supabase
        .from('finance_budgets')
        .update(updateData)
        .eq('id', rowId)

      if (error) throw error
      // Atualização otimista - não recarregar
    } catch (err: any) {
      // Reverter em caso de erro
      fetchAllData()
      toast.error(t('finance.budget.errorUpdate'), {
        description: err.message,
      })
    }
  }

  // Handlers para edição inline de entradas
  const handleIncomeCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleIncomeCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const entryIndex = incomeEntries.findIndex(e => e.id === rowId)
    let updated: IncomeEntry[]
    
    if (entryIndex === -1) {
      // Nova entrada
      if (field === 'name' && editingValue.trim()) {
        const newEntry: IncomeEntry = {
          id: Date.now().toString(),
          name: editingValue.trim(),
          value: 0,
          percentage: 0
        }
        updated = [...incomeEntries, newEntry]
        const newTotal = updated.reduce((sum, e) => sum + e.value, 0)
        updated = updated.map(e => ({
          ...e,
          percentage: newTotal > 0 ? (e.value / newTotal) * 100 : 0
        }))
        setIncomeEntries(updated)
        await saveIncomeEntries(updated)
      }
    } else {
      // Editar entrada existente
      updated = [...incomeEntries]
      if (field === 'name') {
        updated[entryIndex] = { ...updated[entryIndex], name: editingValue.trim() }
      } else if (field === 'value') {
        const value = parseFloat(editingValue) || 0
        updated[entryIndex] = { ...updated[entryIndex], value }
        const newTotal = updated.reduce((sum, e) => sum + e.value, 0)
        updated = updated.map(e => ({
          ...e,
          percentage: newTotal > 0 ? (e.value / newTotal) * 100 : 0
        }))
      }
      setIncomeEntries(updated)
      await saveIncomeEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de gastos
  const handleExpenseCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleExpenseCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const entryIndex = expenseEntries.findIndex(e => e.id === rowId)
    let updated: ExpenseEntry[]
    
    if (entryIndex === -1) {
      // Novo gasto - criar transação
      if (field === 'category' && editingValue.trim()) {
        try {
          const { error } = await supabase
            .from('finance_transactions')
            .insert({
        finance_document_id: documentId,
              type: 'expense',
              category: editingValue.trim(),
              amount: 0,
              payment_method: 'cash',
              transaction_date: new Date(year, month - 1, 1).toISOString().split('T')[0],
              status: 'completed'
      })

      if (error) throw error
          // Adicionar otimistamente à lista local
          const newExpense: ExpenseEntry = {
            id: Date.now().toString(),
            category: editingValue.trim(),
            paymentMethod: 'cash',
            value: 0,
            date: new Date(year, month - 1, 1).toISOString().split('T')[0]
          }
          setExpenseEntries(prev => [...prev, newExpense])
          toast.success(t('finance.budget.expenseAdded'))
        } catch (err: any) {
          toast.error(t('finance.budget.errorAddExpense'), {
            description: err.message,
          })
        }
      }
    } else {
      // Editar gasto existente
      updated = [...expenseEntries]
      const entry = updated[entryIndex]
      
      if (field === 'category') {
        updated[entryIndex] = { ...entry, category: editingValue.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...entry, value: parseFloat(editingValue) || 0 }
      } else if (field === 'paymentMethod') {
        updated[entryIndex] = { ...entry, paymentMethod: editingValue }
      } else if (field === 'date') {
        updated[entryIndex] = { ...entry, date: editingValue }
      }
      
      setExpenseEntries(updated)
      
      // Salvar no Supabase
      try {
        const updateData: any = {}
        if (field === 'category') updateData.category = editingValue.trim()
        if (field === 'value') updateData.amount = parseFloat(editingValue) || 0
        if (field === 'paymentMethod') updateData.payment_method = editingValue
        if (field === 'date') updateData.transaction_date = editingValue

        const { error } = await supabase
          .from('finance_transactions')
          .update(updateData)
          .eq('id', rowId)

        if (error) throw error
        // Atualização otimista - não recarregar
    } catch (err: any) {
        // Reverter em caso de erro
        fetchAllData()
        toast.error(t('finance.budget.errorUpdate'), {
        description: err.message,
      })
    }
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de reservas
  const handleReserveCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleReserveCellSave = async (rowId: string, field: string, directValue?: string) => {
    // Usar valor direto se fornecido (para Select), senão usar editingValue
    const valueToUse = directValue !== undefined ? directValue : editingValue
    
    const entryIndex = reserveEntries.findIndex(e => e.id === rowId)
    let updated: ReserveEntry[]
    
    if (entryIndex === -1) {
      // Nova reserva
      if (field === 'name' && valueToUse.trim()) {
        const newEntry: ReserveEntry = {
          id: Date.now().toString(),
          name: valueToUse.trim(),
          type: 'reserve',
          value: 0,
          date: new Date().toISOString().split('T')[0]
        }
        updated = [...reserveEntries, newEntry]
        setReserveEntries(updated)
        await saveReserveEntries(updated)
      }
    } else {
      // Editar reserva existente
      updated = [...reserveEntries]
      if (field === 'name') {
        updated[entryIndex] = { ...updated[entryIndex], name: valueToUse.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...updated[entryIndex], value: parseFloat(valueToUse) || 0 }
      } else if (field === 'type') {
        updated[entryIndex] = { ...updated[entryIndex], type: valueToUse as 'reserve' | 'investment' }
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: valueToUse }
      }
      setReserveEntries(updated)
      await saveReserveEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de metas
  const handleMetaCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleMetaCellSave = async (rowId: string, field: string, directValue?: string) => {
    // Usar valor direto se fornecido (para Select), senão usar editingValue
    const valueToUse = directValue !== undefined ? directValue : editingValue

    const entryIndex = metaEntries.findIndex(e => e.id === rowId)
    let updated: MetaEntry[]
    
    if (entryIndex === -1) {
      // Nova meta/investimento
      if (field === 'name' && valueToUse.trim()) {
        const newEntry: MetaEntry = {
          id: Date.now().toString() + Math.random(),
          name: valueToUse.trim(),
          type: 'meta',
          value: 0,
          date: new Date(year, month - 1, 1).toISOString().split('T')[0],
          month: month,
          year: year
        }
        updated = [...metaEntries, newEntry]
        setMetaEntries(updated)
        await saveMetaEntries(updated)
      }
    } else {
      // Editar meta existente
      updated = [...metaEntries]
      if (field === 'name') {
        updated[entryIndex] = { ...updated[entryIndex], name: valueToUse.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...updated[entryIndex], value: parseFloat(valueToUse) || 0 }
      } else if (field === 'type') {
        updated[entryIndex] = { ...updated[entryIndex], type: valueToUse as 'meta' | 'investment' }
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: valueToUse }
      }
      setMetaEntries(updated)
      await saveMetaEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Funções para salvar no Supabase
  const saveIncomeEntries = async (entries: IncomeEntry[]) => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const config = doc?.template_config || {}
      const { error } = await supabase
        .from('finance_documents')
        .update({
          template_config: {
            ...config,
            incomes: entries.map(e => ({
              id: e.id,
              name: e.name,
              value: e.value
            }))
          }
        })
        .eq('id', documentId)

      if (error) throw error
      // Atualização otimista - não recarregar
    } catch (err: any) {
      // Reverter em caso de erro
      fetchAllData()
      toast.error(t('finance.budget.errorSaveIncome'), {
        description: err.message,
      })
    }
  }

  const saveReserveEntries = async (entries: ReserveEntry[]) => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const config = doc?.template_config || {}
      const { error } = await supabase
        .from('finance_documents')
        .update({
          template_config: {
            ...config,
            reserves: entries.map(e => ({
              id: e.id,
              name: e.name,
              type: e.type,
              value: e.value,
              date: e.date
            }))
          }
        })
        .eq('id', documentId)

      if (error) throw error
      // Atualização otimista - não recarregar
    } catch (err: any) {
      // Reverter em caso de erro
      fetchAllData()
      toast.error(t('finance.budget.errorSaveReserve'), {
        description: err.message,
      })
    }
  }

  const saveMetaEntries = async (entries: MetaEntry[]) => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const config = doc?.template_config || {}
      const allMetas = config.metas || []
      
      // Remover metas do mês atual
      const metasOutras = allMetas.filter((m: any) => 
        !(m.month === month && m.year === year)
      )
      
      // Adicionar novas metas do mês atual
      const metasAtualizadas = [
        ...metasOutras,
        ...entries.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          value: e.value,
          date: e.date,
          month: e.month,
          year: e.year
        }))
      ]

      const { error } = await supabase
        .from('finance_documents')
        .update({
          template_config: {
            ...config,
            metas: metasAtualizadas
          }
        })
        .eq('id', documentId)

      if (error) throw error
      // Atualização otimista - não recarregar
    } catch (err: any) {
      // Reverter em caso de erro
      fetchAllData()
      toast.error(t('finance.budget.errorSaveMeta'), {
        description: err.message,
      })
    }
  }

  // Handler para adicionar nova meta (linha vazia)
  const handleAddNewBudget = async (categoryName: string) => {
    if (!categoryName.trim()) return

    // Criar budget otimisticamente
    const tempId = Date.now().toString()
    const category = categories.find(c => c.name === categoryName)
    const newBudget: FinanceBudget = {
      id: tempId,
      finance_document_id: documentId,
      category_id: category?.id || null,
      category_name: categoryName.trim(),
      planned_amount: 0,
      spent_amount: 0,
      month: month,
      year: year,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    // Adicionar à lista local imediatamente
    setBudgets(prev => [...prev, newBudget])

    try {
      const { data, error } = await supabase.from('finance_budgets').insert({
        finance_document_id: documentId,
        category_id: category?.id || null,
        category_name: categoryName.trim(),
        planned_amount: 0,
        spent_amount: 0,
        month: month,
        year: year,
      }).select().single()

      if (error) throw error
      
      // Atualizar com ID real do banco
      if (data) {
        setBudgets(prev => prev.map(b => 
          b.id === tempId ? { ...data, spent_amount: 0 } : b
        ))
      }
      toast.success(t('finance.budget.added'))
    } catch (err: any) {
      // Reverter em caso de erro
      setBudgets(prev => prev.filter(b => b.id !== tempId))
      toast.error(t('finance.budget.errorAdd'), {
        description: err.message,
      })
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100)
      return <AlertTriangle className="h-3 w-3 text-red-500" />
    if (percentage >= 80)
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />
    return <CheckCircle2 className="h-3 w-3 text-green-500" />
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const availableCategories = expenseCategories.filter(
    (cat) => !budgets.some((b) => b.category_name === cat.name)
  )

  // Totais
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.value, 0)
  const totalReserves = reserveEntries.reduce((sum, e) => sum + e.value, 0)
  const totalMetas = metaEntries.reduce((sum, e) => sum + e.value, 0)
  const totalBudgets = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0)

  // Skeleton
  if (isInitializing) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
              <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-2 border rounded-lg bg-muted/30">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Tabelas Skeleton */}
        {Array.from({ length: 4 }).map((_, tableIdx) => (
          <motion.div
            key={tableIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: tableIdx * 0.1 }}
            className="border rounded-lg overflow-hidden"
          >
            <div className="px-3 py-2 border-b bg-muted/30">
              <Skeleton className="h-4 w-32" />
            </div>
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="h-8 text-xs">
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                  <TableHead className="h-8 text-xs">
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                  <TableHead className="h-8 text-xs">
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </TableHead>
                  <TableHead className="h-8 text-xs hidden md:table-cell">
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                  <TableHead className="h-8 w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i} className="h-8">
                    <TableCell className="text-xs py-0 px-2">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-xs py-0 px-2">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-xs py-0 px-2 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-xs py-0 px-2 hidden md:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-xs py-0 px-1">
                      <Skeleton className="h-6 w-6 rounded" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com mês/ano */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-semibold">
            {getMonthName(month, t)} {year}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('finance.budget.monthlyOverview')}
          </p>
        </div>
      </motion.div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: TrendingUp, label: t('finance.budget.income'), value: totalIncome, color: 'text-green-600' },
          { icon: PiggyBank, label: t('finance.budget.reserves'), value: totalReserves, color: 'text-blue-600' },
          { icon: Target, label: t('finance.budget.goals'), value: totalMetas, color: 'text-purple-600' },
          { icon: DollarSign, label: t('finance.budget.budget'), value: totalBudgets, color: 'text-orange-600' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.2 }}
            className="p-2 border rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <card.icon className={`h-3 w-3 ${card.color}`} />
              <span className="text-[10px] text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-xs font-mono font-semibold">{formatCurrency(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabela de Entradas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="border rounded-lg overflow-hidden"
      >
          <div className="px-3 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <h4 className="text-xs font-semibold">{t('finance.budget.income')}</h4>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="h-8 text-xs">{t('finance.budget.name')}</TableHead>
                <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
                <TableHead className="h-8 text-xs text-right hidden md:table-cell">{t('finance.budget.percentage')}</TableHead>
                <TableHead className="h-8 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeEntries.map((entry) => (
                <TableRow key={entry.id} className="h-8">
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'name' ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleIncomeCellSave(entry.id, 'name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleIncomeCellSave(entry.id, 'name')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={(e) => handleIncomeCellEdit(e, entry.id, 'name', entry.name)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        {entry.name || <span className="text-muted-foreground">{t('finance.budget.name')}...</span>}
              </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'value' ? (
                      <Input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleIncomeCellSave(entry.id, 'value')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleIncomeCellSave(entry.id, 'value')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                        autoFocus
                        step="0.01"
                      />
                    ) : (
                      <div
                        onClick={(e) => handleIncomeCellEdit(e, entry.id, 'value', entry.value)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold"
                      >
                        {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
            </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono py-0 px-2 hidden md:table-cell">
                    <span className="text-muted-foreground">{entry.percentage.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell className="text-xs py-0 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const filtered = incomeEntries.filter(e => e.id !== entry.id)
                        setIncomeEntries(filtered)
                        await saveIncomeEntries(filtered)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha vazia para adicionar nova entrada */}
              <TableRow className="h-8">
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === 'new-income' && editingCell?.field === 'name' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleIncomeCellSave('new-income', 'name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleIncomeCellSave('new-income', 'name')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                      placeholder={t('finance.budget.name')}
                    />
                  ) : (
                    <div
                      onClick={(e) => handleIncomeCellEdit(e, 'new-income', 'name', '')}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                    >
                      + {t('finance.budget.addIncome')}...
                    </div>
                  )}
                </TableCell>
                <TableCell colSpan={3} className="text-xs py-0 px-2"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </motion.div>

      {/* Tabela de Gastos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="border rounded-lg overflow-hidden"
      >
        <div className="px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <h4 className="text-xs font-semibold">{t('finance.budget.expenses')}</h4>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 text-xs">{t('finance.table.category')}</TableHead>
              <TableHead className="h-8 text-xs hidden md:table-cell">{t('finance.budget.payment')}</TableHead>
              <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
              <TableHead className="h-8 text-xs hidden lg:table-cell">{t('finance.budget.date')}</TableHead>
              <TableHead className="h-8 w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseEntries.map((entry) => (
              <TableRow key={entry.id} className="h-8">
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === entry.id && editingCell?.field === 'category' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleExpenseCellSave(entry.id, 'category')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleExpenseCellSave(entry.id, 'category')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                      list="expense-categories"
                    />
                  ) : (
                    <div
                      onClick={(e) => handleExpenseCellEdit(e, entry.id, 'category', entry.category)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                    >
                      {entry.category || <span className="text-muted-foreground">{t('finance.table.category')}...</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs py-0 px-2 hidden md:table-cell">
                  {editingCell?.rowId === entry.id && editingCell?.field === 'paymentMethod' ? (
                    <Select
                      value={editingValue || entry.paymentMethod}
                      onValueChange={async (value) => {
                        setEditingValue(value)
                        await handleExpenseCellSave(entry.id, 'paymentMethod')
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-none p-1">
                        <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <span className="text-xs">{method.icon} {method.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  ) : (
                    <div
                      onClick={(e) => handleExpenseCellEdit(e, entry.id, 'paymentMethod', entry.paymentMethod)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                    >
                      {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.icon}{' '}
                      <span className="text-xs">
                        {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.label || t('finance.budget.payment')}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right font-mono py-0 px-2">
                  {editingCell?.rowId === entry.id && editingCell?.field === 'value' ? (
                <Input
                  type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleExpenseCellSave(entry.id, 'value')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleExpenseCellSave(entry.id, 'value')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                      autoFocus
                  step="0.01"
                    />
                  ) : (
                    <div
                      onClick={(e) => handleExpenseCellEdit(e, entry.id, 'value', entry.value)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold"
                    >
                      {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
              </div>
                  )}
                </TableCell>
                <TableCell className="text-xs py-0 px-2 hidden lg:table-cell">
                  {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                    <Input
                      type="date"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleExpenseCellSave(entry.id, 'date')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleExpenseCellSave(entry.id, 'date')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={(e) => handleExpenseCellEdit(e, entry.id, 'date', entry.date)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                    >
                      {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('finance.budget.date')}...</span>}
            </div>
                  )}
                </TableCell>
                <TableCell className="text-xs py-0 px-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        const { error } = await supabase
                          .from('finance_transactions')
                          .delete()
                          .eq('id', entry.id)
                        
                        if (error) throw error
                        await fetchAllData()
                        onRefresh()
                        toast.success(t('finance.budget.deleted'))
                      } catch (err: any) {
                        toast.error(t('finance.budget.errorDelete'), {
                          description: err.message,
                        })
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {/* Linha vazia para adicionar novo gasto */}
            <TableRow className="h-8">
              <TableCell className="text-xs py-0 px-2">
                {editingCell?.rowId === 'new-expense' && editingCell?.field === 'category' ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => handleExpenseCellSave('new-expense', 'category')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleExpenseCellSave('new-expense', 'category')
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        setEditingCell(null)
                      }
                    }}
                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                    autoFocus
                    list="expense-categories"
                    placeholder={t('finance.table.category')}
                  />
                ) : (
                  <div
                    onClick={(e) => handleExpenseCellEdit(e, 'new-expense', 'category', '')}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                  >
                    + {t('finance.budget.addExpense')}...
                    </div>
                )}
              </TableCell>
              <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <datalist id="expense-categories">
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.name} />
          ))}
        </datalist>
      </motion.div>

      {/* Tabela de Reservas & Investimento */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="border rounded-lg overflow-hidden"
      >
          <div className="px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
              <PiggyBank className="h-3 w-3 text-blue-600" />
              <h4 className="text-xs font-semibold">{t('finance.budget.reservesAndInvestment')}</h4>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="h-8 text-xs">{t('finance.budget.name')}</TableHead>
                <TableHead className="h-8 text-xs">{t('finance.budget.type')}</TableHead>
                <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
                <TableHead className="h-8 text-xs hidden md:table-cell">{t('finance.budget.date')}</TableHead>
                <TableHead className="h-8 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reserveEntries.map((entry) => (
                <TableRow key={entry.id} className="h-8">
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'name' ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleReserveCellSave(entry.id, 'name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleReserveCellSave(entry.id, 'name')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={(e) => handleReserveCellEdit(e, entry.id, 'name', entry.name)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        {entry.name || <span className="text-muted-foreground">{t('finance.budget.name')}...</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'type' ? (
                      <Select
                        value={editingValue || entry.type}
                        onValueChange={async (value) => {
                          await handleReserveCellSave(entry.id, 'type', value)
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs border-none p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reserve">{t('finance.budget.reserve')}</SelectItem>
                          <SelectItem value="investment">{t('finance.budget.investment')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        onClick={(e) => handleReserveCellEdit(e, entry.id, 'type', entry.type)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-[10px]">
                          {entry.type === 'investment' ? t('finance.budget.investment') : t('finance.budget.reserve')}
                    </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'value' ? (
                      <Input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleReserveCellSave(entry.id, 'value')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleReserveCellSave(entry.id, 'value')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                        autoFocus
                        step="0.01"
                      />
                    ) : (
                      <div
                        onClick={(e) => handleReserveCellEdit(e, entry.id, 'value', entry.value)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold"
                      >
                        {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-2 hidden md:table-cell">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                      <Input
                        type="date"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleReserveCellSave(entry.id, 'date')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleReserveCellSave(entry.id, 'date')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={(e) => handleReserveCellEdit(e, entry.id, 'date', entry.date)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('finance.budget.date')}...</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const filtered = reserveEntries.filter(e => e.id !== entry.id)
                        setReserveEntries(filtered)
                        await saveReserveEntries(filtered)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha vazia para adicionar nova reserva */}
              <TableRow className="h-8">
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === 'new-reserve' && editingCell?.field === 'name' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleReserveCellSave('new-reserve', 'name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleReserveCellSave('new-reserve', 'name')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                      placeholder={t('finance.budget.name')}
                    />
                  ) : (
                    <div
                      onClick={(e) => handleReserveCellEdit(e, 'new-reserve', 'name', '')}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                    >
                      + {t('finance.budget.addReserve')}...
                  </div>
                  )}
                </TableCell>
                <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </motion.div>

      {/* Tabela de Meta & Investimento */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="border rounded-lg overflow-hidden"
      >
          <div className="px-3 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-purple-600" />
              <h4 className="text-xs font-semibold">{t('finance.budget.goalsAndInvestment')}</h4>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="h-8 text-xs">{t('finance.budget.name')}</TableHead>
                <TableHead className="h-8 text-xs">{t('finance.budget.type')}</TableHead>
                <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
                <TableHead className="h-8 text-xs hidden md:table-cell">{t('finance.budget.date')}</TableHead>
                <TableHead className="h-8 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metaEntries.map((entry) => (
                <TableRow key={entry.id} className="h-8">
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'name' ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleMetaCellSave(entry.id, 'name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleMetaCellSave(entry.id, 'name')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={(e) => handleMetaCellEdit(e, entry.id, 'name', entry.name)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        {entry.name || <span className="text-muted-foreground">{t('finance.budget.name')}...</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'type' ? (
                      <Select
                        value={editingValue || entry.type}
                        onValueChange={async (value) => {
                          await handleMetaCellSave(entry.id, 'type', value)
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs border-none p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meta">{t('finance.budget.goal')}</SelectItem>
                          <SelectItem value="investment">{t('finance.budget.investment')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        onClick={(e) => handleMetaCellEdit(e, entry.id, 'type', entry.type)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-[10px]">
                          {entry.type === 'investment' ? t('finance.budget.investment') : t('finance.budget.goal')}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono py-0 px-2">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'value' ? (
                      <Input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleMetaCellSave(entry.id, 'value')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleMetaCellSave(entry.id, 'value')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                        autoFocus
                        step="0.01"
                      />
                    ) : (
                      <div
                        onClick={(e) => handleMetaCellEdit(e, entry.id, 'value', entry.value)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold"
                      >
                        {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-2 hidden md:table-cell">
                    {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                      <Input
                        type="date"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleMetaCellSave(entry.id, 'date')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleMetaCellSave(entry.id, 'date')
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingCell(null)
                          }
                        }}
                        className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={(e) => handleMetaCellEdit(e, entry.id, 'date', entry.date)}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                      >
                        {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('finance.budget.date')}...</span>}
              </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-0 px-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const filtered = metaEntries.filter(e => e.id !== entry.id)
                        setMetaEntries(filtered)
                        await saveMetaEntries(filtered)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha vazia para adicionar nova meta */}
              <TableRow className="h-8">
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === 'new-meta' && editingCell?.field === 'name' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleMetaCellSave('new-meta', 'name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleMetaCellSave('new-meta', 'name')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                      placeholder={t('finance.budget.name')}
                    />
                  ) : (
                    <div
                      onClick={(e) => handleMetaCellEdit(e, 'new-meta', 'name', '')}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                    >
                      + {t('finance.budget.addGoal')}...
        </div>
                  )}
                </TableCell>
                <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </motion.div>

      {/* Estado vazio */}
      {!loading && budgets.length === 0 && incomeEntries.length === 0 && expenseEntries.length === 0 && reserveEntries.length === 0 && metaEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 border-2 border-dashed rounded-lg"
        >
          <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm text-muted-foreground">
            {t('finance.budget.noGoals')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('finance.budget.addGoalsDesc')}
          </p>
        </motion.div>
      )}
    </div>
  )
}
