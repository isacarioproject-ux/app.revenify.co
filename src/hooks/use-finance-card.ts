import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { FinanceDocument } from '@/types/finance'
import { useRealtimeFinance } from './use-realtime-finance'

interface FinanceDocumentWithStats extends FinanceDocument {
  transaction_count?: number
  last_transaction_date?: string
}

export const useFinanceCard = (workspaceId?: string) => {
  const { currentWorkspace } = useWorkspace()
  const [documents, setDocuments] = useState<FinanceDocumentWithStats[]>([])
  const [loading, setLoading] = useState(true)

  // 📡 Realtime - Atualizar apenas quando necessário (sem loop)
  useRealtimeFinance(currentWorkspace?.id || null, {
    enabled: true,
    showNotifications: false, // Desabilitar toasts para evitar spam
    onUpdate: () => {
      // Não fazer nada aqui - deixar o componente decidir quando refetch
      console.log('🔄 [useFinanceCard] Realtime event received (ignored)')
    },
  })

  useEffect(() => {
    fetchDocuments()
  }, [workspaceId, currentWorkspace])

  // Escutar evento de atualização de transações
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('🔔 [useFinanceCard] Transação atualizada, refetching...')
      fetchDocuments()
    }

    window.addEventListener('finance-transaction-updated', handleTransactionUpdate)
    return () => window.removeEventListener('finance-transaction-updated', handleTransactionUpdate)
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 [useFinanceCard] Buscando documentos...', {
        userId: user?.id,
        workspaceId: currentWorkspace?.id
      })
      
      if (!user) {
        console.warn('⚠️ [useFinanceCard] Usuário não encontrado')
        setDocuments([])
        setLoading(false)
        return
      }

      // ✅ Buscar documentos COM FILTRO de workspace para isolamento correto
      // Pessoal: workspace_id IS NULL
      // Colaborativo: workspace_id = currentWorkspace.id
      let query = supabase
        .from('finance_documents')
        .select('*')
        .eq('user_id', user.id)

      if (currentWorkspace?.id) {
        // Workspace colaborativo - filtrar pelo workspace específico
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        // Conta pessoal - filtrar onde workspace_id é null
        query = query.is('workspace_id', null)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      console.log('✅ [useFinanceCard] Documentos encontrados:', data?.length || 0)
      console.log('📊 [useFinanceCard] Workspace atual:', currentWorkspace?.id)

      if (error) {
        console.error('❌ [useFinanceCard] Erro na query:', error)
        throw error
      }

      console.log('✅ [useFinanceCard] Documentos encontrados:', data?.length || 0, data)
      setDocuments(data || [])
    } catch (err: any) {
      console.error('❌ [useFinanceCard] Erro ao carregar documentos:', err)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  return { documents, loading, refetch: fetchDocuments }
}
