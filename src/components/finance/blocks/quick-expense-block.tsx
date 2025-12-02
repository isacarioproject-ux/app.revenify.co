import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { FinanceBlockProps } from '@/types/finance-blocks'
import { useI18n } from '@/hooks/use-i18n'
import { useIntegration } from '@/hooks/use-integration'

interface QuickExpenseBlockProps extends FinanceBlockProps {
  categories: string[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Bloco para adicionar despesas rapidamente
 * Tabela inline editável estilo Notion
 */
export const QuickExpenseBlock = ({
  documentId,
  categories,
  onRefresh,
}: QuickExpenseBlockProps) => {
  const { t, locale } = useI18n()
  const isTaskIntegrationEnabled = useIntegration('TASKS_TO_FINANCE')
  
  // Estados do formulário
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amount, setAmount] = useState('')
  const [taskId, setTaskId] = useState<string>('')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectOpen, setSelectOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  // Locale para o calendário
  const dateFnsLocale = locale === 'pt-BR' ? ptBR : locale === 'es' ? es : enUS

  useEffect(() => {
    // Simular inicialização rápida
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

  const handleQuickAdd = async () => {
    // Validações
    if (!amount || !description.trim()) {
      toast.error(t('finance.quickExpense.fillFields'))
      return
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(t('finance.quickExpense.invalidValue'))
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('finance_transactions').insert({
        finance_document_id: documentId,
        task_id: (taskId && taskId !== 'none') ? taskId : null,
        type: 'expense',
        category: category || t('finance.quickExpense.other'),
        description: description.trim(),
        amount: parsedAmount,
        transaction_date: format(transactionDate, 'yyyy-MM-dd'),
        payment_method: paymentMethod,
        status: 'completed',
        tags: [],
      })

      if (error) throw error

      // Reset todos os campos
      setDescription('')
      setAmount('')
      setCategory('')
      setPaymentMethod('cash')
      setTransactionDate(new Date())
      setTaskId('')
      setEditingCell(null)
      setEditingValue('')
      
      onRefresh()
      toast.success(`${formatCurrency(parsedAmount)} ${t('finance.quickExpense.added')}`)
    } catch (err: any) {
      toast.error(t('finance.table.errorAdd'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Labels de pagamento
  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('finance.payment.cash'),
      credit_card: t('finance.payment.creditCard'),
      debit_card: t('finance.payment.debitCard'),
      pix: t('finance.payment.pix'),
      bank_transfer: t('finance.payment.bankTransfer'),
    }
    return labels[method] || method
  }

  const handleCellEdit = (e: React.MouseEvent, field: string, currentValue: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ field })
    // Para o campo amount, mostrar o valor sem formatação para edição
    if (field === 'amount') {
      setEditingValue(currentValue || '')
    } else {
      setEditingValue(currentValue || '')
    }
    if (field === 'category') {
      setSelectOpen(true)
    }
  }

  const handleCellSave = (field: string) => {
    if (field === 'category') {
      if (editingValue.trim()) {
        setCategory(editingValue.trim())
      }
    } else if (field === 'amount') {
      // Limpar e normalizar o valor
      const cleanedValue = editingValue.trim().replace(/[^0-9,.-]/g, '')
      if (cleanedValue) {
        setAmount(cleanedValue)
      }
    }
    setEditingCell(null)
    setEditingValue('')
  }

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
              <TableHead className="h-8 text-xs">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead className="h-8 text-xs text-right">
                <Skeleton className="h-3 w-24 ml-auto" />
              </TableHead>
              <TableHead className="h-8 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="h-8">
              <TableCell className="text-xs py-0 px-2">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-xs py-0 px-2 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
              <TableCell className="text-xs py-0 px-1">
                <Skeleton className="h-6 w-6 rounded" />
              </TableCell>
            </TableRow>
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
      className="border rounded-lg overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="h-8 text-xs">{t('finance.table.description')}</TableHead>
            <TableHead className="h-8 text-xs">{t('finance.table.category')}</TableHead>
            <TableHead className="h-8 text-xs">{t('finance.table.date')}</TableHead>
            <TableHead className="h-8 text-xs">{t('finance.table.payment')}</TableHead>
            {isTaskIntegrationEnabled && (
              <TableHead className="h-8 text-xs">{t('finance.recurringBills.task')}</TableHead>
            )}
            <TableHead className="h-8 text-xs text-right">{t('finance.budget.value')}</TableHead>
            <TableHead className="h-8 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            className="h-8"
            onMouseDown={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('.cursor-text') || target.closest('input') || target.closest('[role="combobox"]')) {
                return
              }
              e.stopPropagation()
            }}
          >
            {/* Descrição - Editável inline */}
            <TableCell className="text-xs py-0 px-2">
              <AnimatePresence mode="wait">
                {editingCell?.field === 'description' ? (
                  <motion.div
                    key="edit-description"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => {
                        if (editingValue.trim()) {
                          setDescription(editingValue.trim())
                        }
                        setEditingCell(null)
                        setEditingValue('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingValue.trim()) {
                            setDescription(editingValue.trim())
                          }
                          setEditingCell(null)
                          setEditingValue('')
                        }
                        if (e.key === 'Escape') {
                          setEditingCell(null)
                          setEditingValue('')
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1 w-full"
                      autoFocus
                      placeholder={t('finance.table.description')}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => handleCellEdit(e, 'description', description)}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center transition-colors"
                  >
                    {description || (
                      <span className="text-muted-foreground italic">
                        {t('finance.table.description')}...
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TableCell>

            {/* Categoria - Editável inline */}
            <TableCell className="text-xs py-0 px-2">
              <AnimatePresence mode="wait">
                {editingCell?.field === 'category' ? (
                  <motion.div
                    key="edit-category"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Select
                      value={category}
                      open={selectOpen}
                      onOpenChange={(open) => {
                        setSelectOpen(open)
                        if (!open) {
                          setEditingCell(null)
                          setEditingValue('')
                        }
                      }}
                      onValueChange={(value) => {
                        setCategory(value)
                        setSelectOpen(false)
                        setEditingCell(null)
                        setEditingValue('')
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
                    onClick={(e) => handleCellEdit(e, 'category', category)}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center transition-colors"
                  >
                    {category || (
                      <span className="text-muted-foreground italic">
                        {t('finance.table.category')}...
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TableCell>

            {/* Data - Calendário popup */}
            <TableCell className="text-xs py-0 px-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <motion.button
                    key="display-date"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center gap-1.5 transition-colors w-full text-left"
                  >
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {format(transactionDate, 'dd/MM', { locale: dateFnsLocale })}
                    </Badge>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 border-2 shadow-xl bg-background rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => {
                      if (date) {
                        setTransactionDate(date)
                        setCalendarOpen(false)
                      }
                    }}
                    locale={dateFnsLocale}
                    className="rounded-lg"
                  />
                </PopoverContent>
              </Popover>
            </TableCell>

            {/* Método de Pagamento - Select */}
            <TableCell className="text-xs py-0 px-2">
              <AnimatePresence mode="wait">
                {editingCell?.field === 'payment' ? (
                  <motion.div
                    key="edit-payment"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Select
                      value={paymentMethod}
                      open={selectOpen}
                      onOpenChange={(open) => {
                        setSelectOpen(open)
                        if (!open) {
                          setEditingCell(null)
                        }
                      }}
                      onValueChange={(value) => {
                        setPaymentMethod(value)
                        setSelectOpen(false)
                        setEditingCell(null)
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-none p-1 focus-visible:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 {t('finance.payment.cash')}</SelectItem>
                        <SelectItem value="credit_card">💳 {t('finance.payment.creditCard')}</SelectItem>
                        <SelectItem value="debit_card">💳 {t('finance.payment.debitCard')}</SelectItem>
                        <SelectItem value="pix">📱 {t('finance.payment.pix')}</SelectItem>
                        <SelectItem value="bank_transfer">🏦 {t('finance.payment.bankTransfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-payment"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingCell({ field: 'payment' })
                      setSelectOpen(true)
                    }}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center transition-colors text-muted-foreground"
                  >
                    {getPaymentLabel(paymentMethod)}
                  </motion.div>
                )}
              </AnimatePresence>
            </TableCell>

            {/* Task - Editável inline (somente se integração ativa) */}
            {isTaskIntegrationEnabled && (
            <TableCell className="text-xs py-0 px-2">
              <AnimatePresence mode="wait">
                {editingCell?.field === 'task' ? (
                  <motion.div
                    key="edit-task"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Select
                      value={taskId || 'none'}
                      open={selectOpen}
                      onOpenChange={(open) => {
                        setSelectOpen(open)
                        if (!open) {
                          setEditingCell(null)
                          setEditingValue('')
                        }
                      }}
                      onValueChange={(value) => {
                        setTaskId(value === 'none' ? '' : value)
                        setSelectOpen(false)
                        setEditingCell(null)
                        setEditingValue('')
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-none p-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('finance.quickExpense.noTask')}</SelectItem>
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
                    onClick={(e) => handleCellEdit(e, 'task', taskId)}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center gap-1.5 transition-colors"
                  >
                    {taskId && tasks.find(t => t.id === taskId) ? (
                      <>
                        {tasks.find(t => t.id === taskId)?.status === 'done' && (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                        <span className={`truncate ${tasks.find(t => t.id === taskId)?.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {tasks.find(t => t.id === taskId)?.title}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">{t('finance.recurringBills.task')}...</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TableCell>
            )}

            {/* Valor - Editável inline */}
            <TableCell className="text-xs text-right font-mono py-0 px-2">
              <AnimatePresence mode="wait">
                {editingCell?.field === 'amount' ? (
                  <motion.div
                    key="edit-amount"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-end"
                  >
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editingValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,.-]/g, '')
                        setEditingValue(value)
                      }}
                      onBlur={() => {
                        const cleanedValue = editingValue.trim().replace(/[^0-9,.-]/g, '')
                        if (cleanedValue) {
                          setAmount(cleanedValue)
                        }
                        setEditingCell(null)
                        setEditingValue('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const cleanedValue = editingValue.trim().replace(/[^0-9,.-]/g, '')
                          if (cleanedValue) {
                            setAmount(cleanedValue)
                          }
                          setEditingCell(null)
                          setEditingValue('')
                        }
                        if (e.key === 'Escape') {
                          setEditingCell(null)
                          setEditingValue(amount)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1 text-right w-full max-w-[120px]"
                      autoFocus
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-amount"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => handleCellEdit(e, 'amount', amount)}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold transition-colors w-full"
                  >
                    {amount ? (
                      <span className="text-red-600">
                        {formatCurrency(parseFloat(amount.replace(',', '.')) || 0)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t('finance.quickExpense.currencyPlaceholder')}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TableCell>

            {/* Botão adicionar */}
            <TableCell className="text-xs py-0 px-1">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  type="button"
                  disabled={loading || !amount || !description.trim()}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleQuickAdd()
                  }}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </motion.div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </motion.div>
  )
}
