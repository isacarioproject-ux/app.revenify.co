import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'

interface Document {
  id: string
  name: string
  file_type: 'page' | 'pdf' | 'word' | 'excel' | 'image' | 'other'
  file_size: number
  created_at: string
  file_url: string
  parent_id: string | null
  icon: string | null
  project_id: string
}

interface DocumentWithChildren extends Document {
  children?: DocumentWithChildren[]
  level?: number
}

export const useDocsCard = (projectId?: string) => {
  const { currentWorkspace } = useWorkspace()
  const [documents, setDocuments] = useState<DocumentWithChildren[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [projectId, currentWorkspace])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      // Verificar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ Usuário não autenticado')
        setDocuments([])
        setLoading(false)
        return
      }

      let query = supabase
        .from('documents')
        .select('id, name, file_type, file_size, created_at, file_url, parent_id, icon, project_id')
        .order('created_at', { ascending: false })

      // Filtrar por projeto
      if (projectId) {
        query = query.eq('project_id', projectId)
      } else {
        query = query.is('project_id', null)
      }

      // ✅ Filtrar por workspace OU documentos pessoais
      if (currentWorkspace) {
        // Mostrar TODOS os documentos do workspace (RLS vai filtrar permissões)
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        // Apenas documentos pessoais (sem workspace)
        query = query.is('workspace_id', null).eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar documentos:', error)
        throw error
      }

      console.log('✅ Documentos carregados:', data?.length || 0)

      // Construir hierarquia
      const docsMap = new Map<string, DocumentWithChildren>()
      const rootDocs: DocumentWithChildren[] = []

      // Criar map de todos os docs
      data?.forEach((doc: Document) => {
        docsMap.set(doc.id, { ...doc, children: [], level: 0 })
      })

      // Construir árvore
      docsMap.forEach((doc) => {
        if (doc.parent_id && docsMap.has(doc.parent_id)) {
          const parent = docsMap.get(doc.parent_id)!
          doc.level = (parent.level || 0) + 1
          parent.children!.push(doc)
        } else {
          rootDocs.push(doc)
        }
      })

      setDocuments(rootDocs)
    } catch (err: any) {
      toast.error('Erro ao carregar documentos', {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return { documents, loading, refetch: fetchDocuments }
}
