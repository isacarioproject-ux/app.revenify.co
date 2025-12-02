import { GoogleAuthService } from './google-auth.service'

/**
 * 📧 Gmail Service
 * Integração com Gmail API para importar boletos e faturas
 */

export interface GmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  snippet: string
  hasAttachments: boolean
  labels: string[]
}

export interface GmailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
  data?: string // base64
}

export class GmailService {
  private static BASE_URL = 'https://gmail.googleapis.com/gmail/v1'

  /**
   * Buscar emails com filtro
   */
  static async searchMessages(query: string, workspaceId?: string): Promise<GmailMessage[]> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erro ao buscar mensagens')

      const data = await response.json()
      
      // Buscar detalhes de cada mensagem
      const messages = await Promise.all(
        (data.messages || []).map((msg: any) => this.getMessage(msg.id, workspaceId))
      )

      return messages.filter(Boolean) as GmailMessage[]
    } catch (error) {
      console.error('Erro ao buscar mensagens do Gmail:', error)
      throw error
    }
  }

  /**
   * Buscar detalhes de uma mensagem específica
   */
  static async getMessage(messageId: string, workspaceId?: string): Promise<GmailMessage | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erro ao buscar mensagem')

      const data = await response.json()
      
      // Extrair headers importantes
      const headers = data.payload.headers
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
      const from = headers.find((h: any) => h.name === 'From')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''

      // Verificar se tem anexos
      const hasAttachments = this.hasAttachments(data.payload)

      return {
        id: data.id,
        threadId: data.threadId,
        subject,
        from,
        date,
        snippet: data.snippet,
        hasAttachments,
        labels: data.labelIds || [],
      }
    } catch (error) {
      console.error('Erro ao buscar mensagem:', error)
      return null
    }
  }

  /**
   * Buscar anexos de uma mensagem
   */
  static async getAttachments(messageId: string, workspaceId?: string): Promise<GmailAttachment[]> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erro ao buscar mensagem')

      const data = await response.json()
      const attachments: GmailAttachment[] = []

      const extractAttachments = (part: any) => {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            attachmentId: part.body.attachmentId,
          })
        }

        if (part.parts) {
          part.parts.forEach(extractAttachments)
        }
      }

      extractAttachments(data.payload)

      return attachments
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
      return []
    }
  }

  /**
   * Download de anexo específico
   */
  static async downloadAttachment(
    messageId: string,
    attachmentId: string,
    workspaceId?: string
  ): Promise<string | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/users/me/messages/${messageId}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erro ao baixar anexo')

      const data = await response.json()
      return data.data // base64
    } catch (error) {
      console.error('Erro ao baixar anexo:', error)
      return null
    }
  }

  /**
   * Buscar boletos e faturas (emails com anexos PDF)
   */
  static async searchInvoices(workspaceId?: string): Promise<GmailMessage[]> {
    const queries = [
      'has:attachment filename:pdf (fatura OR boleto OR invoice OR cobrança)',
      'has:attachment filename:pdf subject:(pagamento OR vencimento)',
    ]

    const results = await Promise.all(
      queries.map((query) => this.searchMessages(query, workspaceId))
    )

    // Combinar e remover duplicatas
    const allMessages = results.flat()
    const uniqueMessages = Array.from(
      new Map(allMessages.map((msg) => [msg.id, msg])).values()
    )

    return uniqueMessages
  }

  /**
   * Adicionar label a uma mensagem
   */
  static async addLabel(
    messageId: string,
    labelName: string,
    workspaceId?: string
  ): Promise<boolean> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      // Primeiro, criar ou buscar label "ISACAR_PROCESSED"
      const labelId = await this.getOrCreateLabel(labelName, workspaceId)
      if (!labelId) {
        // Sem permissão para labels - ok, não é crítico
        console.warn('⚠️ Sem label disponível - continuando sem marcar mensagem')
        return true // Retornar sucesso mesmo assim
      }

      const response = await fetch(
        `${this.BASE_URL}/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addLabelIds: [labelId],
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Erro ao adicionar label:', error)
      return false
    }
  }

  /**
   * Criar ou buscar label
   */
  private static async getOrCreateLabel(
    labelName: string,
    workspaceId?: string
  ): Promise<string | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) return null

      // Buscar labels existentes
      const listResponse = await fetch(`${this.BASE_URL}/users/me/labels`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!listResponse.ok) throw new Error('Erro ao listar labels')

      const labels = await listResponse.json()
      const existing = labels.labels.find((l: any) => l.name === labelName)

      if (existing) return existing.id

      // Criar nova label
      const createResponse = await fetch(`${this.BASE_URL}/users/me/labels`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        }),
      })

      if (!createResponse.ok) {
        // 403 = sem permissão (precisa de gmail.modify, não apenas gmail.readonly)
        console.warn('⚠️ Sem permissão para criar labels (requer gmail.modify)')
        return null
      }

      const newLabel = await createResponse.json()
      return newLabel.id
    } catch (error) {
      console.error('Erro ao gerenciar labels:', error)
      // Retornar null silenciosamente - labels são opcionais
      return null
    }
  }

  /**
   * Verificar se payload tem anexos
   */
  private static hasAttachments(payload: any): boolean {
    if (payload.filename && payload.body.attachmentId) {
      return true
    }

    if (payload.parts) {
      return payload.parts.some((part: any) => this.hasAttachments(part))
    }

    return false
  }
}
