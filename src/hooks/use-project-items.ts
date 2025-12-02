import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'
import type { Project, ProjectUpdate } from '@/types/database'

// Tipos do banco de dados
type ProjectStatusDB = 'Planejamento' | 'Em andamento' | 'Concluído' | 'Pausado' | 'Cancelado'
type ProjectStatusKanban = 'pending' | 'active' | 'completed' | 'no-status'

export interface ProjectItem {
  id: string
  name: string
  sharedWith: string[]
  createdAt: string
  description: string
  isPrivate: boolean
  status: ProjectStatusKanban
  statusDB: ProjectStatusDB
  financeDocs: number
}

// Mapeamento: Banco → Kanban
const mapDBToKanban = (dbStatus: ProjectStatusDB | null): ProjectStatusKanban => {
  if (!dbStatus) return 'no-status'
  const mapping: Record<ProjectStatusDB, ProjectStatusKanban> = {
    'Planejamento': 'pending',
    'Em andamento': 'active',
    'Concluído': 'completed',
    'Pausado': 'no-status',
    'Cancelado': 'no-status',
  }
  return mapping[dbStatus] || 'no-status'
}

// Mapeamento: Kanban → Banco
const mapKanbanToDB = (kanbanStatus: ProjectStatusKanban): ProjectStatusDB => {
  const mapping: Record<ProjectStatusKanban, ProjectStatusDB> = {
    'pending': 'Planejamento',
    'active': 'Em andamento',
    'completed': 'Concluído',
    'no-status': 'Pausado',
  }
  return mapping[kanbanStatus]
}

export function useProjectItems(projectId: string) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [items, setItems] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar DOCUMENTOS deste projeto específico
  const loadItems = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Buscar DOCUMENTOS do projeto (project_documents)
      const { data: documentsData, error: documentsError } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (documentsError) throw documentsError

      // Para cada documento, contar documentos financeiros vinculados
      const transformedItems: ProjectItem[] = await Promise.all(
        (documentsData || []).map(async (doc: any) => {
          // Buscar count de finance_documents vinculados a ESTE DOCUMENTO específico
          const { count } = await supabase
            .from('finance_documents')
            .select('id', { count: 'exact', head: true })
            .eq('project_document_id', doc.id) // ← CORRIGIDO: vincula ao documento, não ao projeto
          
          return {
            id: doc.id,
            name: doc.name,
            sharedWith: doc.shared_with || [],
            createdAt: new Date(doc.created_at).toISOString().split('T')[0],
            description: doc.description || '',
            isPrivate: doc.is_private || false,
            status: mapDBToKanban(doc.status),
            statusDB: doc.status,
            financeDocs: count || 0,
          }
        })
      )

      setItems(transformedItems)
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error)
      toast.error('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }, [user, projectId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Atualizar status do documento
  const updateStatus = useCallback(async (itemId: string, newStatus: ProjectStatusKanban) => {
    if (!user) return

    try {
      const dbStatus = mapKanbanToDB(newStatus)
      
      const { error } = await supabase
        .from('project_documents')
        .update({ status: dbStatus })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      // Atualizar estado local
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, status: newStatus, statusDB: dbStatus }
            : item
        )
      )

      toast.success('Status atualizado!')
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }, [user])

  // Atualizar nome do documento
  const updateName = useCallback(async (itemId: string, newName: string) => {
    if (!user || !newName.trim()) return

    try {
      const { error } = await supabase
        .from('project_documents')
        .update({ name: newName })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, name: newName } : item
        )
      )
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error)
      toast.error('Erro ao atualizar nome')
    }
  }, [user])

  // Atualizar descrição
  const updateDescription = useCallback(async (itemId: string, newDescription: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('project_documents')
        .update({ description: newDescription })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, description: newDescription } : item
        )
      )
    } catch (error: any) {
      console.error('Erro ao atualizar descrição:', error)
      toast.error('Erro ao atualizar descrição')
    }
  }, [user])

  // Deletar documento
  const deleteItem = useCallback(async (itemId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      setItems(prev => prev.filter(item => item.id !== itemId))
      toast.success('Documento deletado!')
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error)
      toast.error('Erro ao deletar documento')
    }
  }, [user])

  // Criar novo documento
  const createItem = useCallback(async (status: ProjectStatusKanban = 'pending') => {
    if (!user) return

    try {
      const dbStatus = mapKanbanToDB(status)
      
      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          user_id: user.id,
          workspace_id: currentWorkspace?.id || null,
          name: 'Novo Documento',
          description: '',
          status: dbStatus,
          is_private: false,
          shared_with: [],
          finance_doc_count: 0,
        })
        .select()
        .single()

      if (error) throw error

      const newItem: ProjectItem = {
        id: data.id,
        name: data.name,
        sharedWith: [],
        createdAt: new Date(data.created_at).toISOString().split('T')[0],
        description: data.description || '',
        isPrivate: false,
        status: mapDBToKanban(data.status),
        statusDB: data.status,
        financeDocs: 0,
      }

      setItems(prev => [...prev, newItem])
      toast.success('Documento criado!')
    } catch (error: any) {
      console.error('Erro ao criar documento:', error)
      toast.error('Erro ao criar documento')
    }
  }, [user, currentWorkspace, projectId])

  return {
    items,
    loading,
    updateStatus,
    updateName,
    updateDescription,
    deleteItem,
    createItem,
    refresh: loadItems,
  }
}
