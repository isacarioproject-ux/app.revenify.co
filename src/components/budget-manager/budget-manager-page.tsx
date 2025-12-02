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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Menu,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts'
import { FinanceBudget, FinanceCategory, FinanceTransaction, PAYMENT_METHODS } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface BudgetManagerPageProps {
  // Sem props - componente standalone
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

export const BudgetManagerPage = () => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  
  // Estados principais
  const [budgets, setBudgets] = useState<FinanceBudget[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [documents, setDocuments] = useState<Array<{id: string, name: string}>>([])
  const [currentDocumentId, setCurrentDocumentId] = useState('')

  // Estados para sidebars (todos fechados por padrão)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [showRightSidebar1, setShowRightSidebar1] = useState(false)
  const [showRightSidebar2, setShowRightSidebar2] = useState(false)
  const [showRightSidebar3, setShowRightSidebar3] = useState(false)
  
  // Estados para drawers mobile
  const [activeDrawer, setActiveDrawer] = useState<'entradas' | 'gastos' | 'reservas' | 'metas' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<1 | 3 | 6 | 12>(6) // Período em meses

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
          date: e.date || new Date().toISOString().split('T')[0] // ✅ Carregar campo date
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

  // Detectar tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Carregar lista de documentos
  useEffect(() => {
    const loadDocuments = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          console.log('🔍 [BudgetManagerPage] Carregando documentos...', {
            userId: user?.id,
            workspaceId: currentWorkspace?.id
          })
          
          if (!user) {
            console.warn('⚠️ [BudgetManagerPage] Usuário não encontrado')
            return
          }

          // Buscar TODOS os documentos do usuário (sem filtro de workspace)
          const { data, error } = await supabase
            .from('finance_documents')
            .select('id, name, workspace_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          console.log('✅ [BudgetManagerPage] Documentos encontrados:', data?.length || 0)
          console.log('📊 [BudgetManagerPage] Workspace atual:', currentWorkspace?.id)
          
          if (data && data.length > 0) {
            console.log('📄 [BudgetManagerPage] Documentos:', data.map(d => ({
              id: d.id,
              name: d.name,
              workspace_id: d.workspace_id
            })))
          }
          
          if (error) throw error
          if (data) {
            setDocuments(data)
            // Usar o primeiro documento se não houver um selecionado
            if (data.length > 0 && !currentDocumentId) {
              setCurrentDocumentId(data[0].id)
            }
          }
        } catch (err) {
          console.error('Erro ao carregar documentos:', err)
        }
      }
    loadDocuments()
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (currentDocumentId) {
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
    }
  }, [currentDocumentId])

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

      // Buscar TODAS as categorias do usuário (sem filtro de workspace)
      const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
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
    if (!currentDocumentId) return

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


  // Cálculos para gráfico de linha (período dinâmico)
  const chartData = useMemo(() => {
    const months = []
    const now = new Date()
    
    // Calcular quantos pontos mostrar baseado no período
    const pointsToShow = chartPeriod === 1 ? 1 : chartPeriod
    
    for (let i = pointsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
      
      // Entradas do mês (agora com date)
      const monthIncome = incomeEntries
        .filter(e => e.date && e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.value, 0)
      
      // Gastos do mês
      const monthExpenses = expenseEntries
        .filter(e => e.category && e.date && e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.value, 0)
      
      // Reservas do mês
      const monthReserves = reserveEntries
        .filter(e => e.date && e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.value, 0)
      
      // Metas do mês
      const monthMetas = metaEntries
        .filter(e => e.date && e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.value, 0)
      
      months.push({
        month: monthName,
        entradas: monthIncome,
        gastos: monthExpenses,
        reservas: monthReserves,
        metas: monthMetas,
      })
    }
    
    return months
  }, [incomeEntries, expenseEntries, reserveEntries, metaEntries, chartPeriod])

  // Carregar meta do documento
  useEffect(() => {
    if (currentDocumentId) {
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
  }, [currentDocumentId])

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
      toast.error(t('budget.errorSaveGoal'), { description: err.message })
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
          toast.error('Erro ao criar gasto', { description: err.message })
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
        toast.error('Erro ao salvar gasto', { description: err.message })
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
              date: e.date // ✅ Salvar campo date
            }))
          }
        })
        .eq('id', currentDocumentId)

      if (error) throw error
    } catch (err: any) {
      toast.error(t('budget.errorSaveEntry'), { description: err.message })
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
      toast.error(t('budget.errorSaveReserve'), { description: err.message })
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
      toast.error(t('budget.errorSaveGoal'), { description: err.message })
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header com Toggles */}
      {loading && !hasLoaded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-2 md:px-4 py-1.5 md:py-2 border-b flex-shrink-0 flex flex-row items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 hidden md:block" />
            <Skeleton className="h-7 w-[140px] rounded" />
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-7 rounded hidden md:block" />
            ))}
            <Skeleton className="h-6 w-16 rounded md:hidden" />
          </div>
        </motion.div>
      ) : (
      <div className="px-2 md:px-4 py-1.5 md:py-2 border-b flex-shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
          <h1 className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            {t('budget.myManager')}
          </h1>
            
            {/* Switcher de Período do Gráfico */}
            <Select
              value={chartPeriod.toString()}
              onValueChange={(value) => setChartPeriod(Number(value) as 1 | 3 | 6 | 12)}
            >
              <SelectTrigger className="h-6 md:h-7 w-[100px] md:w-[140px] text-[10px] md:text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('budget.month1')}</SelectItem>
                <SelectItem value="3">{t('budget.months3')}</SelectItem>
                <SelectItem value="6">{t('budget.months6')}</SelectItem>
                <SelectItem value="12">{t('budget.year1')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Dropdown Mobile - Visível apenas em mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 gap-1 px-2">
                  <Menu className="h-3 w-3" />
                  <span className="text-[10px]">{t('budget.options')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setActiveDrawer('entradas')}>
                  <TrendingUpIcon className="h-4 w-4 mr-2" />
                  {t('budget.incomes')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveDrawer('gastos')}>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  {t('budget.expenses')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveDrawer('reservas')}>
                  <PiggyBank className="h-4 w-4 mr-2" />
                  {t('budget.reserves')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveDrawer('metas')}>
                  <Target className="h-4 w-4 mr-2" />
                  {t('budget.goals')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Toggles Desktop - Ocultos em mobile */}
          <div className="hidden md:flex items-center gap-1">
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
                  {showLeftSidebar ? t('budget.hideEntry') : t('budget.showEntry')}
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
                  {showRightSidebar1 ? t('budget.hideExpenses') : t('budget.showExpenses')}
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
                  {showRightSidebar2 ? t('budget.hideReserves') : t('budget.showReserves')}
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
                  {showRightSidebar3 ? t('budget.hideGoal') : t('budget.showGoal')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

        {/* Content com Resizable Panels */}
        <ResizablePanelGroup 
          key={`panels-${showLeftSidebar}-${showRightSidebar1}-${showRightSidebar2}-${showRightSidebar3}`}
          direction="horizontal" 
          className="flex-1 min-h-0 w-full overflow-hidden"
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
                <div className="h-full flex flex-col p-4 border-r border-border overflow-hidden">
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUpIcon className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-semibold">{t('budget.entry')}</h3>
                    </div>

                    {/* Tabela Editável de Entradas */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">{t('budget.name')}</TableHead>
                            <TableHead className="h-8 text-xs text-right">{t('budget.value')}</TableHead>
                            <TableHead className="h-8 text-xs text-right">%</TableHead>
                            <TableHead className="h-8 text-xs">{t('budget.date')}</TableHead>
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
                                    {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                                  {t('budget.addEntry')}
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
              showRightSidebar2 && showRightSidebar3 ? 25 :
              (showRightSidebar2 || showRightSidebar3) ? 30 :
              35
            } 
            minSize={22} 
            maxSize={40} 
            className="min-w-[280px]"
          >
            <div className="h-full flex flex-col p-2 md:p-4 overflow-hidden">
              <div className="w-full h-full flex flex-col">
                <h3 className="text-xs md:text-sm font-semibold mb-2 text-center flex-shrink-0">{t('budget.financialEvolution')}</h3>
                <ChartContainer
                  config={{
                    entradas: { label: t('budget.incomes'), color: '#10b981' },
                    gastos: { label: t('budget.expenses'), color: '#ef4444' },
                    reservas: { label: t('budget.reserves'), color: '#3b82f6' },
                    metas: { label: t('budget.goals'), color: '#8b5cf6' },
                  }}
                  className="flex-1 w-full min-h-0"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: isMobile ? 10 : 20, left: isMobile ? 0 : 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        className="text-muted-foreground"
                        tickFormatter={(value) => {
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                          return value.toString()
                        }}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-lg">
                                <div className="grid gap-1.5">
                                  <div className="text-xs font-medium mb-1">{payload[0].payload.month}</div>
                                  {payload.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-xs text-muted-foreground">{entry.name}</span>
                                      </div>
                                      <span className="text-xs font-mono font-semibold">
                                        {formatCurrency(Number(entry.value))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="entradas" 
                        stroke="#10b981" 
                        strokeWidth={isMobile ? 2 : 3}
                        fill="#10b981"
                        fillOpacity={0.1}
                        dot={{ r: isMobile ? 3 : 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gastos" 
                        stroke="#ef4444" 
                        strokeWidth={isMobile ? 2 : 3}
                        strokeDasharray="5 5"
                        dot={{ r: isMobile ? 3 : 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reservas" 
                        stroke="#3b82f6" 
                        strokeWidth={isMobile ? 2 : 3}
                        dot={{ r: isMobile ? 3 : 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="metas" 
                        stroke="#8b5cf6" 
                        strokeWidth={isMobile ? 2 : 3}
                        dot={{ r: isMobile ? 3 : 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontSize: isMobile ? '9px' : '11px',
                          paddingTop: '5px'
                        }}
                        iconType="line"
                        height={isMobile ? 30 : 36}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
                <div className="h-full flex flex-col p-4 border-l border-border overflow-hidden">
                  <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <h3 className="text-sm font-semibold">{t('budget.expenses')}</h3>
                </div>

                    {/* Tabela Editável de Gastos */}
                    <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">{t('budget.category')}</TableHead>
                            <TableHead className="h-8 text-xs">{t('budget.payment')}</TableHead>
                            <TableHead className="h-8 text-xs text-right">{t('budget.value')}</TableHead>
                            <TableHead className="h-8 text-xs">{t('budget.date')}</TableHead>
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
                                    {entry.category || <span className="text-muted-foreground">{t('budget.categoryPlaceholder')}</span>}
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
                                          toast.error(t('budget.errorSavePayment'), { description: err.message })
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
                                    {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.icon} {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.label || t('budget.paymentPlaceholder')}
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
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                                      toast.error(t('budget.errorDeleteExpense'), { description: err.message })
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
                                  {t('budget.addExpense')}
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
                <div className="h-full flex flex-col p-4 border-l border-border overflow-hidden">
                  <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                      <PiggyBank className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold">{t('budget.reservesInvestment')}</h3>
                    </div>

                    {/* Tabela Editável de Reservas */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="h-8 text-xs">{t('budget.name')}</TableHead>
                            <TableHead className="h-8 text-xs">{t('budget.type')}</TableHead>
                            <TableHead className="h-8 text-xs text-right">{t('budget.value')}</TableHead>
                            <TableHead className="h-8 text-xs">{t('budget.date')}</TableHead>
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
                                    {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                      <SelectItem value="reserve">{t('budget.reserve')}</SelectItem>
                                      <SelectItem value="investment">{t('budget.investment')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div
                                    onClick={() => handleReserveCellEdit(entry.id, 'type', entry.type)}
                                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                  >
                                    <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                      {entry.type === 'investment' ? t('budget.investment') : t('budget.reserve')}
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
                                    {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                                  {t('budget.addReserve')}
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
              <div className="h-full flex flex-col p-4 border-l border-border overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-semibold">{t('budget.goalInvestment')}</h3>
                  </div>

                  {/* Tabela Editável de Metas */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="h-8 text-xs">{t('budget.name')}</TableHead>
                          <TableHead className="h-8 text-xs">{t('budget.type')}</TableHead>
                          <TableHead className="h-8 text-xs text-right">{t('budget.value')}</TableHead>
                          <TableHead className="h-8 text-xs">{t('budget.date')}</TableHead>
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
                                  {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                    <SelectItem value="meta">{t('budget.meta')}</SelectItem>
                                    <SelectItem value="investment">{t('budget.investment')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div
                                  onClick={() => handleMetaCellEdit(entry.id, 'type', entry.type)}
                                  className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                                >
                                  <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                    {entry.type === 'investment' ? t('budget.investment') : t('budget.meta')}
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
                                  {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                                {t('budget.addGoalInvestment')}
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

        {/* Drawers Mobile - Conteúdo reutilizado dos sidebars */}
        
        {/* Drawer Entradas */}
        <Drawer open={activeDrawer === 'entradas'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5 text-green-600" />
                Entradas
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
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
                                {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                              {t('budget.addEntry')}
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
          </DrawerContent>
        </Drawer>

        {/* Drawer Gastos */}
        <Drawer open={activeDrawer === 'gastos'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Gastos
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
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
                                {entry.category || <span className="text-muted-foreground">{t('budget.categoryPlaceholder')}</span>}
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
                                    
                                    try {
                                      const { error } = await supabase
                                        .from('finance_transactions')
                                        .update({ payment_method: value })
                                        .eq('id', entry.id)
                                      
                                      if (error) throw error
                                      await fetchTransactions()
                                    } catch (err: any) {
                                      toast.error(t('budget.errorSavePayment'), { description: err.message })
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
                                {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.icon} {PAYMENT_METHODS.find(m => m.value === entry.paymentMethod)?.label || t('budget.paymentPlaceholder')}
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
                                {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                                  toast.error(t('budget.errorDeleteExpense'), { description: err.message })
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                              {t('budget.addExpense')}
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
          </DrawerContent>
        </Drawer>

        {/* Drawer Reservas */}
        <Drawer open={activeDrawer === 'reservas'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-blue-600" />
                Reservas
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
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
                                {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                  <SelectItem value="reserve">{t('budget.reserve')}</SelectItem>
                                  <SelectItem value="investment">{t('budget.investment')}</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div
                                onClick={() => handleReserveCellEdit(entry.id, 'type', entry.type)}
                                className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                              >
                                <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                  {entry.type === 'investment' ? t('budget.investment') : t('budget.reserve')}
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
                                {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                              {t('budget.addReserve')}
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
          </DrawerContent>
        </Drawer>

        {/* Drawer Metas */}
        <Drawer open={activeDrawer === 'metas'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Metas
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
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
                                {entry.name || <span className="text-muted-foreground">{t('budget.namePlaceholder')}</span>}
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
                                  <SelectItem value="meta">{t('budget.meta')}</SelectItem>
                                  <SelectItem value="investment">{t('budget.investment')}</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div
                                onClick={() => handleMetaCellEdit(entry.id, 'type', entry.type)}
                                className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                              >
                                <Badge variant={entry.type === 'investment' ? 'default' : 'secondary'} className="text-xs">
                                  {entry.type === 'investment' ? t('budget.investment') : t('budget.meta')}
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
                                {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : <span className="text-muted-foreground">{t('budget.datePlaceholder')}</span>}
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
                              {t('budget.addGoalInvestment')}
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
          </DrawerContent>
        </Drawer>
    </div>
  )
}
