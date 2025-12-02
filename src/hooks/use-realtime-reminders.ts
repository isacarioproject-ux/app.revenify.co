import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { realtimeManager } from '@/lib/realtime-manager';
import { toast } from 'sonner';

/**
 * 📡 Hook para ouvir mudanças em tempo real na tabela de lembretes
 * 
 * @param workspaceId - ID do workspace para filtrar eventos
 * @param options - Configurações opcionais
 */

interface UseRealtimeRemindersOptions {
  /** Habilitar/desabilitar o realtime */
  enabled?: boolean;
  /** Mostrar notificações toast */
  showNotifications?: boolean;
  /** Callback chamado quando houver uma atualização */
  onUpdate?: () => void;
  /** Callback chamado quando um lembrete for criado */
  onReminderCreated?: (reminder: any) => void;
  /** Callback chamado quando um lembrete for atualizado */
  onReminderUpdated?: (reminder: any) => void;
  /** Callback chamado quando um lembrete for deletado */
  onReminderDeleted?: (reminderId: string) => void;
}

type RealtimePayload = RealtimePostgresChangesPayload<any>;

export function useRealtimeReminders(
  workspaceId: string | null,
  options: UseRealtimeRemindersOptions = {}
) {
  const {
    enabled = true,
    showNotifications = true,
    onUpdate,
    onReminderCreated,
    onReminderUpdated,
    onReminderDeleted,
  } = options;

  /**
   * 🆕 Handler para INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    const reminder = payload.new as any;
    
    console.log('⏰ [useRealtimeReminders] Novo lembrete:', {
      id: reminder?.id,
      title: reminder?.title,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onReminderCreated?.(reminder);

    // Notificação
    if (showNotifications) {
      const reminderTitle = reminder?.title || 'Lembrete';
      toast.success(`⏰ ${reminderTitle} foi criado`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onReminderCreated, showNotifications]);

  /**
   * 🔄 Handler para UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    const newRem = payload.new as any;
    const oldRem = payload.old as any;
    
    console.log('🔄 [useRealtimeReminders] Lembrete atualizado:', {
      id: newRem?.id,
      title: newRem?.title,
      status: newRem?.status,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onReminderUpdated?.(newRem);

    // Notificação apenas para mudanças de status
    if (showNotifications && oldRem?.status !== newRem?.status) {
      const statusMessages: Record<string, string> = {
        completed: '✅ Lembrete concluído',
        cancelled: '❌ Lembrete cancelado',
        snoozed: '💤 Lembrete adiado',
        active: '⏰ Lembrete reativado',
      };
      
      const message = statusMessages[newRem?.status] || '🔄 Lembrete atualizado';
      toast.info(message, {
        duration: 2000,
      });
    }
  }, [onUpdate, onReminderUpdated, showNotifications]);

  /**
   * 🗑️ Handler para DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    const oldRem = payload.old as any;
    
    console.log('🗑️ [useRealtimeReminders] Lembrete removido:', {
      id: oldRem?.id,
      title: oldRem?.title,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onReminderDeleted?.(oldRem?.id);

    // Notificação
    if (showNotifications) {
      const reminderTitle = oldRem?.title || 'Lembrete';
      toast.info(`⏰ ${reminderTitle} foi removido`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onReminderDeleted, showNotifications]);

  /**
   * 🎯 Handler principal de eventos Realtime
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    const rem = (payload.new || payload.old) as any;
    
    console.log('🎉 [useRealtimeReminders] Evento recebido:', {
      eventType: payload.eventType,
      id: rem?.id,
    });

    switch (payload.eventType) {
      case 'INSERT':
        handleInsert(payload);
        break;
      case 'UPDATE':
        handleUpdate(payload);
        break;
      case 'DELETE':
        handleDelete(payload);
        break;
    }
  }, [handleInsert, handleUpdate, handleDelete]);

  /**
   * 📡 Configurar subscrição Realtime
   */
  useEffect(() => {
    console.log('🔍 [useRealtimeReminders] useEffect executado', {
      workspaceId,
      enabled,
    });

    if (!workspaceId) {
      console.warn('⚠️ [useRealtimeReminders] WorkspaceId não fornecido');
      return;
    }

    if (!enabled) {
      console.warn('⚠️ [useRealtimeReminders] Realtime desabilitado');
      return;
    }

    const channelName = `reminders:${workspaceId}`;

    console.log('✨ [useRealtimeReminders] Iniciando subscrição', {
      workspaceId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    // Subscrever no channel de lembretes
    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: 'reminders',
      filter: `workspace_id=eq.${workspaceId}`,
      callback: (payload) => {
        console.log('🎯 [useRealtimeReminders] Callback disparado:', payload.eventType);
        handleRealtimeEvent(payload);
      },
    });

    console.log('📡 [useRealtimeReminders] Subscrição criada', {
      channelName,
      activeChannels: realtimeManager.getActiveChannelsCount(),
    });

    // Cleanup
    return () => {
      console.log('🔌 [useRealtimeReminders] Removendo subscrição');
      realtimeManager.unsubscribe(channelName);
    };
  }, [workspaceId, enabled, handleRealtimeEvent]);

  return {
    isConnected: true,
  };
}
