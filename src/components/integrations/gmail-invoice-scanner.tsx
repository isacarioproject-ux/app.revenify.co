import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Download, CheckCircle2, AlertCircle, DollarSign, Calendar, Edit2, AlertTriangle, RefreshCw, FileText, Repeat, TrendingDown, TrendingUp } from 'lucide-react'
import { GmailService, type GmailMessage } from '@/services/google/gmail.service'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/hooks/use-i18n'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { GoogleAuthService } from '@/services/google/google-auth.service'

interface FinanceDocument {
  id: string
  name: string
  icon: string | null
}

type ImportType = 'expense' | 'income' | 'recurring'

/**
 * 📧 Gmail Invoice Scanner
 * Componente para escanear e importar boletos/faturas do Gmail
 * 
 * Funcionalidade estilo Notion/Expensify:
 * - Lista emails com anexos PDF de faturas
 * - Preview dos dados extraídos
 * - Importação com um clique
 * - Marca email como processado
 */

// Extrair valor monetário de texto
const extractAmount = (text: string): number => {
  // Padrões comuns: R$ 123,45 | R$123.45 | 123,45 | BRL 123.45
  const patterns = [
    /R\$\s*([\d.,]+)/i,
    /BRL\s*([\d.,]+)/i,
    /valor[:\s]*([\d.,]+)/i,
    /total[:\s]*([\d.,]+)/i,
    /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // Converter formato BR (1.234,56) para número
      let value = match[1].replace(/\./g, '').replace(',', '.')
      const num = parseFloat(value)
      if (!isNaN(num) && num > 0 && num < 1000000) {
        return num
      }
    }
  }
  return 0
}

// Extrair data de vencimento
const extractDueDate = (text: string): string => {
  // Padrões: 25/12/2024 | 25-12-2024 | vencimento: 25/12
  const patterns = [
    /vencimento[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i,
    /venc[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i,
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const parts = match[1].split(/[\/\-]/)
      if (parts.length >= 3) {
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
  }
  
  // Default: próximo mês
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth.toISOString().split('T')[0]
}

// Detectar categoria pelo remetente/assunto
const detectCategory = (from: string, subject: string): string => {
  const text = (from + ' ' + subject).toLowerCase()
  
  if (text.includes('energia') || text.includes('enel') || text.includes('cemig') || text.includes('cpfl') || text.includes('light')) return 'Energia'
  if (text.includes('água') || text.includes('saneamento') || text.includes('sabesp') || text.includes('copasa')) return 'Água'
  if (text.includes('internet') || text.includes('telefone') || text.includes('vivo') || text.includes('claro') || text.includes('tim') || text.includes('oi')) return 'Internet/Telefone'
  if (text.includes('gás') || text.includes('comgas')) return 'Gás'
  if (text.includes('aluguel') || text.includes('condomínio') || text.includes('iptu')) return 'Moradia'
  if (text.includes('cartão') || text.includes('nubank') || text.includes('itaú') || text.includes('bradesco') || text.includes('santander')) return 'Cartão de Crédito'
  if (text.includes('seguro')) return 'Seguro'
  if (text.includes('escola') || text.includes('faculdade') || text.includes('curso')) return 'Educação'
  if (text.includes('pix') || text.includes('venda') || text.includes('recebido') || text.includes('crédito')) return 'Receita'
  
  return 'Contas'
}

// Detectar automaticamente se é RECEITA ou DESPESA
const detectTransactionType = (from: string, subject: string, snippet: string): 'expense' | 'income' => {
  const text = (from + ' ' + subject + ' ' + snippet).toLowerCase()
  
  // Termos que indicam RECEITA
  const incomeTerms = [
    'pix recebido', 'transferência recebida', 'transferencia recebida',
    'você recebeu', 'voce recebeu', 'recebimento', 'crédito', 'credito',
    'depósito', 'deposito', 'venda realizada', 'pagamento recebido',
    'entrada de', 'valor creditado', 'ted recebida', 'doc recebido'
  ]
  
  for (const term of incomeTerms) {
    if (text.includes(term)) return 'income'
  }
  
  // Por padrão, considera despesa
  return 'expense'
}

// Verificar status de atraso
const getPaymentStatus = (dueDate: string): { status: 'overdue' | 'due_soon' | 'pending', label: string, color: string } => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'overdue', label: `Atrasado ${Math.abs(diffDays)}d`, color: 'text-red-600 bg-red-100' }
  } else if (diffDays <= 3) {
    return { status: 'due_soon', label: `Vence em ${diffDays}d`, color: 'text-orange-600 bg-orange-100' }
  } else {
    return { status: 'pending', label: `Em ${diffDays}d`, color: 'text-blue-600 bg-blue-100' }
  }
}

