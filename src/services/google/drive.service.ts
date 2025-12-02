import { GoogleAuthService } from './google-auth.service'
import type { DriveFile, DriveListResponse } from '@/types/drive'

export class DriveService {
  private static BASE_URL = 'https://www.googleapis.com/drive/v3'

  /**
   * Listar arquivos do Drive
   */
  static async listFiles(options?: {
    folderId?: string
    pageSize?: number
    orderBy?: string
    query?: string
    pageToken?: string
  }): Promise<DriveListResponse> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const params = new URLSearchParams({
        pageSize: String(options?.pageSize || 20),
        fields: 'files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,webContentLink,thumbnailLink,parents),nextPageToken',
        orderBy: options?.orderBy || 'modifiedTime desc'
      })

      // Query para pasta específica
      let queryString = "trashed=false"
      
      if (options?.folderId) {
        queryString += ` and '${options.folderId}' in parents`
      }

      // Query de busca
      if (options?.query) {
        queryString += ` and name contains '${options.query}'`
      }

      params.append('q', queryString)

      if (options?.pageToken) {
        params.append('pageToken', options.pageToken)
      }

      const response = await fetch(`${this.BASE_URL}/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Erro ao listar arquivos: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Erro ao listar arquivos do Drive:', error)
      throw error
    }
  }

  /**
   * Obter metadados de um arquivo
   */
  static async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(
        `${this.BASE_URL}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,iconLink,webViewLink,webContentLink,thumbnailLink,parents`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao obter metadados: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Erro ao obter metadados:', error)
      throw error
    }
  }

  /**
   * Baixar arquivo
   */
  static async downloadFile(fileId: string): Promise<Blob> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(`${this.BASE_URL}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.status}`)
      }

      return response.blob()
    } catch (error) {
      console.error('❌ Erro ao baixar arquivo:', error)
      throw error
    }
  }

  /**
   * Criar pasta
   */
  static async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(`${this.BASE_URL}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : []
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao criar pasta: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Erro ao criar pasta:', error)
      throw error
    }
  }

  /**
   * Deletar arquivo
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(`${this.BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok && response.status !== 204) {
        throw new Error(`Erro ao deletar arquivo: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error)
      throw error
    }
  }

  /**
   * Renomear arquivo
   */
  static async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(`${this.BASE_URL}/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      })

      if (!response.ok) {
        throw new Error(`Erro ao renomear arquivo: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Erro ao renomear arquivo:', error)
      throw error
    }
  }

  /**
   * Mover arquivo para outra pasta
   */
  static async moveFile(fileId: string, newParentId: string): Promise<DriveFile> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      // Obter parents atuais
      const fileMetadata = await this.getFileMetadata(fileId)
      const previousParents = fileMetadata.parents?.join(',') || ''

      // Mover arquivo
      const response = await fetch(
        `${this.BASE_URL}/files/${fileId}?addParents=${newParentId}&removeParents=${previousParents}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao mover arquivo: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('❌ Erro ao mover arquivo:', error)
      throw error
    }
  }

  /**
   * Buscar arquivos
   */
  static async searchFiles(query: string, pageSize: number = 50): Promise<DriveListResponse> {
    return this.listFiles({ query, pageSize })
  }

  /**
   * Upload de arquivo (simples)
   */
  static async uploadFile(
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<DriveFile> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      // Metadata do arquivo
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : []
      }

      // Multipart upload
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100
              onProgress(progress)
            }
          })
        }

        // Complete
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload falhou: ${xhr.status}`))
          }
        })

        // Error
        xhr.addEventListener('error', () => {
          reject(new Error('Erro no upload'))
        })

        // Send - incluir fields para obter webViewLink
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,iconLink,createdTime,modifiedTime')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(form)
      })
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error)
      throw error
    }
  }

  /**
   * Exportar Google Doc como HTML
   */
  static async exportDocument(fileId: string, mimeType: string = 'text/html'): Promise<string> {
    try {
      const token = await GoogleAuthService.getAccessToken()
      if (!token) throw new Error('Token não disponível')

      const response = await fetch(
        `${this.BASE_URL}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao exportar documento: ${response.status}`)
      }

      return response.text()
    } catch (error) {
      console.error('❌ Erro ao exportar documento:', error)
      throw error
    }
  }
}
