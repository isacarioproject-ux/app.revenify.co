import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import type { DriveFile, TaskDriveAttachment } from '@/types/drive'
import { DriveService } from '@/services/google/drive.service'
import { toast } from 'sonner'

interface UseTaskDriveAttachmentsOptions {
  taskId: string
  autoLoad?: boolean
}

export function useTaskDriveAttachments({ taskId, autoLoad = true }: UseTaskDriveAttachmentsOptions) {
  const { currentWorkspace } = useWorkspace()
  const [attachments, setAttachments] = useState<TaskDriveAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [attaching, setAttaching] = useState(false)

  /**
   * Carregar anexos da task
   */
  const loadAttachments = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('task_drive_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('attached_at', { ascending: false })

      if (error) throw error
      setAttachments(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar anexos:', error)
      toast.error('Erro ao carregar anexos')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  /**
   * Anexar arquivos do Drive
   */
  const attachFiles = useCallback(async (driveFiles: DriveFile[]) => {
    if (!taskId) {
      toast.error('Tarefa não encontrada')
      return
    }

    setAttaching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Inserir todos os anexos
      const attachmentsToInsert = driveFiles.map(file => ({
        task_id: taskId,
        workspace_id: currentWorkspace?.id || null,
        user_id: user.id,
        drive_file_id: file.id,
        drive_file_name: file.name,
        drive_file_type: file.mimeType,
        drive_file_size: file.size || null,
        drive_file_url: file.webViewLink || null
      }))

      const { error } = await supabase
        .from('task_drive_attachments')
        .insert(attachmentsToInsert)

      if (error) throw error

      // Recarregar lista
      await loadAttachments()
      
      toast.success(`${driveFiles.length} arquivo(s) anexado(s)`)
    } catch (error) {
      console.error('❌ Erro ao anexar arquivos:', error)
      toast.error('Erro ao anexar arquivos')
    } finally {
      setAttaching(false)
    }
  }, [taskId, currentWorkspace, loadAttachments])

  /**
   * Remover anexo
   */
  const removeAttachment = useCallback(async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('task_drive_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error

      // Remover da lista local
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      
      toast.success('Anexo removido')
    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error)
      toast.error('Erro ao remover anexo')
    }
  }, [])

  /**
   * Abrir arquivo no Google Drive
   */
  const openInDrive = useCallback(async (driveFileId: string) => {
    try {
      const metadata = await DriveService.getFileMetadata(driveFileId)
      if (metadata.webViewLink) {
        window.open(metadata.webViewLink, '_blank')
      } else {
        toast.error('Link não disponível')
      }
    } catch (error) {
      console.error('❌ Erro ao abrir arquivo:', error)
      toast.error('Erro ao abrir arquivo')
    }
  }, [])

  // Auto-load na montagem
  useEffect(() => {
    if (autoLoad) {
      loadAttachments()
    }
  }, [autoLoad, loadAttachments])

  return {
    attachments,
    loading,
    attaching,
    attachFiles,
    removeAttachment,
    openInDrive,
    refresh: loadAttachments
  }
}
