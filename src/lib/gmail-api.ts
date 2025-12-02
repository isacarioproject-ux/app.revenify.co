/**
 * GMAIL API CLIENT
 * Funções para interagir com Gmail
 */

import { supabase } from './supabase'

interface GmailMessage {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  hasAttachment: boolean
  labels: string[]
}

/**
 * Obter tokens do Google (da integração)
 */
async function getGoogleTokens(workspaceId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar integração - primeiro tenta do workspace, depois pessoal
  let query = supabase
    .from('google_integrations')
    .select('access_token, refresh_token, token_expires_at')
    .eq('is_active', true)

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  } else {
    query = query.eq('user_id', user.id).is('workspace_id', null)
  }

  const { data, error } = await query.maybeSingle()

  // Fallback: se não encontrou no workspace, buscar pessoal
  if (!data && workspaceId) {
    const { data: personalData } = await supabase
      .from('google_integrations')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .is('workspace_id', null)
      .eq('is_active', true)
      .maybeSingle()
    
    if (personalData) {
      return personalData.access_token
    }
  }

  if (error || !data) {
    throw new Error('Google não conectado. Conecte nas configurações.')
  }

  return data.access_token
}

/**
 * Buscar emails financeiros (boletos, faturas, PIX, transferências, etc)
 */
export async function searchGmailForBills(
  workspaceId?: string,
  options?: {
    maxResults?: number
    daysBack?: number
    type?: 'all' | 'expense' | 'income'
  }
): Promise<GmailMessage[]> {
  const accessToken = await getGoogleTokens(workspaceId)

  const daysBack = options?.daysBack || 30
  const afterDate = new Date()
  afterDate.setDate(afterDate.getDate() - daysBack)
  const afterDateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/')

  // Termos de DESPESAS (boletos, faturas, cobranças)
  const expenseTerms = `
    (subject:(boleto OR fatura OR cobranca OR cobrança OR "nota fiscal" OR vencimento OR debito OR débito OR pagamento))
    OR (from:(cobranca OR cobrança OR fatura OR boleto OR nfe OR nfse))
  `

  // Termos de RECEITAS (PIX recebido, vendas, transferências)
  const incomeTerms = `
    (subject:("pix recebido" OR "transferencia recebida" OR "transferência recebida" OR "voce recebeu" OR "você recebeu" OR "deposito" OR "depósito" OR "venda realizada" OR "pagamento recebido" OR "credito" OR "crédito" OR "entrada" OR "recebimento"))
    OR (from:(nubank OR itau OR bradesco OR santander OR inter OR c6bank OR picpay OR mercadopago OR pagseguro OR stone OR cielo OR getnet OR rede))
  `

  // Montar query baseado no tipo
  let query = ''
  if (options?.type === 'expense') {
    query = `(${expenseTerms}) has:attachment after:${afterDateStr}`
  } else if (options?.type === 'income') {
    query = `(${incomeTerms}) after:${afterDateStr}`
  } else {
    // Buscar todos (padrão)
    query = `((${expenseTerms}) OR (${incomeTerms})) after:${afterDateStr}`
  }
  
  query = query.trim().replace(/\s+/g, ' ')

  const maxResults = options?.maxResults || 20

  try {
    // Buscar mensagens
    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?` +
      new URLSearchParams({
        q: query,
        maxResults: maxResults.toString()
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}` 
        }
      }
    )

    if (!searchResponse.ok) {
      throw new Error('Erro ao buscar emails')
    }

    const searchData = await searchResponse.json()

    if (!searchData.messages || searchData.messages.length === 0) {
      return []
    }

    // Buscar detalhes de cada mensagem
    const messages = await Promise.all(
      searchData.messages.map(async (msg: any) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}` 
            }
          }
        )

        const detail = await detailResponse.json()

        // Extrair headers
        const headers = detail.payload.headers
        const from = headers.find((h: any) => h.name === 'From')?.value || ''
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
        const date = headers.find((h: any) => h.name === 'Date')?.value || ''

        // Verificar anexos
        const hasAttachment = detail.payload.parts?.some(
          (part: any) => part.filename && part.filename.endsWith('.pdf')
        ) || false

        return {
          id: detail.id,
          threadId: detail.threadId,
          from,
          subject,
          snippet: detail.snippet || '',
          date,
          hasAttachment,
          labels: detail.labelIds || []
        }
      })
    )

    return messages
  } catch (error) {
    console.error('Erro ao buscar emails:', error)
    throw error
  }
}

/**
 * Obter mensagem completa do Gmail
 */
export async function getGmailMessage(
  workspaceId: string,
  messageId: string
): Promise<any> {
  const accessToken = await getGoogleTokens(workspaceId)

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}` 
      }
    }
  )

  if (!response.ok) {
    throw new Error('Erro ao obter mensagem')
  }

  return await response.json()
}

/**
 * Download de anexo (PDF) do Gmail
 */
export async function downloadGmailAttachment(
  workspaceId: string,
  messageId: string,
  attachmentId: string
): Promise<Blob> {
  const accessToken = await getGoogleTokens(workspaceId)

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}` 
      }
    }
  )

  if (!response.ok) {
    throw new Error('Erro ao baixar anexo')
  }

  const data = await response.json()

  // Decodificar base64url para blob
  const base64 = data.data.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: 'application/pdf' })
}

/**
 * Obter primeiro anexo PDF de um email
 */
export async function getFirstPdfAttachment(
  workspaceId: string,
  messageId: string
): Promise<{ filename: string; blob: Blob } | null> {
  const message = await getGmailMessage(workspaceId, messageId)

  // Procurar parte com PDF
  const parts = message.payload.parts || []
  
  for (const part of parts) {
    if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
      const blob = await downloadGmailAttachment(
        workspaceId,
        messageId,
        part.body.attachmentId
      )

      return {
        filename: part.filename,
        blob
      }
    }
  }

  return null
}

/**
 * Verificar se email já foi importado
 */
export async function isMessageImported(
  workspaceId: string,
  gmailMessageId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('imported_gmail_messages')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('gmail_message_id', gmailMessageId)
    .maybeSingle()

  return !!data
}
