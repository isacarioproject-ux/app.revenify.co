import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'

export interface RecentActivity {
  id: string
  type: 'task' | 'document' | 'finance' | 'project' | 'member' | 'whiteboard'
  action: 'created' | 'updated' | 'completed' | 'deleted'
  user_name: string
  user_id: string
  details: string
  entity_name: string
  created_at: string
  metadata?: any
}

export const useRecentActivities = (limit: number = 50) => {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { currentWorkspace } = useWorkspace()

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const allActivities: RecentActivity[] = []

        // 1. TAREFAS (tasks) - apenas do usuário logado
        const tasksQuery = supabase
          .from('tasks')
          .select('id, title, status, created_at, updated_at, created_by, completed_at')
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false })
          .limit(20)

        if (currentWorkspace?.id) {
          tasksQuery.eq('workspace_id', currentWorkspace.id)
        } else {
          tasksQuery.is('workspace_id', null)
        }

        const { data: tasks } = await tasksQuery

        if (tasks) {
          tasks.forEach(task => {
            // Criação
            allActivities.push({
              id: `task-created-${task.id}`,
              type: 'task',
              action: 'created',
              user_name: 'Você',
              user_id: user.id,
              details: 'criou a tarefa',
              entity_name: task.title,
              created_at: task.created_at,
            })

            // Conclusão (se completed)
            if (task.completed_at && task.status === 'completed') {
              allActivities.push({
                id: `task-completed-${task.id}`,
                type: 'task',
                action: 'completed',
                user_name: 'Você',
                user_id: user.id,
                details: 'concluiu a tarefa',
                entity_name: task.title,
                created_at: task.completed_at,
              })
            }
          })
        }

        // 2. DOCUMENTOS FINANCEIROS (finance_documents) - apenas do usuário logado
        const financeQuery = supabase
          .from('finance_documents')
          .select('id, name, created_at, updated_at, user_id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(15)

        if (currentWorkspace?.id) {
          financeQuery.eq('workspace_id', currentWorkspace.id)
        } else {
          financeQuery.is('workspace_id', null)
        }

        const { data: finances } = await financeQuery

        if (finances) {
          finances.forEach(doc => {
            allActivities.push({
              id: `finance-${doc.id}`,
              type: 'finance',
              action: 'created',
              user_name: 'Você',
              user_id: user.id,
              details: 'criou documento financeiro',
              entity_name: doc.name,
              created_at: doc.created_at,
            })
          })
        }

        // 3. PROJETOS (projects) - apenas do usuário logado
        const projectsQuery = supabase
          .from('projects')
          .select('id, name, created_at, updated_at, user_id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(10)

        if (currentWorkspace?.id) {
          projectsQuery.eq('workspace_id', currentWorkspace.id)
        } else {
          projectsQuery.is('workspace_id', null)  // ✅ Modo Pessoal
        }

        const { data: projects } = await projectsQuery

        if (projects) {
          projects.forEach(project => {
            allActivities.push({
              id: `project-${project.id}`,
              type: 'project',
              action: 'created',
              user_name: 'Você',
              user_id: user.id,
              details: 'criou o projeto',
              entity_name: project.name,
              created_at: project.created_at,
            })
          })
        }

        // 4. TRANSAÇÕES FINANCEIRAS (finance_transactions) - apenas do usuário logado
        // Buscar via finance_documents para filtrar por user_id
        const transactionsQuery = supabase
          .from('finance_transactions')
          .select(`
            id, 
            description, 
            type, 
            amount, 
            created_at,
            finance_documents!inner(user_id)
          `)
          .eq('finance_documents.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        const { data: transactions } = await transactionsQuery

        if (transactions) {
          transactions.forEach(trans => {
            const actionText = trans.type === 'income' ? 'registrou receita' : 'registrou despesa'
            allActivities.push({
              id: `transaction-${trans.id}`,
              type: 'finance',
              action: 'created',
              user_name: 'Você',
              user_id: user.id,
              details: actionText,
              entity_name: trans.description || 'Sem descrição',
              created_at: trans.created_at,
              metadata: { amount: trans.amount, type: trans.type }
            })
          })
        }

        // 5. EMPRESAS (companies) - apenas do usuário logado
        const companiesQuery = supabase
          .from('companies')
          .select('id, name, created_by, created_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (currentWorkspace?.id) {
          companiesQuery.eq('workspace_id', currentWorkspace.id)
        } else {
          companiesQuery.is('workspace_id', null)  // ✅ Modo Pessoal
        }

        const { data: companies } = await companiesQuery

        if (companies) {
          companies.forEach(company => {
            allActivities.push({
              id: `company-${company.id}`,
              type: 'project', // Usa ícone de projeto (FolderKanban)
              action: 'created',
              user_name: 'Você',
              user_id: company.created_by || user.id,
              details: 'criou a empresa',
              entity_name: company.name,
              created_at: company.created_at,
            })
          })
        }

        // Ordenar tudo por data (mais recente primeiro)
        const sortedActivities = allActivities
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit)

        setActivities(sortedActivities)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [currentWorkspace?.id, limit])

  return { activities, loading, refetch: () => {} }
}
