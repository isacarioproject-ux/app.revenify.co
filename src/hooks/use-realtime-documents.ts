import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { realtimeManager } from '@/lib/realtime-manager';
import { toast } from 'sonner';

/**
 * 📡 Hook para ouvir mudanças em tempo real na tabela de documentos
 * 
 * @param workspaceId - ID do workspace para filtrar eventos
 * @param options - Configurações opcionais
 */

interface UseRealtimeDocumentsOptions {
  /** Habilitar/desabilitar o realtime */
  enabled?: boolean;
  /** Mostrar notificações toast */
  showNotifications?: boolean;
  /** Callback chamado quando houver uma atualização */
  onUpdate?: () => void;
  /** Callback chamado quando um documento for criado */
  onDocumentCreated?: (document: any) => void;
  /** Callback chamado quando um documento for atualizado */
  onDocumentUpdated?: (document: any) => void;
  /** Callback chamado quando um documento for deletado */
  onDocumentDeleted?: (documentId: string) => void;
}

type RealtimePayload = RealtimePostgresChangesPayload<any>;

export function useRealtimeDocuments(
  workspaceId: string | null,
  options: UseRealtimeDocumentsOptions = {}
) {
  const {
    enabled = true,
    showNotifications = true,
    onUpdate,
    onDocumentCreated,
    onDocumentUpdated,
    onDocumentDeleted,
  } = options;

  /**
   * 🆕 Handler para INSERT
   */
  const handleInsert = useCallback((payload: RealtimePayload) => {
    const document = payload.new as any;
    
    console.log('📄 [useRealtimeDocuments] Novo documento:', {
      id: document?.id,
      name: document?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onDocumentCreated?.(document);

    // Notificação
    if (showNotifications) {
      const docName = document?.name || 'Documento';
      toast.success(`📄 ${docName} foi criado`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onDocumentCreated, showNotifications]);

  /**
   * 🔄 Handler para UPDATE
   */
  const handleUpdate = useCallback((payload: RealtimePayload) => {
    const newDoc = payload.new as any;
    const oldDoc = payload.old as any;
    
    console.log('🔄 [useRealtimeDocuments] Documento atualizado:', {
      id: newDoc?.id,
      name: newDoc?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onDocumentUpdated?.(newDoc);

    // Notificação discreta (apenas para mudanças significativas)
    if (showNotifications && oldDoc?.name !== newDoc?.name) {
      toast.info(`📄 ${newDoc?.name} foi atualizado`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onDocumentUpdated, showNotifications]);

  /**
   * 🗑️ Handler para DELETE
   */
  const handleDelete = useCallback((payload: RealtimePayload) => {
    const oldDoc = payload.old as any;
    
    console.log('🗑️ [useRealtimeDocuments] Documento removido:', {
      id: oldDoc?.id,
      name: oldDoc?.name,
    });

    // Atualizar UI
    onUpdate?.();

    // Callback específico
    onDocumentDeleted?.(oldDoc?.id);

    // Notificação
    if (showNotifications) {
      const docName = oldDoc?.name || 'Documento';
      toast.info(`📄 ${docName} foi removido`, {
        duration: 2000,
      });
    }
  }, [onUpdate, onDocumentDeleted, showNotifications]);

  /**
   * 🎯 Handler principal de eventos Realtime
   */
  const handleRealtimeEvent = useCallback((payload: RealtimePayload) => {
    const doc = (payload.new || payload.old) as any;
    
    console.log('🎉 [useRealtimeDocuments] Evento recebido:', {
      eventType: payload.eventType,
      id: doc?.id,
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
    console.log('🔍 [useRealtimeDocuments] useEffect executado', {
      workspaceId,
      enabled,
    });

    if (!workspaceId) {
      console.warn('⚠️ [useRealtimeDocuments] WorkspaceId não fornecido');
      return;
    }

    if (!enabled) {
      console.warn('⚠️ [useRealtimeDocuments] Realtime desabilitado');
      return;
    }

    const channelName = `documents:${workspaceId}`;

    console.log('✨ [useRealtimeDocuments] Iniciando subscrição', {
      workspaceId,
      channelName,
      timestamp: new Date().toISOString(),
    });

    // Subscrever no channel de documentos
    realtimeManager.subscribe(channelName, {
      event: '*',
      schema: 'public',
      table: 'documents',
      filter: `workspace_id=eq.${workspaceId}`,
      callback: (payload) => {
        console.log('🎯 [useRealtimeDocuments] Callback disparado:', payload.eventType);
        handleRealtimeEvent(payload);
      },
    });

    console.log('📡 [useRealtimeDocuments] Subscrição criada', {
      channelName,
      activeChannels: realtimeManager.getActiveChannelsCount(),
    });

    // Cleanup
    return () => {
      console.log('🔌 [useRealtimeDocuments] Removendo subscrição');
      realtimeManager.unsubscribe(channelName);
    };
  }, [workspaceId, enabled, handleRealtimeEvent]);

  return {
    isConnected: true,
  };
}
