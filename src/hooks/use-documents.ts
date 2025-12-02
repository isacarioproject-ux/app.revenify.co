import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Document, DocumentInsert, DocumentUpdate } from '@/types/database'

interface UseDocumentsReturn {
  documents: Document[]
  loading: boolean
  error: Error | null
  createDocument: (data: Omit<DocumentInsert, 'user_id'>) => Promise<Document | null>
  updateDocument: (id: string, data: DocumentUpdate) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  shareDocument: (id: string, userIds: string[]) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Busca documentos próprios + compartilhados
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setDocuments(data || [])
    } catch (err) {
      console.error('Erro ao buscar documentos:', err)
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }, [])

  // Create document
  const createDocument = useCallback(async (data: Omit<DocumentInsert, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const documentData: DocumentInsert = {
        ...data,
        user_id: user.id,
      }

      const { data: newDocument, error: insertError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()

      if (insertError) throw insertError

      // Atualizar lista local
      setDocuments((prev) => [newDocument, ...prev])
      
      return newDocument
    } catch (err) {
      console.error('Erro ao criar documento:', err)
      setError(err instanceof Error ? err : new Error('Erro ao criar documento'))
      return null
    }
  }, [])

  // Update document
  const updateDocument = useCallback(async (id: string, data: DocumentUpdate) => {
    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update(data)
        .eq('id', id)

      if (updateError) throw updateError

      // Atualizar lista local
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? { ...doc, ...data, updated_at: new Date().toISOString() }
            : doc
        )
      )

      return true
    } catch (err) {
      console.error('Erro ao atualizar documento:', err)
      setError(err instanceof Error ? err : new Error('Erro ao atualizar documento'))
      return false
    }
  }, [])

  // Delete document
  const deleteDocument = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Atualizar lista local
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))

      return true
    } catch (err) {
      console.error('Erro ao deletar documento:', err)
      setError(err instanceof Error ? err : new Error('Erro ao deletar documento'))
      return false
    }
  }, [])

  // Share document
  const shareDocument = useCallback(async (id: string, userIds: string[]) => {
    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          is_shared: userIds.length > 0,
          shared_with: userIds,
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Atualizar lista local
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                is_shared: userIds.length > 0,
                shared_with: userIds,
                updated_at: new Date().toISOString(),
              }
            : doc
        )
      )

      return true
    } catch (err) {
      console.error('Erro ao compartilhar documento:', err)
      setError(err instanceof Error ? err : new Error('Erro ao compartilhar documento'))
      return false
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          console.log('Realtime change:', payload)
          fetchDocuments() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    shareDocument,
    refetch: fetchDocuments,
  }
}
