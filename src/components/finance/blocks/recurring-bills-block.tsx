import { useState, useEffect } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, Trash2, Check, AlertCircle, Clock, Loader2, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { useI18n } from '@/hooks/use-i18n'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'
import { useIntegration } from '@/hooks/use-integration'

interface RecurringBill {
  id: string
  user_id: string
  finance_document_id: string
  task_id: string | null // ✨ Vinculação com task
  name: string
  amount: number
  due_day: number
  due_date: string | null // Data completa de vencimento
  category: string
  paid: boolean
  auto_create: boolean
  created_at: string
  updated_at: string
}

interface RecurringBillsBlockProps extends FinanceBlockProps {
  categories: string[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Bloco para gerenciar contas recorrentes
 * Tabela inline editável estilo Notion
 */
export const RecurringBillsBlock = ({
  documentId,
  categories,
  onRefresh,
}: RecurringBillsBlockProps) => {
  const { t } = useI18n()
  const dateFnsLocale = useDateFnsLocale()
  const isTaskIntegrationEnabled = useIntegration('TASKS_TO_FINANCE') // ✨ Verificar se integração está ativa
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [tasks, setTasks] = useState<any[]>([]) // ✨ Lista de tasks disponíveis
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [saving, setSaving] = useState<{rowId: string, field: string} | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectOpen, setSelectOpen] = useState<{field: string} | null>(null)
  const [calendarOpen, setCalendarOpen] = useState<{rowId: string} | null>(null)

  useEffect(() => {
    if (documentId) {
      loadBills()
    }
  }, [documentId])

  useEffect(() => {
    // Simular inicialização
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // ✨ Carregar tasks disponíveis
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, status')
          .order('created_at', { ascending: false })
          .limit(100) // Mostrar todas as tasks
        
        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        console.error('Erro ao carregar tasks:', err)
      }
    }
    
    loadTasks()
  }, [])

  const loadBills = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('finance_document_id', documentId)
        .order('created_at', { ascending: true }) // Ordenar por data de criação para manter sequência

      if (error) throw error
      
      // Remover duplicatas caso existam
      const uniqueBills = (data || []).filter((bill, index, self) => 
        index === self.findIndex((b) => b.id === bill.id)
      )
      
      setBills(uniqueBills)
    } catch (err: any) {
      console.error('Error loading bills:', err)
      toast.error(t('finance.recurringBills.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    
    // Para o campo amount, se o valor for 0.01 (valor padrão), deixar vazio para edição
    if (field === 'amount') {
      const amount = Number(currentValue) || 0
      if (amount === 0.01) {
        setEditingValue('')
      } else {
        // Formatar o valor removendo formatação de moeda
        setEditingValue(String(amount).replace('.', ','))
      }
    } else {
      setEditingValue(String(currentValue || ''))
    }
    
    if (field === 'category') {
      setSelectOpen({ field: 'category' })
    } else if (field === 'due_day') {
      setCalendarOpen({ rowId })
    }
  }

  const handleCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const bill = bills.find(b => b.id === rowId)
    if (!bill) {
      setEditingCell(null)
      setEditingValue('')
      return
    }

    setSaving({ rowId, field })

    const updateData: any = {}
    
    if (field === 'name') {
      const trimmedName = editingValue.trim()
      if (!trimmedName) {
        toast.error(t('finance.recurringBills.billName'))
        setSaving(null)
        setEditingCell(null)
        setEditingValue('')
        return
      }
      updateData.name = trimmedName
    } else if (field === 'amount') {
      const value = parseFloat(editingValue.replace(',', '.')) || 0
      if (value <= 0) {
        toast.error(t('finance.quickExpense.invalidValue'))
        setSaving(null)
        setEditingCell(null)
        setEditingValue('')
        return
      }
      // Garantir valor mínimo para não violar constraint
      updateData.amount = Math.max(value, 0.01)
    } else if (field === 'due_day') {
      const day = parseInt(editingValue) || 1
      if (day < 1 || day > 31) {
        toast.error(t('finance.recurringBills.invalidDay'))
        setSaving(null)
        setEditingCell(null)
        setEditingValue('')
        setCalendarOpen(null)
        return
      }
      updateData.due_day = day
    } else if (field === 'category') {
      updateData.category = editingValue.trim()
    }

    try {
      const { error } = await supabase
        .from('recurring_bills')
        .update(updateData)
        .eq('id', rowId)

      if (error) throw error
      
      // Atualizar estado local sem recarregar tudo
      setBills(prevBills => prevBills.map(b => 
        b.id === rowId ? { ...b, ...updateData } : b
      ))
      
      toast.success(t('finance.recurringBills.updated'))
    } catch (err: any) {
      console.error('Error updating recurring bill:', err)
      toast.error(t('finance.recurringBills.errorUpdate'), {
        description: err.message || t('finance.recurringBills.errorUpdate'),
      })
    } finally {
      setSaving(null)
      setEditingCell(null)
      setEditingValue('')
      setSelectOpen(null)
      setCalendarOpen(null)
    }
  }

  const handleAddNew = async () => {
    if (adding) return // Prevenir múltiplos cliques
    
    setAdding(true)
    // Criar nova conta com valores padrão
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('finance.goals.userNotAuthenticated'))
        setAdding(false)
        return
      }

      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 7) // 7 dias no futuro como padrão
      
      const { data, error } = await supabase
        .from('recurring_bills')
        .insert({
          user_id: user.id,
          finance_document_id: documentId,
          name: '',
          amount: 0.01, // Valor mínimo para não violar constraint
          due_day: defaultDate.getDate(),
          due_date: format(defaultDate, 'yyyy-MM-dd'),
          category: categories[0] || '',
          paid: false,
          auto_create: false,
        })
        .select()
        .single()

      if (error) throw error
      
      // Adicionar à lista local no final (sequência de criação)
      setBills(prevBills => [...prevBills, data])
      
      // Entrar em modo de edição para o nome
      setEditingCell({ rowId: data.id, field: 'name' })
      setEditingValue('')
      
      toast.success(t('finance.recurringBills.added'))
    } catch (err: any) {
      console.error('Error adding recurring bill:', err)
      toast.error(t('finance.recurringBills.errorAdd'), {
        description: err.message || t('finance.recurringBills.errorAdd'),
      })
    } finally {
      setAdding(false)
    }
  }

  const togglePaid = async (id: string) => {
    const bill = bills.find(b => b.id === id)
    if (!bill) return

    const newPaidStatus = !bill.paid
    
    // Atualização otimista
    setBills(prevBills => prevBills.map(b => 
      b.id === id ? { ...b, paid: newPaidStatus } : b
    ))
    
    try {
      const { error } = await supabase
        .from('recurring_bills')
        .update({ paid: newPaidStatus })
        .eq('id', id)

      if (error) {
        // Reverter atualização otimista em caso de erro
        setBills(prevBills => prevBills.map(b => 
          b.id === id ? { ...b, paid: bill.paid } : b
        ))
        throw error
      }
      
      toast.success(t('finance.recurringBills.updated'))
    } catch (err: any) {
      console.error('Error toggling paid status:', err)
      toast.error(t('finance.recurringBills.errorUpdate'), {
        description: err.message || t('finance.recurringBills.errorUpdate'),
      })
    }
  }

  const deleteBill = async (id: string) => {
    if (deleting === id) return // Prevenir múltiplos cliques
    
    // Confirmar deleção
    if (!window.confirm(t('finance.table.deleteConfirm'))) return

    setDeleting(id)
    
    try {
      // Atualização otimista do estado local primeiro
      const billToDelete = bills.find(b => b.id === id)
      setBills(prevBills => prevBills.filter(b => b.id !== id))
      
      // Deletar do Supabase
      const { error } = await supabase
        .from('recurring_bills')
        .delete()
        .eq('id', id)

      if (error) {
        // Reverter atualização otimista em caso de erro
        if (billToDelete) {
          setBills(prevBills => [...prevBills, billToDelete].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ))
        }
        throw error
      }
      
      toast.success(t('finance.recurringBills.removed'))
    } catch (err: any) {
      console.error('Error deleting recurring bill:', err)
      toast.error(t('finance.recurringBills.errorRemove'), {
        description: err.message || t('finance.recurringBills.errorRemove'),
      })
    } finally {
      setDeleting(null)
    }
  }

  // Calcular contas vencendo e vencidas usando due_date
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalizar para meia-noite
  
  const overdueBills = bills.filter(b => {
    if (b.paid) return false
    if (!b.due_date) return false
    const dueDate = new Date(b.due_date + 'T00:00:00')
    return dueDate < today
  })
  
  const upcomingBills = bills.filter(b => {
    if (b.paid) return false
    if (!b.due_date) return false
    const dueDate = new Date(b.due_date + 'T00:00:00')
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  })

  // Skeleton
  if (isInitializing) {
  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border rounded-lg overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 text-xs w-8">
                <Skeleton className="h-3 w-3" />
              </TableHead>
              <TableHead className="h-8 text-xs">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead className="h-8 text-xs text-right">
                <Skeleton className="h-3 w-24 ml-auto" />
              </TableHead>
              <TableHead className="h-8 text-xs">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="h-8 text-xs">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead className="h-8 w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="h-8">
                <TableCell className="text-xs py-0 px-2">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell className="text-xs py-0 px-2">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-xs py-0 px-2 text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell className="text-xs py-0 px-2">
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell className="text-xs py-0 px-2">
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
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Alertas de Vencimento */}
      <AnimatePresence>
      {(overdueBills.length > 0 || upcomingBills.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
          {overdueBills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg"
              >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-900 dark:text-red-100">
                    {overdueBills.length} {t('finance.recurringBills.overdue')}
                </span>
              </div>
              <div className="space-y-1">
                {overdueBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-800 dark:text-red-200">{bill.name}</span>
                    <span className="font-semibold text-red-900 dark:text-red-100">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
              </motion.div>
          )}

          {upcomingBills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
              >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    {upcomingBills.length} {t('finance.recurringBills.upcoming')}
                </span>
              </div>
              <div className="space-y-1">
                {upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-800 dark:text-yellow-200">{bill.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {t('finance.recurringBills.due')} {bill.due_day}
                      </Badge>
                    </div>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela */}
      <motion.div
        data-testid="recurring-bills-table"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="border rounded-lg overflow-hidden"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <Table role="table" aria-label={t('finance.recurringBills.title')}>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 text-xs w-8">
                <Check className="h-3 w-3" />
              </TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.description')}</TableHead>
              <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.recurringBills.dueDay')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.category')}</TableHead>
              {isTaskIntegrationEnabled && (
                <TableHead className="h-8 text-xs">{t('finance.recurringBills.task')}</TableHead>
              )}
              <TableHead className="h-8 w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
      {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
            {t('finance.recurringBills.noBills')}
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow
                key={bill.id}
                  data-testid={`recurring-bill-row-${bill.id}`}
                  className={`h-8 ${bill.paid ? 'opacity-60' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('.cursor-text') || target.closest('input') || target.closest('[role="combobox"]') || target.closest('button') || target.closest('[data-slot="popover-trigger"]')) {
                      return
                    }
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                {/* Status Paid */}
                <TableCell className="text-xs py-0 px-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <button
                      type="button"
                      disabled={loading || (saving?.rowId === bill.id)}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        togglePaid(bill.id)
                      }}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        bill.paid 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-muted-foreground hover:border-green-600'
                      }`}
                      title={bill.paid ? t('finance.recurringBills.markPending') : t('finance.recurringBills.markPaid')}
                    >
                      {bill.paid && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </motion.div>
                </TableCell>

                {/* Nome - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  <AnimatePresence mode="wait">
                    {editingCell?.rowId === bill.id && editingCell?.field === 'name' ? (
                      <motion.div
                        key="edit-name"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            data-testid={`edit-name-input-${bill.id}`}
                            aria-label={t('finance.table.description')}
                            value={editingValue}
                            disabled={saving?.rowId === bill.id && saving?.field === 'name'}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (editingValue.trim()) {
                                handleCellSave(bill.id, 'name')
                              } else {
                                setEditingCell(null)
                                setEditingValue('')
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.stopPropagation()
                                if (editingValue.trim()) {
                                  handleCellSave(bill.id, 'name')
                                }
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingCell(null)
                                setEditingValue(bill.name)
                              }
                            }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                            autoFocus
                          />
                          {saving?.rowId === bill.id && saving?.field === 'name' && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display-name"
                        data-testid={`display-name-${bill.id}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${t('finance.table.description')}: ${bill.name || t('finance.table.description')}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCellEdit(e, bill.id, 'name', bill.name)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            handleCellEdit(e as any, bill.id, 'name', bill.name)
                          }
                        }}
                        className={`cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center transition-colors ${
                          bill.paid ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {bill.name || (
                          <span className="text-muted-foreground italic">
                            {t('finance.table.description')}...
                    </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TableCell>

                {/* Valor - Editável inline */}
                <TableCell className="text-xs text-right font-mono py-0 px-2">
                  <AnimatePresence mode="wait">
                    {editingCell?.rowId === bill.id && editingCell?.field === 'amount' ? (
                      <motion.div
                        key="edit-amount"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="flex justify-end items-center gap-1"
                      >
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingValue}
                          disabled={saving?.rowId === bill.id && saving?.field === 'amount'}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.-]/g, '')
                            setEditingValue(value)
                          }}
                          onBlur={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const cleanedValue = editingValue.trim().replace(/[^0-9,.-]/g, '')
                            if (cleanedValue) {
                              handleCellSave(bill.id, 'amount')
                            } else {
                              setEditingCell(null)
                              setEditingValue('')
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.stopPropagation()
                              const cleanedValue = editingValue.trim().replace(/[^0-9,.-]/g, '')
                              if (cleanedValue) {
                                handleCellSave(bill.id, 'amount')
                              }
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              e.stopPropagation()
                              setEditingCell(null)
                              setEditingValue(String(bill.amount))
                            }
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right w-full max-w-[120px]"
                          autoFocus
                        />
                        {saving?.rowId === bill.id && saving?.field === 'amount' && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display-amount"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCellEdit(e, bill.id, 'amount', bill.amount)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className={`cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold transition-colors ${
                  bill.paid ? 'text-muted-foreground' : 'text-red-600'
                        }`}
                      >
                  {formatCurrency(bill.amount)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TableCell>

                {/* Dia de Vencimento - Calendário moderno */}
                <TableCell className="text-xs py-0 px-2">
                  <Popover
                    open={calendarOpen?.rowId === bill.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setCalendarOpen({ rowId: bill.id })
                        setEditingCell({ rowId: bill.id, field: 'due_day' })
                        setEditingValue(String(bill.due_day))
                      } else {
                        // Se fechar sem selecionar, apenas limpar estados
                        setCalendarOpen(null)
                        // Não chamar handleCellSave aqui porque o onSelect já salva quando seleciona
                        if (!editingValue || editingValue === String(bill.due_day)) {
                          setEditingCell(null)
                          setEditingValue('')
                        }
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <motion.button
                        type="button"
                        data-testid={`calendar-trigger-${bill.id}`}
                        aria-label={`${t('finance.recurringBills.dueDay')}: ${bill.due_day}`}
                        aria-expanded={calendarOpen?.rowId === bill.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingCell({ rowId: bill.id, field: 'due_day' })
                          setEditingValue(String(bill.due_day))
                          setCalendarOpen({ rowId: bill.id })
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center gap-1.5 transition-colors w-full text-left"
                      >
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {bill.due_date 
                            ? format(new Date(bill.due_date + 'T00:00:00'), 'dd/MM', { locale: dateFnsLocale })
                            : bill.due_day
                          }
                        </Badge>
                      </motion.button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-3 sm:p-4 border-2 shadow-xl bg-background rounded-xl max-w-[95vw]" 
                      align="start"
                      sideOffset={5}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-1"
                      >
                        <Calendar
                          mode="single"
                          selected={bill.due_date ? new Date(bill.due_date + 'T00:00:00') : new Date()}
                          onSelect={async (date) => {
                            if (date) {
                              const formattedDate = format(date, 'yyyy-MM-dd')
                              const day = date.getDate()
                              setSaving({ rowId: bill.id, field: 'due_day' })
                              
                              // Salvar data completa
                              const updateData = { 
                                due_day: day,
                                due_date: formattedDate 
                              }
                              try {
                                const { error } = await supabase
                                  .from('recurring_bills')
                                  .update(updateData)
                                  .eq('id', bill.id)

                                if (error) throw error
                                
                                // Atualizar estado local
                                setBills(prevBills => prevBills.map(b => 
                                  b.id === bill.id ? { ...b, due_day: day, due_date: formattedDate } : b
                                ))
                                
                                toast.success(t('finance.recurringBills.updated'))
                              } catch (err: any) {
                                console.error('Error updating due date:', err)
                                toast.error(t('finance.recurringBills.errorUpdate'), {
                                  description: err.message || t('finance.recurringBills.errorUpdate'),
                                })
                              } finally {
                                setSaving(null)
                              }
                              
                              // Fechar calendário e limpar estados
                              setEditingCell(null)
                              setEditingValue('')
                              setCalendarOpen(null)
                            }
                          }}
                          locale={dateFnsLocale}
                          className="rounded-lg"
                          classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-2 pb-4 relative items-center border-b border-border/50 mb-2",
                            caption_label: "text-base font-bold text-foreground tracking-wide",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-8 w-8 bg-background border border-border hover:bg-accent hover:border-accent-foreground/20 rounded-lg p-0 opacity-70 hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md",
                            nav_button_previous: "absolute left-2",
                            nav_button_next: "absolute right-2",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex mb-2",
                            head_cell: "text-muted-foreground/80 rounded-md w-10 font-semibold text-[0.75rem] uppercase tracking-wider",
                            row: "flex w-full mt-1",
                            cell: "h-10 w-10 text-center text-sm p-0 relative rounded-lg [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-accent/30 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                            day: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110 active:scale-95",
                            day_range_end: "day-range-end",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md scale-110",
                            day_today: "bg-accent/50 text-accent-foreground font-bold border-2 border-primary/50",
                            day_outside: "day-outside text-muted-foreground/40 opacity-50 aria-selected:bg-accent/30 aria-selected:text-muted-foreground aria-selected:opacity-50",
                            day_disabled: "text-muted-foreground/30 opacity-30 cursor-not-allowed",
                            day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                        />
                      </motion.div>
                    </PopoverContent>
                  </Popover>
                </TableCell>

                {/* Categoria - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  <AnimatePresence mode="wait">
                    {editingCell?.rowId === bill.id && editingCell?.field === 'category' ? (
                      <motion.div
                        key="edit-category"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Select
                          value={editingValue || bill.category}
                          open={selectOpen?.field === 'category'}
                          onOpenChange={(open) => {
                            setSelectOpen(open ? { field: 'category' } : null)
                            if (!open && !editingValue) {
                              // Se fechou sem selecionar, cancelar edição
                              setEditingCell(null)
                              setEditingValue('')
                            }
                          }}
                          onValueChange={async (value) => {
                            setEditingValue(value)
                            setSaving({ rowId: bill.id, field: 'category' })
                            
                            // Salvar diretamente com o valor selecionado
                            const updateData = { category: value.trim() }
                            try {
                              const { error } = await supabase
                                .from('recurring_bills')
                                .update(updateData)
                                .eq('id', bill.id)

                              if (error) throw error
                              
                              // Atualizar estado local
                              setBills(prevBills => prevBills.map(b => 
                                b.id === bill.id ? { ...b, ...updateData } : b
                              ))
                              
                              toast.success(t('finance.recurringBills.updated'))
                            } catch (err: any) {
                              console.error('Error updating category:', err)
                              toast.error(t('finance.recurringBills.errorUpdate'), {
                                description: err.message || t('finance.recurringBills.errorUpdate'),
                              })
                            } finally {
                              setSaving(null)
                              setEditingCell(null)
                              setEditingValue('')
                              setSelectOpen(null)
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs border-none p-1 focus-visible:ring-1">
                            <SelectValue placeholder={t('finance.table.category')} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {t('finance.table.noCategory')}
                              </div>
                            ) : (
                              categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display-category"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCellEdit(e, bill.id, 'category', bill.category)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center transition-colors"
                      >
                        {bill.category || (
                          <span className="text-muted-foreground italic">
                            {t('finance.table.category')}...
                </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TableCell>

                {/* Task - Editável inline (somente se integração ativa) */}
                {isTaskIntegrationEnabled && (
                <TableCell className="text-xs py-0 px-2">
                  <AnimatePresence mode="wait">
                    {editingCell?.rowId === bill.id && editingCell?.field === 'task' ? (
                      <motion.div
                        key="edit-task"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Select
                          value={bill.task_id || 'none'}
                          open={selectOpen?.field === 'task'}
                          onOpenChange={(open) => {
                            setSelectOpen(open ? { field: 'task' } : null)
                            if (!open) {
                              setEditingCell(null)
                              setEditingValue('')
                            }
                          }}
                          onValueChange={async (value) => {
                            setSaving({ rowId: bill.id, field: 'task' })
                            
                            const updateData = { task_id: value === 'none' ? null : value }
                            try {
                              const { error } = await supabase
                                .from('recurring_bills')
                                .update(updateData)
                                .eq('id', bill.id)

                              if (error) throw error
                              
                              setBills(prevBills => prevBills.map(b => 
                                b.id === bill.id ? { ...b, ...updateData } : b
                              ))
                              
                              toast.success(t('finance.recurringBills.updated'))
                            } catch (err: any) {
                              console.error('Error updating task:', err)
                              toast.error(t('finance.recurringBills.errorUpdate'), {
                                description: err.message,
                              })
                            } finally {
                              setSaving(null)
                              setEditingCell(null)
                              setEditingValue('')
                              setSelectOpen(null)
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs border-none p-1">
                            <SelectValue placeholder="Task..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                <div className="flex items-center gap-2">
                                  {task.status === 'done' && <span className="text-green-600">✓</span>}
                                  <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                    {task.title}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display-task"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCellEdit(e, bill.id, 'task', bill.task_id)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center gap-1.5 transition-colors"
                      >
                        {bill.task_id && tasks.find(t => t.id === bill.task_id) ? (
                          <>
                            {tasks.find(t => t.id === bill.task_id)?.status === 'done' && (
                              <span className="text-green-600 text-xs">✓</span>
                            )}
                            <span className={`truncate ${tasks.find(t => t.id === bill.task_id)?.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {tasks.find(t => t.id === bill.task_id)?.title}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Task...</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TableCell>
                )}

                {/* Botão deletar */}
                <TableCell className="text-xs py-0 px-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      type="button"
                      data-testid={`delete-bill-${bill.id}`}
                      aria-label={t('common.delete')}
                      disabled={deleting === bill.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteBill(bill.id)
                      }}
                    >
                      {deleting === bill.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </motion.div>
                </TableCell>
              </TableRow>
              ))
            )}

            {/* Linha para adicionar nova conta */}
            <TableRow 
              className="h-8 border-t-2 border-dashed"
              data-testid="add-recurring-bill-row"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <TableCell colSpan={6} className="text-xs py-0 px-2">
                  <motion.button
                    type="button"
                    data-testid="add-recurring-bill-button"
                    aria-label={t('finance.recurringBills.addNew')}
                    disabled={adding}
                    whileHover={!adding ? { scale: 1.02 } : {}}
                    whileTap={!adding ? { scale: 0.98 } : {}}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddNew()
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    className="w-full text-left px-1 py-0.5 rounded hover:bg-muted/50 text-muted-foreground italic flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    {adding ? t('finance.table.adding') : t('finance.recurringBills.addNew')}
                  </motion.button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </motion.div>

          {/* Resumo */}
      {bills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
        >
            <div className="text-sm">
              <span className="text-muted-foreground">{t('finance.budget.totalBudget')}: </span>
            <span className="font-semibold">
              {formatCurrency(bills.reduce((sum, b) => sum + b.amount, 0))}
            </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{t('finance.recurringBills.paid')}: </span>
              <span className="font-semibold text-green-600">
              {bills.filter(b => b.paid).length}/{bills.length}
              </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
