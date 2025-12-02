import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'

export interface FinanceDocumentItem {
  id: string
  name: string
  template_type: string
  project_id: string | null
  project_document_id: string | null
  created_at: string
}

export function useFinanceDocuments(projectDocumentId?: string) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [documents, setDocuments] = useState<FinanceDocumentItem[]>([])
  const [loading, setLoading] = useState(false)

  // Buscar documentos financeiros (todos ou por projeto)
  const loadDocuments = useCallback(async (searchQuery?: string) => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('finance_documents')
        .select('id, name, template_type, project_id, project_document_id, created_at')
        .eq('user_id', user.id)

      // Filtrar por workspace se houver
      if (currentWorkspace?.id) {
        query = query.eq('workspace_id', currentWorkspace.id)
      }

      // Se tem projectDocumentId, buscar apenas os vinculados
      if (projectDocumentId) {
        query = query.eq('project_document_id', projectDocumentId)
      }

      // Se tem searchQuery, filtrar por nome
      if (searchQuery && searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setDocuments(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar documentos financeiros:', error)
      toast.error('Erro ao carregar documentos financeiros')
    } finally {
      setLoading(false)
    }
  }, [user, currentWorkspace, projectDocumentId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Vincular documento ao document de projeto
  const linkToProjectDocument = useCallback(async (documentId: string, newProjectDocumentId: string, newProjectId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('finance_documents')
        .update({ 
          project_document_id: newProjectDocumentId,
          project_id: newProjectId // Manter referência ao projeto pai
        })
        .eq('id', documentId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Documento vinculado!')
      loadDocuments()
    } catch (error: any) {
      console.error('Erro ao vincular documento:', error)
      toast.error('Erro ao vincular documento')
    }
  }, [user, loadDocuments])

  // Desvincular documento do project document
  const unlinkFromProjectDocument = useCallback(async (documentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('finance_documents')
        .update({ 
          project_document_id: null,
          project_id: null 
        })
        .eq('id', documentId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Documento desvinculado!')
      loadDocuments()
    } catch (error: any) {
      console.error('Erro ao desvincular documento:', error)
      toast.error('Erro ao desvincular documento')
    }
  }, [user, loadDocuments])

  // Buscar documentos disponíveis (sem projeto vinculado)
  const searchAvailable = useCallback(async (searchQuery: string) => {
    if (!user) return []

    try {
      let query = supabase
        .from('finance_documents')
        .select('id, name, template_type, project_id, project_document_id, created_at')
        .eq('user_id', user.id)
        .is('project_document_id', null)

      if (currentWorkspace?.id) {
        query = query.eq('workspace_id', currentWorkspace.id)
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`)
      }

      query = query.order('created_at', { ascending: false }).limit(10)

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar documentos:', error)
      return []
    }
  }, [user, currentWorkspace])

  return {
    documents,
    loading,
    loadDocuments,
    linkToProjectDocument,
    unlinkFromProjectDocument,
    searchAvailable,
  }
}
