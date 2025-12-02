import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Plus, Trash2, TrendingUp, TrendingDown, Calendar, Check
} from 'lucide-react'
import { FinanceTransaction, PAYMENT_METHODS } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useI18n } from '@/hooks/use-i18n'

interface TransactionTableProps {
  documentId: string
  transactions: FinanceTransaction[]
  categories: string[]
  onRefresh: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const TransactionTable = ({
  documentId,
  transactions,
  categories,
  onRefresh,
}: TransactionTableProps) => {
  const { t } = useI18n()
  
  // Estado local para atualização otimista INSTANTÂNEA
  const [localTransactions, setLocalTransactions] = useState<FinanceTransaction[]>(transactions)
  
  // Sincronizar quando props mudarem (mas não causar reload)
  useEffect(() => {
    setLocalTransactions(transactions)
  }, [transactions])
  
  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // DELETAR - Atualização otimista instantânea
  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!confirm(t('finance.table.deleteConfirm'))) return

    // 1. Remover da UI IMEDIATAMENTE
    setLocalTransactions(prev => prev.filter(t => t.id !== id))

    try {
      // 2. Salvar no banco em background
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(t('finance.table.deleted'))
    } catch (err: any) {
      // 3. Se falhar, restaurar
      setLocalTransactions(transactions)
      toast.error(t('finance.table.errorDelete'), {
        description: err.message,
      })
    }
  }, [t, transactions])

  // TOGGLE STATUS - Atualização otimista instantânea
  const handleToggleStatus = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    // 1. Atualizar UI IMEDIATAMENTE
    setLocalTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t)
    )

    try {
      // 2. Salvar no banco em background
      const { error } = await supabase
        .from('finance_transactions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
    } catch (err: any) {
      // 3. Se falhar, restaurar
      setLocalTransactions(transactions)
      toast.error(t('finance.table.errorUpdate'), {
        description: err.message,
      })
    }
  }, [t, transactions])
  
  // Função helper para atualizar transação localmente
  const updateLocalTransaction = useCallback((id: string, updates: Partial<FinanceTransaction>) => {
    setLocalTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    )
  }, [])

  // Handlers para edição inline
  const handleCellEdit = (e: React.MouseEvent, rowId: string, field: string, currentValue: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCell({ rowId, field })
    setEditingValue(String(currentValue || ''))
  }

  const handleCellSave = async (rowId: string, field: string) => {
    if (!editingCell || editingCell.rowId !== rowId || editingCell.field !== field) return

    const transaction = localTransactions.find(t => t.id === rowId)
    if (!transaction && rowId === 'new-transaction') {
      // Nova transação - criar
      if (field === 'description' && editingValue.trim()) {
        try {
          const { data, error } = await supabase.from('finance_transactions').insert({
            finance_document_id: documentId,
            type: 'expense',
            category: '',
            description: editingValue.trim(),
            amount: 0,
            transaction_date: format(new Date(), 'yyyy-MM-dd'),
            payment_method: 'cash',
            status: 'completed',
            tags: [],
          }).select().single()

          if (error) throw error
          
          // Adicionar à lista local IMEDIATAMENTE
          if (data) {
            setLocalTransactions(prev => [data, ...prev])
          }
          
          toast.success(t('finance.table.added'))
          setEditingCell(null)
          setEditingValue('')
        } catch (err: any) {
          toast.error(t('finance.table.errorAdd'), {
            description: err.message,
          })
        }
      }
      return
    }
    
    if (!transaction) {
      setEditingCell(null)
      setEditingValue('')
      return
    }

    // Editar transação existente
    const updateData: any = {}
    
    if (field === 'description') {
      updateData.description = editingValue.trim()
    } else if (field === 'category') {
      updateData.category = editingValue.trim()
    } else if (field === 'amount' || field === 'value') {
      const newAmount = parseFloat(editingValue)
      if (isNaN(newAmount)) {
        toast.error('Valor inválido')
        setEditingCell(null)
        setEditingValue('')
        return
      }
      updateData.amount = newAmount
    } else if (field === 'date' || field === 'transaction_date') {
      updateData.transaction_date = editingValue
    } else if (field === 'payment_method') {
      updateData.payment_method = editingValue
    } else if (field === 'type') {
      updateData.type = editingValue as 'income' | 'expense'
    } else if (field === 'status') {
      updateData.status = editingValue as 'pending' | 'completed'
    }

    // Verificar se há algo para atualizar
    if (Object.keys(updateData).length === 0) {
      setEditingCell(null)
      setEditingValue('')
      return
    }

    // 1. Atualizar UI IMEDIATAMENTE
    updateLocalTransaction(rowId, updateData)
    setEditingCell(null)
    setEditingValue('')

    try {
      // 2. Salvar no banco em background
      const { error } = await supabase
        .from('finance_transactions')
        .update(updateData)
        .eq('id', rowId)

      if (error) throw error
      toast.success(t('finance.table.updated'))
    } catch (err: any) {
      // 3. Se falhar, restaurar
      setLocalTransactions(transactions)
      toast.error(t('finance.table.errorUpdate'), {
        description: err.message,
      })
    }
  }

  const getPaymentMethodLabel = useCallback((method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(m => m.value === method)
    if (paymentMethod) {
    const labels: Record<string, string> = {
      cash: t('finance.payment.cash'),
      credit_card: t('finance.payment.creditCard'),
      debit_card: t('finance.payment.debitCard'),
      pix: t('finance.payment.pix'),
      bank_transfer: t('finance.payment.bankTransfer'),
    }
      return `${paymentMethod.icon} ${labels[method] || paymentMethod.label}`
    }
    return method
  }, [t])


  return (
    <div className="space-y-4 -mx-3 px-3">
      {/* Tabela de transações - Formato editável inline como no gerenciador */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 text-xs w-[50px]">{t('finance.table.status')}</TableHead>
              <TableHead className="h-8 text-xs w-[100px]">{t('finance.table.type')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.description')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.category')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.payment')}</TableHead>
              <TableHead className="h-8 text-xs">{t('finance.table.date')}</TableHead>
              <TableHead className="h-8 text-xs text-right">{t('finance.table.value')}</TableHead>
              <TableHead className="h-8 w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localTransactions.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className="h-8"
                onClick={(e) => {
                  // Prevenir propagação apenas se não estiver editando
                  if (!editingCell || editingCell.rowId !== transaction.id) {
                    e.stopPropagation()
                  }
                }}
              >
                {/* Status */}
                <TableCell className="text-xs py-0 px-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleToggleStatus(transaction.id, transaction.status)
                    }}
                  >
                    {transaction.status === 'completed' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <div className="h-3 w-3 border-2 border-muted-foreground rounded-full" />
                    )}
                  </Button>
                </TableCell>

                {/* Tipo - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'type' ? (
                    <Select
                      value={editingValue || transaction.type}
                      onValueChange={async (value) => {
                        // 1. Atualizar UI IMEDIATAMENTE
                        updateLocalTransaction(transaction.id, { type: value as 'income' | 'expense' })
                        setEditingCell(null)
                        setEditingValue('')
                        
                        try {
                          // 2. Salvar no banco em background
                          const { error } = await supabase
                            .from('finance_transactions')
                            .update({ type: value as 'income' | 'expense' })
                            .eq('id', transaction.id)

                          if (error) throw error
                          toast.success(t('finance.table.updated'))
                        } catch (err: any) {
                          // 3. Se falhar, restaurar
                          setLocalTransactions(transactions)
                          toast.error(t('finance.table.errorUpdate'), {
                            description: err.message,
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-none p-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">
                          <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-xs">{t('finance.filters.income')}</span>
                </div>
              </SelectItem>
              <SelectItem value="expense">
                          <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                            <span className="text-xs">{t('finance.filters.expense')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
                  ) : (
                    <div
                      onClick={(e) => handleCellEdit(e, transaction.id, 'type', transaction.type)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                    >
                    <Badge
                      variant="outline"
                      className={cn(
                          'gap-1 text-xs',
                        transaction.type === 'income'
                          ? 'border-green-500 text-green-600'
                          : 'border-red-500 text-red-600'
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          <span className="hidden sm:inline">{t('finance.filters.income')}</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          <span className="hidden sm:inline">{t('finance.filters.expense')}</span>
                        </>
                      )}
                    </Badge>
                    </div>
                  )}
                  </TableCell>

                {/* Descrição - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'description' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleCellSave(transaction.id, 'description')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCellSave(transaction.id, 'description')
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
                      onClick={(e) => handleCellEdit(e, transaction.id, 'description', transaction.description)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center font-medium"
                    >
                      {transaction.description || <span className="text-muted-foreground">Descrição...</span>}
                    </div>
                  )}
                  </TableCell>

                {/* Categoria - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'category' ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleCellSave(transaction.id, 'category')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCellSave(transaction.id, 'category')
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingCell(null)
                        }
                      }}
                      className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                      autoFocus
                      list="transaction-categories"
                    />
                  ) : (
                    <div
                      onClick={(e) => handleCellEdit(e, transaction.id, 'category', transaction.category)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center"
                    >
                      <Badge variant="secondary" className="text-[10px]">
                        {transaction.category || <span className="text-muted-foreground">Categoria...</span>}
                    </Badge>
                    </div>
                  )}
                  </TableCell>

                {/* Método de pagamento - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'payment_method' ? (
                    <Select
                      value={editingValue || transaction.payment_method || 'cash'}
                      onValueChange={async (value) => {
                        // 1. Atualizar UI IMEDIATAMENTE
                        updateLocalTransaction(transaction.id, { payment_method: value })
                        setEditingCell(null)
                        setEditingValue('')
                        
                        try {
                          // 2. Salvar no banco em background
                          const { error } = await supabase
                            .from('finance_transactions')
                            .update({ payment_method: value })
                            .eq('id', transaction.id)
                          
                          if (error) throw error
                          toast.success(t('finance.table.updated'))
                        } catch (err: any) {
                          // 3. Se falhar, restaurar
                          setLocalTransactions(transactions)
                          toast.error(t('finance.table.errorUpdate'), {
                            description: err.message,
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs border-none p-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => {
                          const labels: Record<string, string> = {
                            cash: t('finance.payment.cash'),
                            credit_card: t('finance.payment.creditCard'),
                            debit_card: t('finance.payment.debitCard'),
                            pix: t('finance.payment.pix'),
                            bank_transfer: t('finance.payment.bankTransfer'),
                          }
                          return (
                            <SelectItem key={method.value} value={method.value}>
                              <span className="text-xs">{method.icon} {labels[method.value] || method.label}</span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div
                      onClick={(e) => handleCellEdit(e, transaction.id, 'payment_method', transaction.payment_method)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground"
                    >
                      {getPaymentMethodLabel(transaction.payment_method || 'cash')}
                    </div>
                  )}
                  </TableCell>

                {/* Data - Editável inline */}
                <TableCell className="text-xs py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'date' ? (
                    <Input
                      type="date"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleCellSave(transaction.id, 'transaction_date')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCellSave(transaction.id, 'transaction_date')
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
                      onClick={(e) => handleCellEdit(e, transaction.id, 'date', transaction.transaction_date)}
                      className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center gap-1 text-muted-foreground"
                    >
                      <Calendar className="h-3 w-3" />
                      {transaction.transaction_date ? format(new Date(transaction.transaction_date), 'dd/MM/yyyy') : <span className="text-muted-foreground">Data...</span>}
                    </div>
                  )}
                  </TableCell>

                {/* Valor - Editável inline */}
                <TableCell className="text-xs text-right font-mono py-0 px-2">
                  {editingCell?.rowId === transaction.id && editingCell?.field === 'amount' ? (
                    <Input
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleCellSave(transaction.id, 'amount')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCellSave(transaction.id, 'amount')
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
                      onClick={(e) => handleCellEdit(e, transaction.id, 'amount', transaction.amount)}
                    className={cn(
                        "cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center justify-end font-semibold",
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                      {transaction.amount > 0 ? (
                        <>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                        </>
                      ) : (
                        <span className="text-muted-foreground">0,00</span>
                      )}
                    </div>
                  )}
                  </TableCell>

                {/* Ações - Ícone de deletar direto */}
                <TableCell className="text-xs py-0 px-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteTransaction(transaction.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                  </TableCell>
                </TableRow>
              ))}
            
            {/* Linha vazia para adicionar nova transação - Como no gerenciador */}
            <TableRow className="h-8">
              <TableCell className="text-xs py-0 px-2"></TableCell>
              <TableCell className="text-xs py-0 px-2"></TableCell>
              <TableCell className="text-xs py-0 px-2">
                {editingCell?.rowId === 'new-transaction' && editingCell?.field === 'description' ? (
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => {
                      // Só salva se tiver conteúdo, senão apenas fecha
                      if (editingValue.trim()) {
                        handleCellSave('new-transaction', 'description')
                      } else {
                        setEditingCell(null)
                        setEditingValue('')
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingValue.trim()) {
                        e.preventDefault()
                        handleCellSave('new-transaction', 'description')
                      }
                      if (e.key === 'Escape' || e.key === 'Tab') {
                        e.preventDefault()
                        setEditingCell(null)
                        setEditingValue('')
                      }
                    }}
                    className="h-7 text-xs border-none p-1 focus-visible:ring-1"
                    autoFocus
                    placeholder={t('finance.table.descriptionPlaceholder')}
                  />
                ) : (
                  <div
                    onClick={(e) => handleCellEdit(e, 'new-transaction', 'description', '')}
                    className="cursor-text hover:bg-muted/50 px-1 py-0.5 rounded min-h-[28px] flex items-center text-muted-foreground italic"
                  >
                    + {t('finance.table.add')}...
                  </div>
                )}
              </TableCell>
              <TableCell colSpan={5} className="text-xs py-0 px-2"></TableCell>
            </TableRow>
            </TableBody>
          </Table>
        <datalist id="transaction-categories">
          {categories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
          </div>

    </div>
  )
}
