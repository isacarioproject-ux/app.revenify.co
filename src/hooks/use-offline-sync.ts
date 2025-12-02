import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { i18n } from '@/lib/i18n'

interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
}

interface UseOfflineSyncReturn {
  isOnline: boolean
  isSyncing: boolean
  pendingActions: number
  syncNow: () => Promise<void>
}

const OFFLINE_QUEUE_KEY = 'isacar_offline_queue'
const CACHE_PREFIX = 'isacar_cache_'

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingActions, setPendingActions] = useState(0)

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success(i18n.translate('finance.offline.restored'))
      syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning(i18n.translate('finance.offline.warning'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar ações pendentes
  useEffect(() => {
    const queue = getOfflineQueue()
    setPendingActions(queue.length)
  }, [])

  // Sincronizar dados offline
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return

    const queue = getOfflineQueue()
    if (queue.length === 0) return

    setIsSyncing(true)

    try {
      for (const action of queue) {
        await executeAction(action)
      }

      // Limpar fila após sincronização bem-sucedida
      localStorage.removeItem(OFFLINE_QUEUE_KEY)
      setPendingActions(0)
      toast.success(i18n.translate('finance.offline.syncSuccess', { count: queue.length }))
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast.error(i18n.translate('finance.offline.syncError'))
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  return {
    isOnline,
    isSyncing,
    pendingActions,
    syncNow,
  }
}

// Funções auxiliares
function getOfflineQueue(): OfflineAction[] {
  const queue = localStorage.getItem(OFFLINE_QUEUE_KEY)
  return queue ? JSON.parse(queue) : []
}

function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue()
  const newAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  queue.push(newAction)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

async function executeAction(action: OfflineAction) {
  const { type, table, data } = action

  switch (type) {
    case 'create':
      await supabase.from(table).insert(data)
      break
    case 'update':
      await supabase.from(table).update(data).eq('id', data.id)
      break
    case 'delete':
      await supabase.from(table).delete().eq('id', data.id)
      break
  }
}

// Cache de dados para acesso offline
export function cacheData(key: string, data: any) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error('Erro ao cachear dados:', error)
  }
}

export function getCachedData<T>(key: string, maxAge: number = 5 * 60 * 1000): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp

    if (age > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return data as T
  } catch (error) {
    console.error('Erro ao recuperar cache:', error)
    return null
  }
}

export function clearCache(key?: string) {
  if (key) {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`)
  } else {
    // Limpar todo o cache
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k)
      }
    })
  }
}

// Wrapper para operações do Supabase com suporte offline
export async function offlineSupabaseOperation<T>(
  operation: () => Promise<T>,
  offlineAction: Omit<OfflineAction, 'id' | 'timestamp'>
): Promise<T> {
  if (navigator.onLine) {
    return await operation()
  } else {
    addToOfflineQueue(offlineAction)
    toast.info(i18n.translate('finance.offline.saved'))
    return null as T
  }
}
