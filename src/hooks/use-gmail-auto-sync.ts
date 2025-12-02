import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspace } from '@/contexts/workspace-context'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { GmailService } from '@/services/google/gmail.service'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface GmailNotification {
  id: string
  type: 'income' | 'expense'
  subject: string
  from: string
  amount: number
  date: string
  isNew: boolean
}

interface UseGmailAutoSyncOptions {
  enabled?: boolean
  intervalMinutes?: number
  onNewEmails?: (emails: GmailNotification[]) => void
}

// Detectar se é receita ou despesa
const detectType = (from: string, subject: string, snippet: string): 'income' | 'expense' => {
  const text = (from + ' ' + subject + ' ' + snippet).toLowerCase()
  
  const incomeTerms = [
    'pix recebido', 'transferência recebida', 'transferencia recebida',
    'você recebeu', 'voce recebeu', 'recebimento', 'crédito', 'credito',
    'depósito', 'deposito', 'venda realizada', 'pagamento recebido',
    'entrada de', 'valor creditado', 'ted recebida', 'doc recebido'
  ]
  
  for (const term of incomeTerms) {
    if (text.includes(term)) return 'income'
  }
  
  return 'expense'
}

// Extrair valor
const extractAmount = (text: string): number => {
  const patterns = [
    /R\$\s*([\d.,]+)/i,
    /BRL\s*([\d.,]+)/i,
    /valor[:\s]*([\d.,]+)/i,
    /total[:\s]*([\d.,]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let value = match[1].replace(/\./g, '').replace(',', '.')
      const num = parseFloat(value)
      if (!isNaN(num) && num > 0 && num < 1000000) {
        return num
      }
    }
  }
  return 0
}

export function useGmailAutoSync(options: UseGmailAutoSyncOptions = {}) {
  const { enabled = false, intervalMinutes = 5, onNewEmails } = options
  const { currentWorkspace } = useWorkspace()
  const { isConnected } = useGoogleIntegration()
  
  const [notifications, setNotifications] = useState<GmailNotification[]>([])
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [checking, setChecking] = useState(false)
  const [newCount, setNewCount] = useState(0)
  
  const lastCheckRef = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar novos emails
  const checkNewEmails = useCallback(async () => {
    if (!isConnected || checking) return
    
    try {
      setChecking(true)
      
      // Buscar emails dos últimos 2 dias (para pegar novos)
      const results = await GmailService.searchInvoices(currentWorkspace?.id)
      
      // Filtrar apenas emails que não foram vistos ainda
      const newEmails: GmailNotification[] = []
      
      for (const msg of results) {
        // Verificar se já foi processado
        const { data: existing } = await supabase
          .from('imported_gmail_messages')
          .select('id')
          .eq('gmail_message_id', msg.id)
          .maybeSingle()
        
        if (!existing) {
          const type = detectType(msg.from, msg.subject, msg.snippet)
          const amount = extractAmount(`${msg.subject} ${msg.snippet}`)
          
          newEmails.push({
            id: msg.id,
            type,
            subject: msg.subject,
            from: msg.from,
            amount,
            date: msg.date,
            isNew: !lastCheckRef.current || new Date(msg.date) > new Date(lastCheckRef.current)
          })
        }
      }
      
      // Atualizar notificações
      if (newEmails.length > 0) {
        setNotifications(newEmails)
        
        // Contar novos desde última verificação
        const trulyNew = newEmails.filter(e => e.isNew)
        if (trulyNew.length > 0 && lastCheckRef.current) {
          setNewCount(prev => prev + trulyNew.length)
          
          // Callback
          onNewEmails?.(trulyNew)
          
          // Toast de notificação
          const incomeCount = trulyNew.filter(e => e.type === 'income').length
          const expenseCount = trulyNew.length - incomeCount
          
          if (incomeCount > 0 || expenseCount > 0) {
            toast.info(`📬 ${trulyNew.length} novos emails financeiros`, {
              description: `💰 ${incomeCount} receitas | 📤 ${expenseCount} despesas`,
              duration: 10000,
              action: {
                label: 'Ver',
                onClick: () => {
                  // Navegar para Finance com Gmail aberto
                  window.dispatchEvent(new CustomEvent('open-gmail-scanner'))
                }
              }
            })
          }
        }
      }
      
      lastCheckRef.current = new Date().toISOString()
      setLastCheck(new Date())
      
    } catch (error) {
      console.error('Erro no auto-sync Gmail:', error)
    } finally {
      setChecking(false)
    }
  }, [isConnected, currentWorkspace?.id, checking, onNewEmails])

  // Limpar contagem de novos
  const clearNewCount = useCallback(() => {
    setNewCount(0)
  }, [])

  // Iniciar/parar polling
  useEffect(() => {
    if (enabled && isConnected) {
      // Verificar imediatamente
      checkNewEmails()
      
      // Configurar intervalo
      intervalRef.current = setInterval(checkNewEmails, intervalMinutes * 60 * 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [enabled, isConnected, intervalMinutes, checkNewEmails])

  // Salvar último check no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gmail-last-check')
    if (saved) {
      lastCheckRef.current = saved
    }
  }, [])

  useEffect(() => {
    if (lastCheck) {
      localStorage.setItem('gmail-last-check', lastCheck.toISOString())
    }
  }, [lastCheck])

  return {
    notifications,
    newCount,
    lastCheck,
    checking,
    checkNewEmails,
    clearNewCount
  }
}
