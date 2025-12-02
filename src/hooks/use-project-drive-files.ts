import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import type { DriveFile, ProjectDriveFile } from '@/types/drive'
import { DriveService } from '@/services/google/drive.service'
import { toast } from 'sonner'

interface UseProjectDriveFilesOptions {
  projectId: string
  autoLoad?: boolean
}

export function useProjectDriveFiles({ projectId, autoLoad = true }: UseProjectDriveFilesOptions) {
  const { currentWorkspace } = useWorkspace()
  const [files, setFiles] = useState<ProjectDriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  /**
   * Carregar arquivos vinculados ao projeto
   */
  const loadFiles = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_drive_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar arquivos do projeto:', error)
      toast.error('Erro ao carregar arquivos')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  /**
   * Vincular arquivos do Drive ao projeto
   */
  const linkFiles = useCallback(async (driveFiles: DriveFile[]) => {
    if (!projectId) {
      toast.error('Projeto não encontrado')
      return
    }

    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Inserir todos os arquivos
      const filesToInsert = driveFiles.map(file => ({
        project_id: projectId,
        workspace_id: currentWorkspace?.id || null,
        user_id: user.id,
        drive_file_id: file.id,
        drive_file_name: file.name,
        drive_file_type: file.mimeType,
        drive_file_size: file.size || null,
        drive_file_url: file.webViewLink || null
      }))

      const { error } = await supabase
        .from('project_drive_files')
        .insert(filesToInsert)

      if (error) throw error

      // Recarregar lista
      await loadFiles()
      
      toast.success(`${driveFiles.length} arquivo(s) vinculado(s)`)
    } catch (error) {
      console.error('❌ Erro ao vincular arquivos:', error)
      toast.error('Erro ao vincular arquivos')
    } finally {
      setAdding(false)
    }
  }, [projectId, currentWorkspace, loadFiles])

  /**
   * Desvincular arquivo
   */
  const unlinkFile = useCallback(async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('project_drive_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      // Remover da lista local
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      toast.success('Arquivo desvinculado')
    } catch (error) {
      console.error('❌ Erro ao desvincular arquivo:', error)
      toast.error('Erro ao desvincular arquivo')
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
      loadFiles()
    }
  }, [autoLoad, loadFiles])

  return {
    files,
    loading,
    adding,
    linkFiles,
    unlinkFile,
    openInDrive,
    refresh: loadFiles
  }
}
