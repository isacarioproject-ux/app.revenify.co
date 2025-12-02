import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Tag, 
  DollarSign, 
  Calendar, 
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

interface AddTransactionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  categories: string[]
  onSuccess: () => void
}

export const AddTransactionDrawer = ({
  open,
  onOpenChange,
  documentId,
  categories,
  onSuccess,
}: AddTransactionDrawerProps) => {
  const { t } = useI18n()
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'money',
    status: 'completed' as 'pending' | 'completed',
  })

  const handleAddTransaction = async () => {
    // Validações
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) {
      toast.error(t('finance.table.fillRequired'))
      return
    }

    const amount = parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('finance.budget.invalidValue'), {
        description: t('finance.budget.invalidValueDesc')
      })
      return
    }

    try {
      const { error } = await supabase.from('finance_transactions').insert({
        finance_document_id: documentId,
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        transaction_date: newTransaction.transaction_date,
        payment_method: newTransaction.payment_method,
        status: newTransaction.status,
      })

      if (error) throw error

      // Reset form
      setNewTransaction({
        type: 'expense',
        category: '',
        description: '',
        amount: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'money',
        status: 'completed',
      })

      onSuccess()
      onOpenChange(false)
      toast.success(t('finance.addTransaction.success'))
    } catch (err: any) {
      toast.error(t('finance.table.errorAdd'), {
        description: err.message,
      })
    }
  }

  // Ícones para métodos de pagamento
  const paymentIcons: Record<string, string> = {
    money: '💵',
    credit_card: '💳',
    debit_card: '💳',
    pix: '⚡',
    bank_transfer: '🏦',
    other: '📝',
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-w-lg p-0"
        drawerProps={{
          className: "h-[100dvh] flex flex-col"
        }}
      >
        <ModalHeader className="px-3 py-2 border-b bg-muted/30 flex-shrink-0">
          <ModalTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t('finance.addTransaction.title')}
          </ModalTitle>
        </ModalHeader>

        <div className="divide-y divide-border flex-1 overflow-y-auto">
          {/* Tipo - Toggle buttons compacto */}
          <div className="px-3 py-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                  newTransaction.type === 'expense'
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                )}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                {t('finance.filters.expense')}
              </button>
              <button
                type="button"
                onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                  newTransaction.type === 'income'
                    ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {t('finance.filters.income')}
              </button>
            </div>
          </div>

          {/* Descrição - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.table.description')}</span>
            <Input
              placeholder={t('finance.addTransaction.descriptionPlaceholder')}
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Valor - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.table.value')}</span>
            <Input
              type="number"
              placeholder="0,00"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              step="0.01"
              min="0"
              className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 font-mono"
            />
          </div>

          {/* Categoria - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.table.category')}</span>
            <Select
              value={newTransaction.category}
              onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
            >
              <SelectTrigger className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus:ring-0 shadow-none">
                <SelectValue placeholder={t('finance.addTransaction.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="general">{t('finance.table.general')}</SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Data - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.table.date')}</span>
            <Input
              type="date"
              value={newTransaction.transaction_date}
              onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
              className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus-visible:ring-0"
            />
          </div>

          {/* Método de Pagamento - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.addTransaction.payment')}</span>
            <Select
              value={newTransaction.payment_method}
              onValueChange={(value) => setNewTransaction({ ...newTransaction, payment_method: value })}
            >
              <SelectTrigger className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus:ring-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="money">{paymentIcons.money} {t('finance.payment.cash')}</SelectItem>
                <SelectItem value="credit_card">{paymentIcons.credit_card} {t('finance.payment.creditCard')}</SelectItem>
                <SelectItem value="debit_card">{paymentIcons.debit_card} {t('finance.payment.debitCard')}</SelectItem>
                <SelectItem value="pix">{paymentIcons.pix} {t('finance.payment.pix')}</SelectItem>
                <SelectItem value="bank_transfer">{paymentIcons.bank_transfer} {t('finance.payment.bankTransfer')}</SelectItem>
                <SelectItem value="other">{paymentIcons.other} {t('finance.addTransaction.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status - Compacto */}
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
            {newTransaction.status === 'completed' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
            )}
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t('finance.table.status')}</span>
            <Select
              value={newTransaction.status}
              onValueChange={(value: 'pending' | 'completed') => setNewTransaction({ ...newTransaction, status: value })}
            >
              <SelectTrigger className="flex-1 border-0 bg-transparent px-0 h-7 text-sm focus:ring-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {t('finance.filters.completed')}
                  </span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    {t('finance.filters.pending')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão Salvar - Footer fixo */}
        <div className="px-3 py-2 border-t bg-muted/30 flex-shrink-0">
          <Button
            onClick={handleAddTransaction}
            className="w-full"
            size="sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {t('finance.addTransaction.save')}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
