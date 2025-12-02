import { useState, useCallback, useEffect } from 'react'
import { DriveService } from '@/services/google/drive.service'
import type { DriveFile } from '@/types/drive'
import { toast } from 'sonner'

interface UseDriveOptions {
  folderId?: string
  autoLoad?: boolean
}

export function useDrive(options: UseDriveOptions = {}) {
  const { folderId, autoLoad = true } = options

  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Carregar arquivos
   */
  const loadFiles = useCallback(async (searchQuery?: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await DriveService.listFiles({
        folderId,
        query: searchQuery,
        pageSize: 50
      })
      setFiles(response.files)
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('Erro ao carregar arquivos do Drive')
      console.error('Erro ao carregar arquivos:', err)
    } finally {
      setLoading(false)
    }
  }, [folderId])

  /**
   * Upload de arquivo
   */
  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)
    try {
      const result = await DriveService.uploadFile(file, folderId, (progress) => {
        setUploadProgress(progress)
      })
      
      // Recarregar lista
      await loadFiles()
      
      toast.success('Arquivo enviado com sucesso!')
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('Erro ao enviar arquivo')
      console.error('Erro no upload:', err)
      throw err
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [folderId, loadFiles])

  /**
   * Deletar arquivo
   */
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await DriveService.deleteFile(fileId)
      
      // Remover da lista local
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      toast.success('Arquivo deletado')
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('Erro ao deletar arquivo')
      console.error('Erro ao deletar:', err)
      throw err
    }
  }, [])

  /**
   * Renomear arquivo
   */
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      const updated = await DriveService.renameFile(fileId, newName)
      
      // Atualizar na lista local
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f))
      
      toast.success('Arquivo renomeado')
      return updated
    } catch (err) {
      const error = err as Error
      setError(error)
      toast.error('Erro ao renomear arquivo')
      console.error('Erro ao renomear:', err)
      throw err
    }
  }, [])

  /**
   * Buscar arquivos
   */
  const searchFiles = useCallback(async (query: string) => {
    await loadFiles(query)
  }, [loadFiles])

  /**
   * Refresh
   */
  const refresh = useCallback(() => {
    loadFiles()
  }, [loadFiles])

  // Auto-load na montagem
  useEffect(() => {
    if (autoLoad) {
      loadFiles()
    }
  }, [autoLoad, loadFiles])

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    error,
    uploadFile,
    deleteFile,
    renameFile,
    searchFiles,
    refresh,
    loadFiles
  }
}
