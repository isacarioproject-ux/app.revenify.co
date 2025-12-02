import { useState, useCallback } from 'react'
import { useWorkspace } from '@/contexts/workspace-context'
import { searchGmailForBills, getFirstPdfAttachment, isMessageImported } from '@/lib/gmail-api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface GmailMessage {
  id: string
  from: string
  subject: string
  snippet: string
  date: string
  hasAttachment: boolean
  isImported?: boolean
}

export function useGmailImport() {
  const { currentWorkspace } = useWorkspace()
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)

  // Buscar emails com boletos
  const searchMessages = useCallback(async () => {
    setLoading(true)

    try {
      // Passa workspaceId como opcional - a API usa fallback para integração pessoal
      const results = await searchGmailForBills(currentWorkspace?.id, {
        maxResults: 20,
        daysBack: 30
      })

      // Verificar quais já foram importados
      const messagesWithStatus = await Promise.all(
        results.map(async (msg) => ({
          ...msg,
          isImported: currentWorkspace?.id 
            ? await isMessageImported(currentWorkspace.id, msg.id)
            : false
        }))
      )

      setMessages(messagesWithStatus)
      if (results.length === 0) {
        toast.info('Nenhum boleto encontrado nos últimos 30 dias')
      } else {
        toast.success(`${results.length} emails encontrados`)
      }
    } catch (error: any) {
      console.error('Erro ao buscar emails:', error)
      toast.error(error.message || 'Erro ao buscar emails do Gmail')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  // Importar email específico
  const importMessage = useCallback(async (
    messageId: string,
    data: {
      amount: number
      due_date: string
      category: string
      description?: string
    }
  ) => {
    if (!currentWorkspace?.id) return

    setImporting(messageId)

    try {
      // 1. Baixar PDF (se tiver)
      let attachmentUrl: string | null = null

      try {
        const attachment = await getFirstPdfAttachment(currentWorkspace.id, messageId)
        
        if (attachment) {
          // Upload para Supabase Storage
          const filename = `${currentWorkspace.id}/${messageId}/${attachment.filename}` 
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('finance-documents')
            .upload(filename, attachment.blob, {
              contentType: 'application/pdf',
              upsert: false
            })

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from('finance-documents')
            .getPublicUrl(filename)

          attachmentUrl = urlData.publicUrl
        }
      } catch (error) {
        console.warn('Erro ao baixar anexo (continuando):', error)
      }

      // 2. Obter dados do email
      const message = messages.find(m => m.id === messageId)

      // 3. Criar transação no Finance
      const { data: transaction, error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          workspace_id: currentWorkspace.id,
          type: 'expense',
          category: data.category,
          amount: data.amount,
          description: data.description || message?.subject || 'Importado do Gmail',
          due_date: data.due_date,
          status: 'pending',
          metadata: {
            source: 'gmail',
            gmail_message_id: messageId,
            from: message?.from,
            subject: message?.subject,
            attachment_url: attachmentUrl
          }
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // 4. Registrar importação
      await supabase
        .from('imported_gmail_messages')
        .insert({
          workspace_id: currentWorkspace.id,
          gmail_message_id: messageId,
          transaction_id: transaction.id,
          from_email: message?.from,
          subject: message?.subject,
          received_date: new Date(message?.date || '').toISOString(),
          amount: data.amount,
          due_date: data.due_date,
          category: data.category,
          attachment_url: attachmentUrl
        })

      // 5. Atualizar lista
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, isImported: true } : m)
      )

      toast.success('Boleto importado com sucesso!')
      return transaction

    } catch (error: any) {
      console.error('Erro ao importar:', error)
      toast.error('Erro ao importar boleto')
      throw error
    } finally {
      setImporting(null)
    }
  }, [currentWorkspace?.id, messages])

  return {
    messages,
    loading,
    importing,
    searchMessages,
    importMessage
  }
}
