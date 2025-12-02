import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  BarChart3,
  DollarSign,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Wallet,
  Target,
  PiggyBank,
  TrendingUp as TrendingUpIcon,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Cloud,
  Loader2,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { FinanceBudget, FinanceCategory, FinanceTransaction, PAYMENT_METHODS } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { SheetsService } from '@/services/google/sheets.service'
import { DriveService } from '@/services/google/drive.service'

interface BudgetManagerNotionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  onDocumentChange?: (documentId: string) => void
}

interface IncomeEntry {
  id: string
  name: string
  value: number
  percentage: number
  date: string
}

interface ExpenseEntry {
  id: string
  category: string
  paymentMethod: string
  value: number
  date: string
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#14b8a6', '#a855f7', '#f97316'
]

export const BudgetManagerNotion = ({
  open,
  onOpenChange,
  documentId,
  onDocumentChange,
}: BudgetManagerNotionProps) => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const { isConnected: isGoogleConnected } = useGoogleIntegration()
  
  // Estados para exportação Google
  const [exportingToSheets, setExportingToSheets] = useState(false)
  const [savingToDrive, setSavingToDrive] = useState(false)
  
  // Estados principais
  const [budgets, setBudgets] = useState<FinanceBudget[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [documents, setDocuments] = useState<Array<{id: string, name: string}>>([])
  const [currentDocumentId, setCurrentDocumentId] = useState(documentId)

  // Estados para sidebars (fechados por padrão)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [showRightSidebar1, setShowRightSidebar1] = useState(false)
  const [showRightSidebar2, setShowRightSidebar2] = useState(false)
  const [showRightSidebar3, setShowRightSidebar3] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Estados para dados das tabelas
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])
  const [reserveEntries, setReserveEntries] = useState<ReserveEntry[]>([])
  const [metaEntries, setMetaEntries] = useState<MetaEntry[]>([])
  const [financeGoals, setFinanceGoals] = useState<any[]>([]) // Metas da tabela finance_goals
  
  // Estado para mês/ano atual
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Estado para meta editável
  const [targetMeta, setTargetMeta] = useState<number | null>(null)
  const [editingMetaTarget, setEditingMetaTarget] = useState(false)
  

  // Auto-preenchimento inteligente
  const [incomeSuggestions, setIncomeSuggestions] = useState<string[]>([])
  const [expenseSuggestions, setExpenseSuggestions] = useState<{category: string[], paymentMethod: string[]}>({category: [], paymentMethod: []})

  // Função de auto-preenchimento - definida antes dos useEffects
  const loadAutoCompleteData = useCallback(() => {
    // Carregar sugestões de entrada baseadas em transações anteriores
    const incomeTransactions = transactions.filter(t => t.type === 'income')
    const incomeNames = [...new Set(incomeTransactions.map(t => t.description || t.category).filter(Boolean))]
    setIncomeSuggestions(incomeNames.slice(0, 10))

    // Carregar sugestões de gastos - usar todas as categorias disponíveis
    const expenseCategories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category).filter(Boolean))]
    // Adicionar categorias do banco de dados também
    const allCategories = [...expenseCategories, ...categories.filter(c => c.type === 'expense').map(c => c.name)]
    const uniqueCategories = [...new Set(allCategories)]
    
    const paymentMethods = [...new Set(transactions.map(t => t.payment_method).filter(Boolean) as string[])]
    setExpenseSuggestions({
      category: uniqueCategories, // Todas as categorias, não apenas 10
      paymentMethod: paymentMethods
    })
  }, [transactions, categories])

  const fetchDocumentData = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_documents')
        .select('*')
        .eq('id', currentDocumentId)
        .single()

      if (error) throw error

      if (data) {
        // Carregar mês/ano do documento ou usar atual
        const month = data.reference_month || new Date().getMonth() + 1
        const year = data.reference_year || new Date().getFullYear()
        setCurrentMonth(month)
        setCurrentYear(year)

        // Carregar dados do template_config
        const config = data.template_config || {}
        
        // Carregar entradas (income)
        const incomes = config.incomes || []
        const totalIncome = incomes.reduce((sum: number, e: any) => sum + (e.value || 0), 0)
        setIncomeEntries(incomes.map((e: any) => ({
          id: e.id || Date.now().toString() + Math.random(),
          name: e.name || '',
          value: e.value || 0,
          percentage: totalIncome > 0 ? ((e.value || 0) / totalIncome) * 100 : 0,
          date: e.date || new Date().toISOString().split('T')[0]
        })))
        
        // Carregar reservas
        const reserves = config.reserves || []
        setReserveEntries(reserves.map((r: any) => ({
          id: r.id || Date.now().toString() + Math.random(),
          name: r.name || '',
          type: r.type || 'reserve',
          value: r.value || 0,
          date: r.date || new Date().toISOString().split('T')[0]
        })))
        
        // Carregar metas da tabela finance_goals (nova integração)
        await fetchFinanceGoals()
        
        // Carregar metas antigas do template_config (para compatibilidade)
        const metas = config.metas || []
        const metasDoMes = metas.filter((m: any) => m.month === month && m.year === year)
        const legacyMetas = metasDoMes.map((m: any) => ({
          id: m.id || Date.now().toString() + Math.random(),
          name: m.name,
          type: m.type || 'meta',
          value: m.value || 0,
          date: m.date || new Date(year, month - 1, 1).toISOString().split('T')[0],
          month: m.month,
          year: m.year
        }))
        
        setMetaEntries(legacyMetas)
      }
    } catch (err: any) {
      console.error('Error fetching document data:', err)
    }
  }

  // Carregar metas da tabela finance_goals
  const fetchFinanceGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_goals')
        .select('*')
        .eq('finance_document_id', currentDocumentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      if (data) {
        setFinanceGoals(data)
        console.log('🎯 Metas carregadas do GoalsBlock:', data)
      }
    } catch (err: any) {
      console.error('Error fetching finance goals:', err)
    }
  }

  // Carregar lista de documentos
  useEffect(() => {
    if (open) {
      const loadDocuments = async () => {
        try {
          let query = supabase
            .from('finance_documents')
            .select('id, name')
            
          if (currentWorkspace?.id) {
            query = query.eq('workspace_id', currentWorkspace.id)
          } else {
            query = query.is('workspace_id', null)
          }
          
          const { data, error } = await query.order('name')
          
          if (error) throw error
          if (data) {
            setDocuments(data)
            // Usar documentId se fornecido, senão usar o primeiro documento
            const docId = documentId || data[0]?.id || ''
            setCurrentDocumentId(docId)
          }
        } catch (err) {
          console.error('Erro ao carregar documentos:', err)
        }
      }
      loadDocuments()
    }
  }, [open, currentWorkspace?.id])

  // Atualizar currentDocumentId quando documentId mudar
  useEffect(() => {
    if (documentId) {
      setCurrentDocumentId(documentId)
    }
  }, [documentId])

  useEffect(() => {
    if (open && currentDocumentId) {
      setHasLoaded(false)
      setBudgets([])
      setTransactions([])
      setIncomeEntries([])
      setReserveEntries([])
      setMetaEntries([])
      fetchDocumentData()
      fetchCategories()
      fetchTransactions().then(() => {
        fetchBudgets()
      }).catch((err) => {
        console.error('Error loading transactions:', err)
      })
    } else if (!open) {
      // Limpar estados quando dialog fecha
      setIncomeEntries([])
      setReserveEntries([])
      setMetaEntries([])
      setExpenseEntries([])
    }
  }, [open, currentDocumentId])

  useEffect(() => {
    if (transactions.length > 0 && !hasLoaded) {
      setHasLoaded(true)
      fetchBudgets()
    }
    if (transactions.length > 0) {
      loadAutoCompleteData()
    }
  }, [transactions.length, hasLoaded, loadAutoCompleteData])

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (currentWorkspace) {
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        query = query.is('workspace_id', null)
      }

      const { data, error } = await query
      if (error) throw error

      setCategories(data || [])
    } catch (err: any) {
      toast.error(t('finance.categories.errorLoad'), {
        description: err.message,
      })
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('finance_document_id', currentDocumentId)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
      
      // Carregar gastos das transações
      const expenses = (data || [])
        .filter(t => t.type === 'expense')
        .map(t => ({
          id: t.id,
          category: t.category,
          paymentMethod: t.payment_method || 'cash',
          value: t.amount,
          date: t.transaction_date
        }))
      setExpenseEntries(expenses)
      
      return data || []
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setTransactions([])
      return []
    }
  }

  const fetchBudgets = async () => {
    if (!documentId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('finance_document_id', currentDocumentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const budgetsWithSpent = await Promise.all(
        (data || []).map(async (budget) => {
          const categoryTransactions = transactions.filter(
            (t) => t.category === budget.category_name && t.status === 'completed'
          )
          const spent = categoryTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          )

          if (Math.abs(Number(budget.spent_amount) - spent) > 0.01) {
            await supabase
              .from('finance_budgets')
              .update({ spent_amount: spent })
              .eq('id', budget.id)
          }

          return { ...budget, spent_amount: spent }
        })
      )

      setBudgets(budgetsWithSpent)
    } catch (err: any) {
      toast.error(t('finance.budget.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }


  // Cálculos para gráfico e relatórios
  const chartData = useMemo(() => {
    const incomeTotal = incomeEntries.reduce((sum, e) => sum + e.value, 0)
    const expenseTotal = expenseEntries.reduce((sum, e) => sum + e.value, 0)
    const reserveTotal = reserveEntries.reduce((sum, e) => sum + e.value, 0)
    const metaTotal = metaEntries.reduce((sum, e) => sum + e.value, 0)
    const budgetTotal = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0)

    return [
      { name: 'Entradas', value: incomeTotal, color: COLORS[2] },
      { name: 'Gastos', value: expenseTotal, color: COLORS[1] },
      { name: 'Reservas', value: reserveTotal, color: COLORS[3] },
      { name: 'Metas', value: metaTotal, color: COLORS[4] },
      { name: 'Orçamento', value: budgetTotal, color: COLORS[0] },
    ].filter(item => item.value > 0)
  }, [incomeEntries, expenseEntries, reserveEntries, metaEntries, budgets])

  // Carregar meta do documento
  useEffect(() => {
    if (open && currentDocumentId) {
      const loadMetaTarget = async () => {
        try {
          const { data } = await supabase
            .from('finance_documents')
            .select('template_config')
            .eq('id', currentDocumentId)
            .single()
          
          if (data?.template_config?.targetMeta) {
            setTargetMeta(data.template_config.targetMeta)
          }
        } catch (err) {
          // Ignorar erro
        }
      }
      loadMetaTarget()
    }
  }, [open, currentDocumentId])

  const saveMetaTarget = async (value: number) => {
    try {
        const { data: doc } = await supabase
          .from('finance_documents')
          .select('template_config')
          .eq('id', currentDocumentId)
          .single()

        if (doc) {
        const { error } = await supabase
           .from('finance_documents')
           .update({
             template_config: {
               ...doc.template_config,
               targetMeta: value
             }
           })
           .eq('id', currentDocumentId)

      if (error) throw error
        setTargetMeta(value)
      }
    } catch (err: any) {
      toast.error(t('finance.budget.errorSaveMeta'), { description: err.message })
    }
  }

  const metaData = useMemo(() => {
    // Calcular total de metas do mês atual
    const thisMonthMetas = metaEntries
      .filter(e => e.month === currentMonth && e.year === currentYear)
      .reduce((sum, e) => sum + e.value, 0)

    const totalMetas = metaEntries.reduce((sum, e) => sum + e.value, 0)
    
    // Meta editável - usar valor salvo ou calcular 20% da renda como padrão
    const incomeTotal = incomeEntries.reduce((sum, e) => sum + e.value, 0)
    const targetReserve = targetMeta !== null ? targetMeta : (incomeTotal * 0.2) // Meta editável ou 20% padrão
    const remaining = Math.max(0, targetReserve - totalMetas)

    return {
      thisMonth: thisMonthMetas,
      total: totalMetas,
      target: targetReserve,
      remaining
    }
  }, [metaEntries, incomeEntries, currentMonth, currentYear, targetMeta])

  const reports = useMemo(() => {
    const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0)
    const totalRemaining = totalPlanned - totalSpent
    const percentage = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0

    return {
      totalPlanned,
      totalSpent,
      totalRemaining,
      percentage,
    }
  }, [budgets])

  const availableCategories = categories.filter(cat => cat.type === 'expense')

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // Handlers para edição inline de entrada
  const handleCellEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleCellSave = async (rowId: string, field: string) => {
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
          percentage: 0,
          date: new Date().toISOString().split('T')[0] // Data atual como padrão
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
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: editingValue }
      }
      setIncomeEntries(updated)
      await saveIncomeEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de gastos
  const handleExpenseCellEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleExpenseCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const entryIndex = expenseEntries.findIndex(e => e.id === rowId)
    if (entryIndex === -1) {
      // Novo gasto - criar transação
      if (field === 'category' && editingValue.trim()) {
        try {
          const { data, error } = await supabase.from('finance_transactions').insert({
            finance_document_id: currentDocumentId,
            type: 'expense',
            category: editingValue.trim(),
            description: editingValue.trim(),
            amount: 0,
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            status: 'completed',
          }).select().single()

      if (error) throw error

          // Adicionar à lista local
          if (data) {
            setExpenseEntries([...expenseEntries, {
              id: data.id,
              category: data.category,
              paymentMethod: data.payment_method || 'cash',
              value: data.amount,
              date: data.transaction_date
            }])
          }
          await fetchTransactions()
    } catch (err: any) {
          toast.error(t('finance.budget.errorCreateExpense'), { description: err.message })
        }
      }
    } else {
      // Editar gasto existente - salvar no Supabase
      const entry = expenseEntries[entryIndex]
      const updated = [...expenseEntries]
      
      if (field === 'category') {
        updated[entryIndex] = { ...updated[entryIndex], category: editingValue.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...updated[entryIndex], value: parseFloat(editingValue) || 0 }
      } else if (field === 'paymentMethod') {
        updated[entryIndex] = { ...updated[entryIndex], paymentMethod: editingValue }
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: editingValue }
      }
      
      setExpenseEntries(updated)
      
      // Salvar no Supabase
    try {
      const { error } = await supabase
          .from('finance_transactions')
          .update({
            category: updated[entryIndex].category,
            amount: updated[entryIndex].value,
            payment_method: updated[entryIndex].paymentMethod,
            transaction_date: updated[entryIndex].date,
            description: updated[entryIndex].category,
          })
          .eq('id', entry.id)

      if (error) throw error
        await fetchTransactions()
    } catch (err: any) {
        toast.error(t('finance.budget.errorSaveExpense'), { description: err.message })
        // Reverter mudança local em caso de erro
        setExpenseEntries(expenseEntries)
      }
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de reservas
  const handleReserveCellEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleReserveCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const entryIndex = reserveEntries.findIndex(e => e.id === rowId)
    let updated: ReserveEntry[]
    
    if (entryIndex === -1) {
      // Nova reserva
      if (field === 'name' && editingValue.trim()) {
        const newEntry: ReserveEntry = {
          id: Date.now().toString(),
          name: editingValue.trim(),
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
        updated[entryIndex] = { ...updated[entryIndex], name: editingValue.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...updated[entryIndex], value: parseFloat(editingValue) || 0 }
      } else if (field === 'type') {
        updated[entryIndex] = { ...updated[entryIndex], type: editingValue as 'reserve' | 'investment' }
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: editingValue }
      }
      setReserveEntries(updated)
      await saveReserveEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  // Handlers para edição inline de metas
  const handleMetaCellEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleMetaCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const entryIndex = metaEntries.findIndex(e => e.id === rowId)
    if (entryIndex === -1) {
      // Nova meta/investimento
      if (field === 'name' && editingValue.trim()) {
        const newEntry: MetaEntry = {
          id: Date.now().toString() + Math.random(),
          name: editingValue.trim(),
          type: 'meta',
          value: 0,
          date: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
          month: currentMonth,
          year: currentYear
        }
        const updated = [...metaEntries, newEntry]
        setMetaEntries(updated)
        await saveMetaEntries(updated)
      }
    } else {
      // Editar meta existente
      const updated = [...metaEntries]
      if (field === 'name') {
        updated[entryIndex] = { ...updated[entryIndex], name: editingValue.trim() }
      } else if (field === 'value') {
        updated[entryIndex] = { ...updated[entryIndex], value: parseFloat(editingValue) || 0 }
      } else if (field === 'type') {
        updated[entryIndex] = { ...updated[entryIndex], type: editingValue as 'meta' | 'investment' }
      } else if (field === 'date') {
        updated[entryIndex] = { ...updated[entryIndex], date: editingValue }
      }
      setMetaEntries(updated)
      await saveMetaEntries(updated)
    }
    setEditingCell(null)
    setEditingValue('')
  }

  const saveIncomeEntries = async (entries: IncomeEntry[]) => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', currentDocumentId)
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
              value: e.value,
              date: e.date
            }))
          }
        })
        .eq('id', currentDocumentId)

      if (error) throw error
    } catch (err: any) {
      toast.error(t('finance.budget.errorSaveIncome'), { description: err.message })
    }
  }

  const saveReserveEntries = async (entries: ReserveEntry[]) => {
    try {
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', currentDocumentId)
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
        .eq('id', currentDocumentId)

      if (error) throw error
    } catch (err: any) {
      toast.error(t('finance.budget.errorSaveReserves'), { description: err.message })
    }
  }

  const saveMetaEntries = async (entries: MetaEntry[]) => {
    try {
      // Buscar documento atual
      const { data: doc, error: docError } = await supabase
        .from('finance_documents')
        .select('template_config')
        .eq('id', currentDocumentId)
        .single()

      if (docError) throw docError

      const config = doc?.template_config || {}
      const allMetas = config.metas || []
      
      // Remover metas do mês atual
      const metasOutras = allMetas.filter((m: any) => 
        !(m.month === currentMonth && m.year === currentYear)
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
        .eq('id', currentDocumentId)

      if (error) throw error
    } catch (err: any) {
      toast.error(t('finance.budget.errorSaveMeta'), { description: err.message })
    }
  }

  // 📊 Exportar orçamento para Google Sheets
  const handleExportToSheets = async () => {
    if (!isGoogleConnected) {
      toast.error(t('finance.budget.connectGoogleFirst'), { description: t('finance.budget.goToIntegrations') })
      return
    }

    setExportingToSheets(true)
    try {
      // Criar planilha
      const title = `Orçamento ${currentMonth}/${currentYear} - ISACAR`
      const spreadsheet = await SheetsService.createSpreadsheet(title, currentWorkspace?.id)
      
      if (!spreadsheet) throw new Error('Erro ao criar planilha')

      // Preparar dados
      const headers = [['Categoria', 'Tipo', 'Valor', 'Percentual', 'Data']]
      
      const incomeData = incomeEntries.map(e => [
        e.name, 'Entrada', formatCurrency(e.value), `${e.percentage}%`, e.date
      ])
      
      const expenseData = expenseEntries.map(e => [
        e.category, 'Gasto', formatCurrency(e.value), '-', e.date
      ])
      
      const reserveData = reserveEntries.map(e => [
        e.name, e.type === 'reserve' ? 'Reserva' : 'Investimento', formatCurrency(e.value), '-', e.date
      ])
      
      const metaData = metaEntries.map(e => [
        e.name, 'Meta', formatCurrency(e.value), '-', e.date
      ])

      // Calcular totais
      const totalIncome = incomeEntries.reduce((sum, e) => sum + e.value, 0)
      const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.value, 0)
      const totalReserves = reserveEntries.reduce((sum, e) => sum + e.value, 0)

      const summary = [
        [''],
        ['RESUMO'],
        ['Total Entradas', '', formatCurrency(totalIncome), '', ''],
        ['Total Gastos', '', formatCurrency(totalExpenses), '', ''],
        ['Total Reservas', '', formatCurrency(totalReserves), '', ''],
        ['Saldo', '', formatCurrency(totalIncome - totalExpenses - totalReserves), '', ''],
      ]

      const allData = [...headers, ...incomeData, ...expenseData, ...reserveData, ...metaData, ...summary]

      // Obter nome da primeira aba
      const firstSheetName = spreadsheet.sheets?.[0]?.title || 'Sheet1'
      
      // Escrever dados
      await SheetsService.writeData(
        spreadsheet.spreadsheetId,
        `${firstSheetName}!A1:E${allData.length}`,
        allData,
        currentWorkspace?.id
      )

      toast.success(t('finance.budget.spreadsheetCreated'), {
        action: {
          label: 'Abrir',
          onClick: () => window.open(spreadsheet.spreadsheetUrl, '_blank')
        }
      })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error(t('finance.budget.errorExport'), { description: error.message })
    } finally {
      setExportingToSheets(false)
    }
  }

  // 💾 Salvar relatório no Google Drive
  const handleSaveToDrive = async () => {
    if (!isGoogleConnected) {
      toast.error(t('finance.budget.connectGoogleFirst'), { description: t('finance.budget.goToIntegrations') })
      return
    }

    setSavingToDrive(true)
    try {
      // Calcular totais
      const totalIncome = incomeEntries.reduce((sum, e) => sum + e.value, 0)
      const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.value, 0)
      const totalReserves = reserveEntries.reduce((sum, e) => sum + e.value, 0)

      // Criar CSV
      const csvLines = [
        'Categoria,Tipo,Valor,Data',
        ...incomeEntries.map(e => `${e.name},Entrada,${e.value},${e.date}`),
        ...expenseEntries.map(e => `${e.category},Gasto,${e.value},${e.date}`),
        ...reserveEntries.map(e => `${e.name},${e.type},${e.value},${e.date}`),
        '',
        'RESUMO',
        `Total Entradas,,${totalIncome},`,
        `Total Gastos,,${totalExpenses},`,
        `Saldo,,${totalIncome - totalExpenses - totalReserves},`,
      ]
      
      const csvContent = csvLines.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], `Orcamento_${currentMonth}_${currentYear}.csv`, { type: 'text/csv' })
      
      const result = await DriveService.uploadFile(file)
      
      toast.success(t('finance.budget.savedToDrive'), {
        action: {
          label: 'Abrir',
          onClick: () => window.open(result.webViewLink, '_blank')
        }
      })
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(t('finance.budget.errorSaveDrive'), { description: error.message })
    } finally {
      setSavingToDrive(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 flex flex-col overflow-hidden !max-w-none",
          isFullscreen 
            ? "!w-[100vw] !h-[100vh] rounded-none" 
            : "w-[95vw] md:!w-[85vw] lg:!w-[75vw] xl:!w-[60vw] h-[90vh] md:!h-[85vh] lg:!h-[80vh] rounded-lg"
        )} 
        showClose={false}
      >
        {/* Header com Toggles */}
        <DialogHeader className="px-4 py-2 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              {t('finance.budget.budgets')}
            </DialogTitle>
            
            {/* Select de Documentos */}
            {documents.length > 0 && (
              <Select
                value={currentDocumentId}
                onValueChange={(value) => {
                  setCurrentDocumentId(value)
                  if (onDocumentChange) {
                    onDocumentChange(value)
                  }
                  // Recarregar dados do novo documento
                  setHasLoaded(false)
                  setBudgets([])
                  setTransactions([])
                  setIncomeEntries([])
                  setReserveEntries([])
                  setMetaEntries([])
                  fetchDocumentData()
                  fetchCategories()
                  fetchTransactions().then(() => {
                    loadAutoCompleteData()
                    setHasLoaded(true)
                  })
                }}
              >
                <SelectTrigger className="h-7 w-[200px] text-xs">
                  <SelectValue placeholder="Selecione um documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showLeftSidebar}
                    onPressedChange={setShowLeftSidebar}
                    aria-label="Toggle Entrada"
                    size="sm"
                    className={cn(
                      "transition-all",
                      showLeftSidebar && "bg-accent text-accent-foreground ring-1 ring-ring"
                    )}
                  >
                    <TrendingUpIcon className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {showLeftSidebar ? 'Ocultar Entrada' : 'Mostrar Entrada'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showRightSidebar1}
                    onPressedChange={setShowRightSidebar1}
                    aria-label="Toggle Gastos"
                    size="sm"
                    className={cn(
                      "transition-all",
                      showRightSidebar1 && "bg-accent text-accent-foreground ring-1 ring-ring"
                    )}
                  >
                    <TrendingDown className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {showRightSidebar1 ? 'Ocultar Gastos' : 'Mostrar Gastos'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showRightSidebar2}
                    onPressedChange={setShowRightSidebar2}
                    aria-label="Toggle Reservas"
                    size="sm"
                    className={cn(
                      "transition-all",
                      showRightSidebar2 && "bg-accent text-accent-foreground ring-1 ring-ring"
                    )}
                  >
                    <PiggyBank className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {showRightSidebar2 ? 'Ocultar Reservas' : 'Mostrar Reservas'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showRightSidebar3}
                    onPressedChange={setShowRightSidebar3}
                    aria-label="Toggle Meta"
                    size="sm"
                    className={cn(
                      "transition-all",
                      showRightSidebar3 && "bg-accent text-accent-foreground ring-1 ring-ring"
                    )}
                  >
                    <Target className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {showRightSidebar3 ? 'Ocultar Meta' : 'Mostrar Meta'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botões de Exportação Google */}
            {isGoogleConnected && (
              <>
                <div className="h-4 w-px bg-border mx-1" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExportToSheets}
                        disabled={exportingToSheets}
                        className="h-8 w-8"
                      >
                        {exportingToSheets ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Exportar para Google Sheets
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveToDrive}
                        disabled={savingToDrive}
                        className="h-8 w-8"
                      >
                        {savingToDrive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Cloud className="h-4 w-4 text-blue-600" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Salvar no Google Drive
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="ml-2"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content com Resizable Panels */}
        <ResizablePanelGroup 
          key={`panels-${showLeftSidebar}-${showRightSidebar1}-${showRightSidebar2}-${showRightSidebar3}`}
          direction="horizontal" 
          className="flex-1 min-h-0 w-full"
        >
          {/* Sidebar Esquerda - Entrada */}
          {showLeftSidebar && (
            <>
              <ResizablePanel 
                defaultSize={30} 
                minSize={25} 
                maxSize={45} 
                collapsible 
                className="min-w-[280px]"
              >
                <div className="h-full overflow-y-auto p-4 border-r border-border">
              <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUpIcon className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-semibold">Entrada</h3>
                    </div>

                    {/* Tabela Editável de Entradas */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">Nome</TableHead>
                            <TableHead className="h-8 text-xs text-right">Valor</TableHead>
                            <TableHead className="h-8 text-xs text-right">%</TableHead>
                            <TableHead className="h-8 text-xs">Data</TableHead>
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
                                    onBlur={() => handleCellSave(entry.id, 'name')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave(entry.id, 'name')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                    list="income-suggestions"
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleCellEdit(entry.id, 'name', entry.name)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.name || <span className="text-muted-foreground">Nome...</span>}
                            </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'value' ? (
                    <Input
                      type="number"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={() => handleCellSave(entry.id, 'value')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave(entry.id, 'value')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                                    autoFocus
                      step="0.01"
                    />
                                ) : (
                                  <div
                                    onClick={() => handleCellEdit(entry.id, 'value', entry.value)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end"
                                  >
                                    {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-right py-0 px-2">
                                {entry.percentage.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-xs py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                                  <Input
                                    type="date"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={() => handleCellSave(entry.id, 'date')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave(entry.id, 'date')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleCellEdit(entry.id, 'date', entry.date || '')}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">Data...</span>}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-0 px-1">
                    <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={async () => {
                                    const filtered = incomeEntries.filter(e => e.id !== entry.id)
                                    const newTotal = filtered.reduce((sum, e) => sum + e.value, 0)
                                    const updated = filtered.map(e => ({
                                      ...e,
                                      percentage: newTotal > 0 ? (e.value / newTotal) * 100 : 0
                                    }))
                                    setIncomeEntries(updated)
                                    await saveIncomeEntries(updated)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
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
                                  onBlur={() => handleCellSave('new-income', 'name')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave('new-income', 'name')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                  autoFocus
                                  list="income-suggestions"
                                  placeholder="Nome..."
                                />
                              ) : (
                                <div
                                  onClick={() => handleCellEdit('new-income', 'name', '')}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                                >
                                  + Adicionar entrada...
                  </div>
                              )}
                            </TableCell>
                            <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <datalist id="income-suggestions">
                        {incomeSuggestions.map((suggestion, idx) => (
                          <option key={idx} value={suggestion} />
                        ))}
                      </datalist>
                </div>
                    </div>
                    </div>
              </ResizablePanel>
              <ResizableHandle className="w-0.5 hover:w-1 transition-all" />
            </>
          )}

          {/* Conteúdo Central - Gráfico de Pizza */}
          <ResizablePanel 
            defaultSize={
              !showLeftSidebar && !showRightSidebar1 && !showRightSidebar2 && !showRightSidebar3 ? 100 :
              !showLeftSidebar && (showRightSidebar1 || showRightSidebar2 || showRightSidebar3) ? 60 :
              showLeftSidebar && !showRightSidebar1 && !showRightSidebar2 && !showRightSidebar3 ? 75 :
              35
            } 
            minSize={25} 
            maxSize={showLeftSidebar ? 60 : 80} 
            className="min-w-[300px]"
          >
            <div className="h-full flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-md">
                <h3 className="text-sm font-semibold mb-4 text-center">Distribuição Financeira</h3>
                <ChartContainer
                  config={{
                    entradas: { label: 'Entradas', color: COLORS[2] },
                    gastos: { label: 'Gastos', color: COLORS[1] },
                    reservas: { label: 'Reservas', color: COLORS[3] },
                    metas: { label: 'Metas', color: COLORS[4] },
                    orçamento: { label: 'Orçamento', color: COLORS[0] },
                  }}
                  className="h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                        // Calcular posição do label para evitar sobreposição
                        const RADIAN = Math.PI / 180
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.7
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        
                        // Só mostrar label se a porcentagem for >= 3% para evitar sobreposição
                        if (percent < 0.03) return null
                        
                        // Ajustar posição vertical para evitar sobreposição
                        const labelOffset = index % 2 === 0 ? -5 : 5
                        
                        return (
                          <text
                            x={x}
                            y={y + labelOffset}
                            fill="white"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={10}
                            fontWeight="600"
                            className="pointer-events-none drop-shadow-sm"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                          >
                            {percent >= 0.1 ? `${name}: ${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`}
                          </text>
                        )
                      }}
                      outerRadius={90}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: data.payload.color }}
                                  />
                                  <span className="text-sm font-medium">{data.name}</span>
                    </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(Number(data.value))}
                    </div>
                    </div>
                  </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ChartContainer>
                
                {/* Legenda abaixo do gráfico para evitar sobreposição */}
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Sidebars Direitas */}
          {(showRightSidebar1 || showRightSidebar2 || showRightSidebar3) && (
            <ResizableHandle className="w-0.5 hover:w-1 transition-all" />
          )}

          {/* Sidebar 1 - Gastos */}
          {showRightSidebar1 && (
            <>
              <ResizablePanel 
                defaultSize={
                  showRightSidebar2 && showRightSidebar3 ? 25 :
                  (showRightSidebar2 || showRightSidebar3) ? 30 :
                  35
                } 
                minSize={22} 
                maxSize={40} 
                collapsible 
                className="min-w-[280px]"
              >
                <div className="h-full overflow-y-auto p-4 border-l border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <h3 className="text-sm font-semibold">Gastos</h3>
                </div>

                    {/* Tabela Editável de Gastos */}
                    <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">Categoria</TableHead>
                            <TableHead className="h-8 text-xs">Pagamento</TableHead>
                            <TableHead className="h-8 text-xs text-right">Valor</TableHead>
                            <TableHead className="h-8 text-xs">Data</TableHead>
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
                                      if (e.key === 'Enter') handleExpenseCellSave(entry.id, 'category')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                    list="expense-categories"
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleExpenseCellEdit(entry.id, 'category', entry.category)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.category || <span className="text-muted-foreground">Categoria...</span>}
                            </div>
                                )}
                          </TableCell>
                              <TableCell className="text-xs py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'paymentMethod' ? (
                                  <Select
                                    value={editingValue || entry.paymentMethod}
                                    onValueChange={async (value) => {
                                      setEditingValue(value)
                                      const updated = [...expenseEntries]
                                      const entryIndex = updated.findIndex(e => e.id === entry.id)
                                      if (entryIndex !== -1) {
                                        updated[entryIndex] = { ...updated[entryIndex], paymentMethod: value }
                                        setExpenseEntries(updated)
                                        
                                        // Salvar no Supabase
                                        try {
                                          const { error } = await supabase
                                            .from('finance_transactions')
                                            .update({ payment_method: value })
                                            .eq('id', entry.id)
                                          
                                          if (error) throw error
                                          await fetchTransactions()
                                        } catch (err: any) {
                                          toast.error(t('finance.budget.errorSavePayment'), { description: err.message })
                                        }
                                      }
                                      setEditingCell(null)
                                      setEditingValue('')
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs border-none p-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PAYMENT_METHODS.map((method) => (
                                        <SelectItem key={method.value} value={method.value}>
                                          {method.icon} {method.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div
                                    onClick={() => handleExpenseCellEdit(entry.id, 'paymentMethod', entry.paymentMethod)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.icon} {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.label || 'Pagamento...'}
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
                                      if (e.key === 'Enter') handleExpenseCellSave(entry.id, 'value')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                                    autoFocus
                                    step="0.01"
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleExpenseCellEdit(entry.id, 'value', entry.value)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end"
                                  >
                                    {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                                  </div>
                                )}
                          </TableCell>
                              <TableCell className="text-xs py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                                  <Input
                                    type="date"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={() => handleExpenseCellSave(entry.id, 'date')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleExpenseCellSave(entry.id, 'date')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleExpenseCellEdit(entry.id, 'date', entry.date)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">Data...</span>}
                            </div>
                                )}
                          </TableCell>
                              <TableCell className="py-0 px-1">
                            <Button
                              size="icon"
                              variant="ghost"
                                  className="h-6 w-6"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('finance_transactions')
                                        .delete()
                                        .eq('id', entry.id)
                                      
                                      if (error) throw error
                                      setExpenseEntries(expenseEntries.filter(e => e.id !== entry.id))
                                      await fetchTransactions()
                                    } catch (err: any) {
                                      toast.error(t('finance.budget.errorDeleteExpense'), { description: err.message })
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
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
                                    if (e.key === 'Enter') handleExpenseCellSave('new-expense', 'category')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                  autoFocus
                                  list="expense-categories"
                                  placeholder="Categoria..."
                                />
                              ) : (
                                <div
                                  onClick={() => handleExpenseCellEdit('new-expense', 'category', '')}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                                >
                                  + Adicionar gasto...
                                </div>
                              )}
                            </TableCell>
                            <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
                          </TableRow>
                  </TableBody>
                </Table>
                      <datalist id="expense-categories">
                        {availableCategories.map((cat) => (
                          <option key={cat.id} value={cat.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
            </div>
          </ResizablePanel>
              <ResizableHandle className="w-0.5 hover:w-1 transition-all" />
            </>
          )}

          {/* Sidebar 2 - Reservas & Investimento */}
          {showRightSidebar2 && (
            <>
              <ResizablePanel 
                defaultSize={
                  showRightSidebar1 && showRightSidebar3 ? 25 :
                  showRightSidebar3 ? 30 :
                  showRightSidebar1 ? 30 :
                  35
                } 
                minSize={22} 
                maxSize={40} 
                collapsible 
                className="min-w-[280px]"
              >
                <div className="h-full overflow-y-auto p-4 border-l border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <PiggyBank className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold">Reservas & Investimento</h3>
                    </div>

                    {/* Tabela Editável de Reservas */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">Nome</TableHead>
                            <TableHead className="h-8 text-xs">Tipo</TableHead>
                            <TableHead className="h-8 text-xs text-right">Valor</TableHead>
                            <TableHead className="h-8 text-xs">Data</TableHead>
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
                                      if (e.key === 'Enter') handleReserveCellSave(entry.id, 'name')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleReserveCellEdit(entry.id, 'name', entry.name)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.name || <span className="text-muted-foreground">Nome...</span>}
                    </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'type' ? (
                                  <Select
                                    value={editingValue}
                                    onValueChange={(value) => {
                                      setEditingValue(value)
                                      handleReserveCellSave(entry.id, 'type')
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs border-none p-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="reserve">Reserva</SelectItem>
                                      <SelectItem value="investment">Investimento</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div
                                    onClick={() => handleReserveCellEdit(entry.id, 'type', entry.type)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                      {entry.type === 'investment' ? 'Investimento' : 'Reserva'}
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
                                      if (e.key === 'Enter') handleReserveCellSave(entry.id, 'value')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                                    autoFocus
                                    step="0.01"
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleReserveCellEdit(entry.id, 'value', entry.value)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end"
                                  >
                                    {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                    </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs py-0 px-2">
                                {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                                  <Input
                                    type="date"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={() => handleReserveCellSave(entry.id, 'date')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleReserveCellSave(entry.id, 'date')
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => handleReserveCellEdit(entry.id, 'date', entry.date)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">Data...</span>}
                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-0 px-1">
                            <Button
                              size="icon"
                              variant="ghost"
                                  className="h-6 w-6"
                                  onClick={async () => {
                                    const filtered = reserveEntries.filter(e => e.id !== entry.id)
                                    setReserveEntries(filtered)
                                    await saveReserveEntries(filtered)
                                  }}
                            >
                                  <Trash2 className="h-3 w-3" />
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
                                    if (e.key === 'Enter') handleReserveCellSave('new-reserve', 'name')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                  autoFocus
                                  placeholder="Nome..."
                                />
                              ) : (
                                <div
                                  onClick={() => handleReserveCellEdit('new-reserve', 'name', '')}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                                >
                                  + Adicionar reserva...
                </div>
                              )}
                            </TableCell>
                            <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
                          </TableRow>
                  </TableBody>
                </Table>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-0.5 hover:w-1 transition-all" />
            </>
          )}

          {/* Sidebar 3 - Meta & Investimento */}
          {showRightSidebar3 && (
            <ResizablePanel 
              defaultSize={
                showRightSidebar1 && showRightSidebar2 ? 25 :
                (showRightSidebar1 || showRightSidebar2) ? 30 :
                35
              } 
              minSize={22} 
              maxSize={40} 
              collapsible 
              className="min-w-[280px]"
            >
              <div className="h-full overflow-y-auto p-4 border-l border-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-semibold">Meta & Investimento</h3>
                  </div>

                  {/* Tabela Editável de Metas */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="h-8 text-xs">Nome</TableHead>
                          <TableHead className="h-8 text-xs">Tipo</TableHead>
                          <TableHead className="h-8 text-xs text-right">Valor</TableHead>
                          <TableHead className="h-8 text-xs">Data</TableHead>
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
                                    if (e.key === 'Enter') handleMetaCellSave(entry.id, 'name')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => handleMetaCellEdit(entry.id, 'name', entry.name)}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                >
                                  {entry.name || <span className="text-muted-foreground">Nome...</span>}
                            </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs py-0 px-2">
                              {editingCell?.rowId === entry.id && editingCell?.field === 'type' ? (
                                <Select
                                  value={editingValue}
                                  onValueChange={async (value) => {
                                    setEditingValue(value)
                                    const updated = [...metaEntries]
                                    const entryIndex = updated.findIndex(e => e.id === entry.id)
                                    if (entryIndex !== -1) {
                                      updated[entryIndex] = { ...updated[entryIndex], type: value as 'meta' | 'investment' }
                                      setMetaEntries(updated)
                                      await saveMetaEntries(updated)
                                    }
                                    setEditingCell(null)
                                    setEditingValue('')
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs border-none p-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="meta">Meta</SelectItem>
                                    <SelectItem value="investment">Investimento</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div
                                  onClick={() => handleMetaCellEdit(entry.id, 'type', entry.type)}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                >
                                  <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                    {entry.type === 'investment' ? 'Investimento' : 'Meta'}
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
                                    if (e.key === 'Enter') handleMetaCellSave(entry.id, 'value')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right"
                                  autoFocus
                                  step="0.01"
                                />
                              ) : (
                                <div
                                  onClick={() => handleMetaCellEdit(entry.id, 'value', entry.value)}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end"
                                >
                                  {entry.value > 0 ? formatCurrency(entry.value) : <span className="text-muted-foreground">0,00</span>}
                          </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs py-0 px-2">
                              {editingCell?.rowId === entry.id && editingCell?.field === 'date' ? (
                                <Input
                                  type="date"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => handleMetaCellSave(entry.id, 'date')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleMetaCellSave(entry.id, 'date')
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => handleMetaCellEdit(entry.id, 'date', entry.date)}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                >
                                  {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">Data...</span>}
                    </div>
                              )}
                            </TableCell>
                            <TableCell className="py-0 px-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={async () => {
                                  const filtered = metaEntries.filter(e => e.id !== entry.id)
                                  setMetaEntries(filtered)
                                  await saveMetaEntries(filtered)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
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
                                  if (e.key === 'Enter') handleMetaCellSave('new-meta', 'name')
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                                autoFocus
                                placeholder="Nome..."
                              />
                            ) : (
                              <div
                                onClick={() => handleMetaCellEdit('new-meta', 'name', '')}
                                className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                              >
                                + Adicionar meta/investimento...
                  </div>
                )}
                          </TableCell>
                          <TableCell colSpan={4} className="text-xs py-0 px-2"></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Resumo */}
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total este mês</span>
                      <span className="text-xs font-mono font-semibold">
                        {formatCurrency(metaEntries.reduce((sum, e) => sum + e.value, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      {editingMetaTarget ? (
                        <Input
                          type="number"
                          value={targetMeta !== null ? targetMeta : metaData.target}
                          onChange={(e) => setTargetMeta(parseFloat(e.target.value) || 0)}
                          onBlur={() => {
                            if (targetMeta !== null) {
                              saveMetaTarget(targetMeta)
                            }
                            setEditingMetaTarget(false)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (targetMeta !== null) {
                                saveMetaTarget(targetMeta)
                              }
                              setEditingMetaTarget(false)
                            }
                            if (e.key === 'Escape') {
                              setEditingMetaTarget(false)
                              setTargetMeta(null)
                            }
                          }}
                          className="h-6 text-xs w-20"
                          autoFocus
                          step="0.01"
                        />
                      ) : (
                        <span 
                          className="text-muted-foreground cursor-text hover:bg-muted/50 px-1 py-0.5 rounded"
                          onClick={() => setEditingMetaTarget(true)}
                        >
                          Meta: {formatCurrency(metaData.target)}
                        </span>
                      )}
                      <span className={cn(
                        "font-mono",
                        metaData.remaining > 0 ? "text-orange-600" : "text-green-600"
                      )}>
                        {metaData.remaining > 0 ? `Faltam ${formatCurrency(metaData.remaining)}` : 'Meta atingida!'}
                      </span>
                    </div>
                  </div>

                  {/* Nova seção: Metas do GoalsBlock */}
                  {financeGoals.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          Metas Financeiras (GoalsBlock)
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {financeGoals.length} meta{financeGoals.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {financeGoals.map((goal) => {
                          // Calcular gastos da categoria no mês atual
                          const spent = transactions
                            .filter(t => {
                              if (t.type !== 'expense' || t.status !== 'completed') return false
                              const transactionDate = new Date(t.transaction_date)
                              return transactionDate.getMonth() === currentMonth - 1 && 
                                     transactionDate.getFullYear() === currentYear &&
                                     t.category === goal.category
                            })
                            .reduce((sum, t) => sum + Number(t.amount), 0)
                          
                          const percentage = (spent / goal.target_amount) * 100
                          const isOverBudget = percentage >= 100
                          const isWarning = percentage >= 80 && percentage < 100

                          return (
                            <motion.div
                              key={goal.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                    {goal.category}
                                  </span>
                                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                                    {goal.period === 'monthly' ? 'Mensal' : 'Anual'}
                                  </Badge>
                                  {isOverBudget && (
                                    <span className="text-red-500">⚠</span>
                                  )}
                                  {isWarning && !isOverBudget && (
                                    <TrendingUp className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <span className="text-xs font-mono text-purple-800 dark:text-purple-200">
                                  {formatCurrency(goal.target_amount)}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Gasto: {formatCurrency(spent)}
                                  </span>
                                  <span className={`font-medium ${
                                    isOverBudget ? 'text-red-600' : 
                                    isWarning ? 'text-yellow-600' : 
                                    'text-green-600'
                                  }`}>
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                                
                                <div className="w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-1.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${
                                      isOverBudget ? 'bg-red-500' : 
                                      isWarning ? 'bg-yellow-500' : 
                                      'bg-green-500'
                                    }`}
                                  />
                                </div>
                                
                                {isOverBudget && (
                                  <p className="text-xs text-red-600 font-medium mt-1">
                                    Excedido em {formatCurrency(spent - goal.target_amount)}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                      
                      <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-950/30 rounded text-center">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          💡 Essas metas são sincronizadas com o bloco "Metas Financeiras" do documento
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  )
}
