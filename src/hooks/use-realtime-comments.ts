import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { realtimeManager } from '@/lib/realtime-manager';
import { toast } from 'sonner';

/**
 * 📡 Hook para ouvir mudanças em tempo real em comentários (tasks e documents)
 * 
 * @param workspaceId - ID do workspace para filtrar eventos (opcional para comments)
 * @param type - Tipo de comentário: 'task' ou 'document'
 * @param entityId - ID da task ou document para filtrar comentários
 * @param options - Configurações opcionais
 */

interface UseRealtimeCommentsOptions {
  /** Habilitar/desabilitar o realtime */
  enabled?: boolean;
  /** Mostrar notificações toast */
  showNotifications?: boolean;
  /** Callback chamado quando houver uma atualização */
  onUpdate?: () => void;
  /** Callback chamado quando um comentário for criado */
  onCommentCreated?: (comment: any) => void;
  /** Callback chamado quando um comentário for atualizado */
  onCommentUpdated?: (comment: any) => void;
  /** Callback chamado quando um comentário for deletado */
  onCommentDeleted?: (commentId: string) => void;
}

type RealtimePayload = RealtimePostgresChangesPayload<any>;

export function useRealtimeComments(
  type: 'task' | 'document',
  entityId: string | null,
  options: UseRealtimeCommentsOptions = {}
) {
  const {
    enabled = true,
    showNotifications = false, // Desabilitado por padrão para não poluir
    onUpdate,
    onCommentCreated,
    onCommentUpdated,
    onCommentDeleted,
  } = options;

  const tableName = type === 'task' ? 'task_comments' : 'document_comments';
  const filterColumn = type === 'task' ? 'task_id' : 'document_id';

  /**
   * 🆕 Handler para INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    const comment = payload.new as any;
    
    console.log(`💬 [useRealtimeComments:${type}] Novo comentário:`, {
      id: comment?.id,
      entityId: comment?.[filterColumn],
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onCommentCreated?.(comment);

    // Notificação (se habilitada)
    if (showNotifications) {
      toast.success('💬 Novo comentário adicionado', {
        duration: 2000,
      });
    }
  }, [onUpdate, onCommentCreated, showNotifications, type, filterColumn]);

  /**
   * 🔄 Handler para UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    const newComment = payload.new as any;
    
    console.log(`🔄 [useRealtimeComments:${type}] Comentário atualizado:`, {
      id: newComment?.id,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onCommentUpdated?.(newComment);

    // Notificação discreta (se habilitada)
    if (showNotifications) {
      toast.info('💬 Comentário atualizado', {
        duration: 2000,
      });
    }
  }, [onUpdate, onCommentUpdated, showNotifications, type]);

  /**
   * 🗑️ Handler para DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    const oldComment = payload.old as any;
    
    console.log(`🗑️ [useRealtimeComments:${type}] Comentário removido:`, {
      id: oldComment?.id,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onCommentDeleted?.(oldComment?.id);

    // Notificação (se habilitada)
    if (showNotifications) {
      toast.info('💬 Comentário removido', {
        duration: 2000,
      });
    }
  }, [onUpdate, onCommentDeleted, showNotifications, type]);

  /**
   * 🎯 Handler principal de eventos Realtime
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    console.log(`🎉 [useRealtimeComments:${type}] Evento recebido:`, {
      eventType: payload.eventType,
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
  }, [handleInsert, handleUpdate, handleDelete, type]);

  /**
   * 📡 Configurar subscrição Realtime
   */
  useEffect(() => {
    console.log(`🔍 [useRealtimeComments:${type}] useEffect executado`, {
      entityId,
      enabled,
    });

    if (!entityId) {
      console.warn(`⚠️ [useRealtimeComments:${type}] EntityId não fornecido`);
      return;
    }

    if (!enabled) {
      console.warn(`⚠️ [useRealtimeComments:${type}] Realtime desabilitado`);
      return;
    }

    const channelName = `${tableName}:${entityId}`;

    console.log(`✨ [useRealtimeComments:${type}] Iniciando subscrição`, {
      entityId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    // Subscrever no channel de comentários
    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: tableName,
      filter: `${filterColumn}=eq.${entityId}`,
      callback: (payload) => {
        console.log(`🎯 [useRealtimeComments:${type}] Callback disparado:`, payload.eventType);
        handleRealtimeEvent(payload);
      },
    });

    console.log(`📡 [useRealtimeComments:${type}] Subscrição criada`, {
      channelName,
      activeChannels: realtimeManager.getActiveChannelsCount(),
    });

    // Cleanup
    return () => {
      console.log(`🔌 [useRealtimeComments:${type}] Removendo subscrição`);
      realtimeManager.unsubscribe(channelName);
    };
  }, [entityId, enabled, handleRealtimeEvent, type, tableName, filterColumn]);

  return {
    isConnected: true,
  };
}
