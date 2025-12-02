import { useEffect, useCallback } from 'react'
import { realtimeManager } from '@/lib/realtime-manager'
import { toast } from 'sonner'
import { useI18n } from './use-i18n'

/**
 * Tipos de eventos do Supabase Realtime
 */
type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Payload do evento Realtime
 */
interface RealtimePayload {
  eventType: RealtimeEvent
  new: any
  old: any
  table: string
}

/**
 * Props do hook useRealtimeTasks
 */
interface UseRealtimeTasksProps {
  workspaceId: string | null
  onUpdate: () => void
  showNotifications?: boolean
  enabled?: boolean
}

/**
 * Hook para sincronização em tempo real de Tasks
 * 
 * Funcionalidades:
 * - Escuta mudanças na tabela tasks do Supabase
 * - Filtra por workspace
 * - Notifica usuário de mudanças
 * - Atualiza UI automaticamente
 * - Cleanup automático
 * 
 * @example
 * ```tsx
 * const TasksCard = () => {
 *   const { refetch } = useTasks()
 *   
 *   useRealtimeTasks({
 *     workspaceId,
 *     onUpdate: refetch,
 *     showNotifications: true
 *   })
 *   
 *   return <div>...</div>
 * }
 * ```
 */
export function useRealtimeTasks({
  workspaceId,
  onUpdate,
  showNotifications = true,
  enabled = true,
}: UseRealtimeTasksProps) {
  const { t } = useI18n()

  /**
   * Processa eventos de INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    const task = payload.new
    
    if (showNotifications) {
      toast.info('Nova tarefa criada', {
        description: task.title || 'Tarefa sem título',
        duration: 2000,
      })
    }

    // Atualizar UI
    onUpdate()
  }, [onUpdate, showNotifications])

  /**
   * Processa eventos de UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    const task = payload.new
    const oldTask = payload.old

    // Verificar se foi completada
    const wasCompleted = !oldTask.completed_at && task.completed_at

    if (showNotifications) {
      if (wasCompleted) {
        toast.success('Tarefa completada', {
          description: task.title || 'Tarefa sem título',
          duration: 2000,
        })
      } else {
        toast.info('Tarefa atualizada', {
          description: task.title || 'Tarefa sem título',
          duration: 2000,
        })
      }
    }

    // Atualizar UI
    onUpdate()
  }, [onUpdate, showNotifications])

  /**
   * Processa eventos de DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    const task = payload.old

    if (showNotifications) {
      toast.error('Tarefa removida', {
        description: task.title || 'Tarefa sem título',
        duration: 2000,
      })
    }

    // Atualizar UI
    onUpdate()
  }, [onUpdate, showNotifications])

  /**
   * Callback unificado para todos os eventos
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    switch (payload.eventType) {
      case 'INSERT':
        handleInsert(payload)
        break
      case 'UPDATE':
        handleUpdate(payload)
        break
      case 'DELETE':
        handleDelete(payload)
        break
    }
  }, [handleInsert, handleUpdate, handleDelete])

  /**
   * Configurar subscrição Realtime
   */
  useEffect(() => {
    console.log('🔍 [useRealtimeTasks] useEffect executado', {
      workspaceId,
      enabled,
      hasCallback: !!handleRealtimeEvent,
    })

    // Não fazer nada se estiver desabilitado
    if (!enabled) {
      console.warn('⚠️ [useRealtimeTasks] Realtime desabilitado via props')
      return
    }

    // Permitir workspaceId null para tarefas pessoais
    const channelName = workspaceId ? `tasks:${workspaceId}` : 'tasks:personal'

    console.log('✨ [useRealtimeTasks] Iniciando subscrição', {
      workspaceId: workspaceId || 'personal',
      channelName,
      showNotifications,
      timestamp: new Date().toISOString(),
    })

    // Subscrever no channel
    const channel = realtimeManager.subscribe(channelName, {
      event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'tasks',
      filter: workspaceId ? `workspace_id=eq.${workspaceId}` : 'workspace_id=is.null', // ✨ Suportar tarefas pessoais
      callback: (payload) => {
        console.log('🎯 [useRealtimeTasks] Callback disparado!', {
          eventType: payload.eventType,
          table: payload.table,
          hasNew: !!payload.new,
          hasOld: !!payload.old,
        })
        handleRealtimeEvent(payload)
      },
    })

    console.log('📡 [useRealtimeTasks] Subscrição criada', {
      channelName,
      activeChannels: realtimeManager.getActiveChannelsCount(),
    })

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 [useRealtimeTasks] Removendo subscrição', { 
        channelName,
        timestamp: new Date().toISOString(),
      })
      realtimeManager.unsubscribe(channelName)
    }
  }, [workspaceId, enabled, handleRealtimeEvent, showNotifications])

  // Hook não retorna nada - é apenas side-effect
  return null
}

/**
 * Hook para sincronização de comentários em tempo real
 */
export function useRealtimeTaskComments({
  taskId,
  onUpdate,
  enabled = true,
}: {
  taskId: string | null
  onUpdate: () => void
  enabled?: boolean
}) {
  useEffect(() => {
    if (!taskId || !enabled) return

    const channelName = `task_comments:${taskId}`

    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: 'task_comments',
      filter: `task_id=eq.${taskId}`,
      callback: () => {
        onUpdate()
      },
    })

    return () => {
      realtimeManager.unsubscribe(channelName)
    }
  }, [taskId, enabled, onUpdate])
}

/**
 * Hook para sincronização de atividades em tempo real
 */
export function useRealtimeTaskActivities({
  taskId,
  onUpdate,
  enabled = true,
}: {
  taskId: string | null
  onUpdate: () => void
  enabled?: boolean
}) {
  useEffect(() => {
    if (!taskId || !enabled) return

    const channelName = `task_activities:${taskId}`

    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: 'task_activities',
      filter: `task_id=eq.${taskId}`,
      callback: () => {
        onUpdate()
      },
    })

    return () => {
      realtimeManager.unsubscribe(channelName)
    }
  }, [taskId, enabled, onUpdate])
}
