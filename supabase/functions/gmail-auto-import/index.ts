import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 🤖 Gmail Auto Import Edge Function
 * 
 * Funcionalidade:
 * - Roda automaticamente (via Cron ou manual trigger)
 * - Busca boletos/faturas novos no Gmail
 * - Extrai dados e cria transações financeiras
 * - Marca emails como processados
 * 
 * Como usar:
 * 1. Deploy: supabase functions deploy gmail-auto-import
 * 2. Teste: supabase functions invoke gmail-auto-import
 * 3. Cron: Agendar no Supabase Dashboard
 */

interface GmailMessage {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
}

serve(async (req) => {
  try {
    // 1. Autenticar com Supabase
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Buscar todas as integrações ativas
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('google_integrations')
      .select('*')
      .eq('is_active', true)

    if (integrationsError) throw integrationsError

    console.log(`📊 Encontradas ${integrations.length} integrações ativas`)

    let totalProcessed = 0
    let totalImported = 0

    // 3. Processar cada integração
    for (const integration of integrations) {
      try {
        // Buscar boletos novos
        const messages = await searchInvoices(integration.access_token)
        console.log(`📧 ${messages.length} boletos encontrados para ${integration.google_email}`)

        // Processar cada mensagem
        for (const message of messages) {
          try {
            await processInvoice(supabaseClient, integration, message)
            totalImported++
          } catch (error) {
            console.error(`❌ Erro ao processar mensagem ${message.id}:`, error)
          }
          totalProcessed++
        }
      } catch (error) {
        console.error(`❌ Erro ao processar integração ${integration.id}:`, error)
      }
    }

    // 4. Log de sucesso
    await supabaseClient.from('google_sync_logs').insert({
      service: 'gmail',
      operation: 'auto_import',
      status: 'success',
      metadata: {
        total_processed: totalProcessed,
        total_imported: totalImported,
        integrations_count: integrations.length
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `✅ Processados ${totalProcessed} emails, ${totalImported} importados`,
        stats: {
          integrations: integrations.length,
          processed: totalProcessed,
          imported: totalImported
        }
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('❌ Erro geral:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Buscar boletos/faturas no Gmail
 */
async function searchInvoices(accessToken: string): Promise<GmailMessage[]> {
  const queries = [
    'has:attachment filename:pdf (fatura OR boleto OR invoice)',
    '-label:ISACAR_IMPORTED' // Apenas não processados
  ].join(' ')

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(queries)}&maxResults=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.messages || data.messages.length === 0) {
    return []
  }

  // Buscar detalhes de cada mensagem
  const messages: GmailMessage[] = []
  for (const msg of data.messages) {
    const details = await getMessageDetails(accessToken, msg.id)
    if (details) messages.push(details)
  }

  return messages
}

/**
 * Buscar detalhes de uma mensagem
 */
async function getMessageDetails(accessToken: string, messageId: string): Promise<GmailMessage | null> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) return null

  const data = await response.json()
  const headers = data.payload.headers
  
  return {
    id: data.id,
    subject: headers.find((h: any) => h.name === 'Subject')?.value || '',
    from: headers.find((h: any) => h.name === 'From')?.value || '',
    date: headers.find((h: any) => h.name === 'Date')?.value || '',
    snippet: data.snippet,
  }
}

/**
 * Processar boleto e criar transação
 */
async function processInvoice(
  supabase: any,
  integration: any,
  message: GmailMessage
) {
  // 1. Extrair dados básicos (regex simples)
  const amount = extractAmount(message.subject + ' ' + message.snippet)
  const dueDate = extractDueDate(message.subject + ' ' + message.snippet)
  const company = extractCompany(message.from)

  // 2. Criar transação financeira
  const { error: insertError } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: integration.user_id,
      workspace_id: integration.workspace_id,
      type: 'expense',
      description: `Boleto: ${message.subject}`,
      amount: amount || 0,
      due_date: dueDate,
      category: 'Importado do Gmail',
      status: 'pending',
      metadata: {
        gmail_message_id: message.id,
        company,
        imported_at: new Date().toISOString(),
        auto_imported: true
      }
    })

  if (insertError) throw insertError

  // 3. Marcar email como processado
  await addLabel(integration.access_token, message.id, 'ISACAR_IMPORTED')

  console.log(`✅ Boleto importado: ${message.subject}`)
}

/**
 * Adicionar label ao email
 */
async function addLabel(accessToken: string, messageId: string, labelName: string) {
  // 1. Buscar ou criar label
  const labelId = await getOrCreateLabel(accessToken, labelName)
  if (!labelId) return

  // 2. Adicionar label à mensagem
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
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
}

/**
 * Buscar ou criar label
 */
async function getOrCreateLabel(accessToken: string, labelName: string): Promise<string | null> {
  // Buscar labels existentes
  const listResponse = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!listResponse.ok) return null

  const labels = await listResponse.json()
  const existing = labels.labels.find((l: any) => l.name === labelName)

  if (existing) return existing.id

  // Criar nova label
  const createResponse = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    {
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
    }
  )

  if (!createResponse.ok) return null

  const newLabel = await createResponse.json()
  return newLabel.id
}

// ===== HELPERS DE EXTRAÇÃO =====

/**
 * Extrair valor monetário (regex simples)
 */
function extractAmount(text: string): number | null {
  const patterns = [
    /R\$\s*(\d+[\.,]\d{2})/gi,
    /(\d+[\.,]\d{2})\s*reais/gi,
    /valor[:\s]+R?\$?\s*(\d+[\.,]\d{2})/gi,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = match[0].replace(/[^\d,\.]/g, '').replace(',', '.')
      return parseFloat(value)
    }
  }

  return null
}

/**
 * Extrair data de vencimento
 */
function extractDueDate(text: string): string | null {
  const patterns = [
    /vencimento[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/gi,
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/gi,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[0].replace(/vencimento[:\s]+/gi, '')
      // Converter DD/MM/YYYY para YYYY-MM-DD
      const parts = dateStr.split(/[\/\-]/)
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }
  }

  return null
}

/**
 * Extrair nome da empresa do email
 */
function extractCompany(fromEmail: string): string {
  // Extrair nome antes do email
  const match = fromEmail.match(/^(.*?)\s*</)
  if (match) {
    return match[1].trim()
  }

  // Se não tem nome, usar domínio do email
  const emailMatch = fromEmail.match(/@([\w\-\.]+)/)
  if (emailMatch) {
    return emailMatch[1].split('.')[0]
  }

  return 'Desconhecido'
}