// Atualizar totais do documento financeiro
const updateDocumentTotals = async (docId: string) => {
  try {
    // Buscar todas as transações do documento
    const { data: transactions, error } = await supabase
      .from('finance_transactions')
      .select('type, amount')
      .eq('finance_document_id', docId)
    
    if (error) throw error
    
    // Calcular totais
    let totalIncome = 0
    let totalExpenses = 0
    
    transactions?.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += Number(tx.amount) || 0
      } else {
        totalExpenses += Number(tx.amount) || 0
      }
    })
    
    const balance = totalIncome - totalExpenses
    
    // Atualizar documento
    await supabase
      .from('finance_documents')
      .update({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        balance: balance,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      
  } catch (err) {
    console.error('Erro ao atualizar totais:', err)
  }
}

export function GmailInvoiceScanner() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const { isConnected, tokenExpired, reconnect } = useGoogleIntegration()
  const [scanning, setScanning] = useState(false)
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [importing, setImporting] = useState<string | null>(null)
  const [editingAmount, setEditingAmount] = useState<string | null>(null)
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'expired'>('checking')
  
  // Novos estados para seleção de documento e tipo
  const [financeDocuments, setFinanceDocuments] = useState<FinanceDocument[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>('')
  const [importTypes, setImportTypes] = useState<Record<string, ImportType>>({})
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Carregar documentos financeiros do usuário
  useEffect(() => {
    const loadFinanceDocuments = async () => {
      try {
        setLoadingDocs(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('finance_documents')
          .select('id, name, icon')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error
        
        setFinanceDocuments(data || [])
        if (data && data.length > 0) {
          setSelectedDocId(data[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar documentos:', err)
      } finally {
        setLoadingDocs(false)
      }
    }
    loadFinanceDocuments()
  }, [currentWorkspace?.id])

  // Verificar conexão Google ao montar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await GoogleAuthService.isConnected(currentWorkspace?.id)
        if (!connected) {
          setConnectionStatus('disconnected')
        } else if (tokenExpired) {
          setConnectionStatus('expired')
        } else {
          setConnectionStatus('connected')
        }
      } catch {
        setConnectionStatus('disconnected')
      }
    }
    checkConnection()
  }, [currentWorkspace?.id, tokenExpired, isConnected])

  const handleScan = async () => {
    // Verificar se Google está conectado
    if (connectionStatus !== 'connected') {
      toast.error(t('gmail.notConnected'))
      return
    }

    try {
      setScanning(true)
      toast.info(`🔍 ${t('gmail.scanningGmail')}`)

      const results = await GmailService.searchInvoices(currentWorkspace?.id)
      
      setMessages(results)
      
      // Detectar tipo automaticamente para cada mensagem
      const detectedTypes: Record<string, ImportType> = {}
      results.forEach((msg) => {
        const autoType = detectTransactionType(msg.from, msg.subject, msg.snippet)
        detectedTypes[msg.id] = autoType
      })
      setImportTypes(prev => ({ ...prev, ...detectedTypes }))
      
      if (results.length === 0) {
        toast.info(t('gmail.noInvoices'))
      } else {
        // Contar receitas e despesas
        const incomeCount = Object.values(detectedTypes).filter(t => t === 'income').length
        const expenseCount = results.length - incomeCount
        toast.success(`✅ ${results.length} ${t('gmail.invoicesFound')}`, {
          description: `💰 ${incomeCount} receitas | 📤 ${expenseCount} despesas`
        })
      }
    } catch (error: any) {
      console.error('Erro ao escanear:', error)
      
      // Detectar erros de token
      if (error.message?.includes('Token') || error.message?.includes('access')) {
        setConnectionStatus('expired')
        toast.error(t('gmail.tokenExpired'))
      } else {
        toast.error(`${t('gmail.errorScan')}: ${error.message}`)
      }
    } finally {
      setScanning(false)
    }
  }

  const handleImport = async (message: GmailMessage) => {
    // Verificar conexão
    if (connectionStatus !== 'connected') {
      toast.error(t('gmail.notConnected'))
      return
    }

    // Verificar se tem documento selecionado
    if (!selectedDocId) {
      toast.error(t('gmail.selectDocument'))
      return
    }

    const importType = importTypes[message.id] || 'expense'

    try {
      setImporting(message.id)
      toast.info(`📥 ${t('gmail.importingInvoice')}`)

      // Extrair dados do email
      const textContent = `${message.subject} ${message.snippet}`
      const amount = customAmounts[message.id] || extractAmount(textContent)
      const dueDate = extractDueDate(textContent)
      const category = detectCategory(message.from, message.subject)
      const dueDay = new Date(dueDate).getDate()
      
      if (amount <= 0) {
        toast.error(t('gmail.noValueDetected'))
        setEditingAmount(message.id)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('gmail.notAuthenticated'))
        return
      }

      // Inserir baseado no tipo selecionado
      if (importType === 'recurring') {
        // Inserir em recurring_bills (Contas Recorrentes)
        const { error } = await supabase
          .from('recurring_bills')
          .insert({
            user_id: user.id,
            finance_document_id: selectedDocId,
            name: message.subject.substring(0, 100),
            amount: amount,
            due_day: dueDay,
            category: category,
            paid: false,
            auto_create: true
          })

        if (error) {
          console.error('Erro ao criar conta recorrente:', error)
          toast.error(t('gmail.errorCreateRecurring'))
          return
        }

        toast.success(`✅ ${t('gmail.recurringCreated')} R$ ${amount.toFixed(2)}`, {
          description: `${t('gmail.dueDay')}: ${dueDay} | ${t('gmail.category')}: ${category}`
        })
      } else {
        // Inserir em finance_transactions (Gasto ou Entrada)
        const { error } = await supabase
          .from('finance_transactions')
          .insert({
            finance_document_id: selectedDocId,
            type: importType, // 'expense' ou 'income'
            category: category,
            description: message.subject.substring(0, 200),
            amount: amount,
            transaction_date: dueDate,
            status: 'pending',
            payment_method: 'boleto',
            notes: `${t('gmail.importedFromGmail')} ${new Date().toLocaleDateString('pt-BR')}\n${t('gmail.from')}: ${message.from}`,
            tags: ['gmail-import', importType === 'expense' ? 'boleto' : 'receita']
          })

        if (error) {
          console.error('Erro ao criar transação:', error)
          toast.error(t('gmail.errorCreateTransaction'))
          return
        }

        const typeLabel = importType === 'expense' ? t('gmail.expense') : t('gmail.income')
        toast.success(`✅ ${typeLabel} ${t('gmail.imported')} R$ ${amount.toFixed(2)}`, {
          description: `${t('gmail.category')}: ${category} | ${t('gmail.dueDate')}: ${new Date(dueDate).toLocaleDateString('pt-BR')}`
        })
      }

      // Marcar email como processado (opcional)
      try {
        await GmailService.addLabel(message.id, 'ISACAR_IMPORTED', currentWorkspace?.id)
      } catch (labelError) {
        console.warn('Não foi possível adicionar label:', labelError)
      }
      
      // Atualizar contadores do documento
      if (importType !== 'recurring') {
        await updateDocumentTotals(selectedDocId)
      }
      
      // Remover da lista
      setMessages(prev => prev.filter(m => m.id !== message.id))
    } catch (error: any) {
      console.error('Erro ao importar:', error)
      
      if (error.message?.includes('Token') || error.message?.includes('access')) {
        setConnectionStatus('expired')
        toast.error(t('gmail.tokenExpired'))
      } else {
        toast.error(`${t('gmail.errorImport')}: ${error.message || t('gmail.unknownError')}`)
      }
    } finally {
      setImporting(null)
    }
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('gmail.title')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {t('gmail.description')}
              </CardDescription>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {connectionStatus === 'expired' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={reconnect}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">{t('gmail.reconnect')}</span>
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none">
                <Button
                  onClick={handleScan}
                  disabled={scanning || connectionStatus !== 'connected'}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="truncate">{t('gmail.scanning')}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('gmail.scan')}</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Seletor de Documento Financeiro */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {t('gmail.targetDocument')}:
            </Label>
            <Select value={selectedDocId} onValueChange={setSelectedDocId} disabled={loadingDocs}>
              <SelectTrigger className="h-8 text-xs sm:text-sm flex-1 sm:max-w-[250px]">
                <SelectValue placeholder={loadingDocs ? t('common.loading') : t('gmail.selectDocument')} />
              </SelectTrigger>
              <SelectContent>
                {financeDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs sm:text-sm">
                    <span className="flex items-center gap-2">
                      <span>{doc.icon || '📄'}</span>
                      <span className="truncate">{doc.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {financeDocuments.length === 0 && !loadingDocs && (
              <span className="text-xs text-muted-foreground">{t('gmail.noDocuments')}</span>
            )}
          </div>
        </div>

        {/* Alertas de status */}
        <AnimatePresence>
          {connectionStatus === 'disconnected' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  {t('gmail.notConnectedAlert')}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          {connectionStatus === 'expired' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="mt-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                  {t('gmail.tokenExpiredAlert')}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 sm:py-12 text-muted-foreground"
            >
              <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">{t('gmail.clickToScan')}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 sm:space-y-3"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  whileHover={{ scale: 1.01 }}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{message.subject}</h4>
                        
                        {/* Badge de tipo auto-detectado */}
                        {importTypes[message.id] === 'income' ? (
                          <Badge className="text-[10px] sm:text-xs bg-green-100 text-green-700 border-green-200">
                            <TrendingUp className="h-2.5 w-2.5 mr-1" />
                            Receita
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] sm:text-xs bg-red-100 text-red-700 border-red-200">
                            <TrendingDown className="h-2.5 w-2.5 mr-1" />
                            Despesa
                          </Badge>
                        )}
                        
                        {/* Badge de status de vencimento (só para despesas) */}
                        {importTypes[message.id] !== 'income' && (() => {
                          const dueDate = extractDueDate(`${message.subject} ${message.snippet}`)
                          const status = getPaymentStatus(dueDate)
                          return (
                            <Badge className={`text-[10px] sm:text-xs ${status.color} border-0`}>
                              {status.status === 'overdue' && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
                              {status.label}
                            </Badge>
                          )
                        })()}
                        
                        {message.hasAttachments && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                        {t('gmail.from')}: {message.from}
                      </p>
                      
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {message.snippet}
                      </p>
                      
                      {/* Info extraída */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                        {/* Valor detectado */}
                        <div className="flex items-center gap-1">
                          <DollarSign className={`h-3 w-3 ${importTypes[message.id] === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                          {editingAmount === message.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="h-6 w-20 sm:w-24 text-xs"
                              placeholder="Valor"
                              defaultValue={customAmounts[message.id] || extractAmount(`${message.subject} ${message.snippet}`)}
                              onChange={(e) => setCustomAmounts(prev => ({
                                ...prev,
                                [message.id]: parseFloat(e.target.value) || 0
                              }))}
                              onBlur={() => setEditingAmount(null)}
                              autoFocus
                            />
                          ) : (
                            <button 
                              onClick={() => setEditingAmount(message.id)}
                              className={`text-[10px] sm:text-xs font-medium hover:underline flex items-center gap-1 ${importTypes[message.id] === 'income' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {importTypes[message.id] === 'income' ? '+' : '-'} R$ {(customAmounts[message.id] || extractAmount(`${message.subject} ${message.snippet}`)).toFixed(2)}
                              <Edit2 className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                            </button>
                          )}
                        </div>
                        
                        {/* Categoria detectada */}
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {detectCategory(message.from, message.subject)}
                        </Badge>
                        
                        {/* Data */}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {new Date(message.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {/* Seletor de tipo de importação */}
                      <div className="flex items-center gap-2 mt-2">
                        <Select 
                          value={importTypes[message.id] || 'expense'} 
                          onValueChange={(value: ImportType) => setImportTypes(prev => ({ ...prev, [message.id]: value }))}
                        >
                          <SelectTrigger className="h-7 text-[10px] sm:text-xs w-full sm:w-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense" className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <TrendingDown className="h-3 w-3 text-red-500" />
                                {t('gmail.typeExpense')}
                              </span>
                            </SelectItem>
                            <SelectItem value="income" className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                {t('gmail.typeIncome')}
                              </span>
                            </SelectItem>
                            <SelectItem value="recurring" className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <Repeat className="h-3 w-3 text-purple-500" />
                                {t('gmail.typeRecurring')}
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Button
                        onClick={() => handleImport(message)}
                        disabled={importing === message.id || !selectedDocId}
                        size="sm"
                        className="w-full sm:w-auto shrink-0"
                      >
                        {importing === message.id ? (
                          <>
                            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            <span className="text-xs sm:text-sm">{t('gmail.importing')}</span>
                          </>
                        ) : (
                          <>
                            <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">{t('gmail.import')}</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status da integração */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {connectionStatus === 'connected' ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {t('gmail.connectedReady')}
                </span>
              </>
            ) : connectionStatus === 'expired' ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                <span className="text-orange-600 dark:text-orange-400">
                  {t('gmail.needsReconnection')}
                </span>
              </>
            ) : connectionStatus === 'disconnected' ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {t('gmail.disconnected')}
                </span>
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t('gmail.checkingConnection')}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
                <strong>{t('gmail.howItWorks')}</strong> {t('gmail.howItWorksDesc')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
