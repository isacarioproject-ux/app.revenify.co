import { GoogleAuthService } from './google-auth.service'

/**
 * 📊 Google Sheets Service
 * Exportar relatórios e dados para Google Sheets
 */

export interface SpreadsheetInfo {
  spreadsheetId: string
  spreadsheetUrl: string
  sheets: Sheet[]
}

export interface Sheet {
  sheetId?: number
  title?: string
  index?: number
  sheetType?: string
  gridProperties?: {
    rowCount: number
    columnCount: number
  }
  properties?: {
    sheetId?: number
    title?: string
    index?: number
    sheetType?: string
    gridProperties?: {
      rowCount: number
      columnCount: number
    }
  }
}

export class SheetsService {
  private static BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

  /**
   * Criar nova planilha
   */
  static async createSpreadsheet(
    title: string,
    workspaceId?: string
  ): Promise<SpreadsheetInfo | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title,
          },
          // Criar com uma aba nomeada 'Dados' para evitar problemas de idioma
          sheets: [
            {
              properties: {
                title: 'Dados',
              },
            },
          ],
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar planilha')

      const data = await response.json()
      
      // Garantir que sheets está presente
      if (!data.sheets || data.sheets.length === 0) {
        data.sheets = [{ properties: { title: 'Dados' } }]
      }

      return data
    } catch (error) {
      console.error('Erro ao criar planilha:', error)
      return null
    }
  }

  /**
   * Escrever dados em uma planilha
   */
  static async writeData(
    spreadsheetId: string,
    range: string, // Ex: "Sheet1!A1:D10"
    values: any[][],
    workspaceId?: string
  ): Promise<boolean> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) {
        console.error('❌ Token não disponível')
        throw new Error('Token de acesso não disponível')
      }

      console.log('📊 Tentando escrever dados no Sheets:', {
        spreadsheetId,
        range,
        rows: values.length,
        tokenPreview: accessToken.substring(0, 20) + '...'
      })

      const response = await fetch(
        `${this.BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Erro do Google Sheets API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
      } else {
        console.log('✅ Dados escritos com sucesso')
      }

      return response.ok
    } catch (error) {
      console.error('❌ Erro ao escrever dados:', error)
      return false
    }
  }

  /**
   * Adicionar nova aba
   */
  static async addSheet(
    spreadsheetId: string,
    title: string,
    workspaceId?: string
  ): Promise<boolean> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title,
                  },
                },
              },
            ],
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Erro ao adicionar aba:', error)
      return false
    }
  }

  /**
   * Exportar relatório financeiro mensal
   */
  static async exportFinanceReport(
    month: number,
    year: number,
    workspaceId?: string
  ): Promise<string | null> {
    const startTime = Date.now()
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      // Importar Supabase client já configurado

      // Buscar dados reais do Supabase
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      let query = supabase
        .from('finance_transactions')
        .select('*')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true })

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }

      const { data: transactions, error } = await query

      if (error) throw error

      // Criar nova planilha
      const spreadsheet = await this.createSpreadsheet(
        `Relatório Financeiro - ${month}/${year}`,
        workspaceId
      )

      if (!spreadsheet) throw new Error('Erro ao criar planilha')

      // Headers
      const headers = [
        ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Método', 'Status'],
      ]

      // Converter transações para formato de tabela
      const data = transactions?.map(t => [
        new Date(t.transaction_date).toLocaleDateString('pt-BR'),
        t.description || '-',
        t.category || '-',
        t.type === 'income' ? 'Receita' : 'Despesa',
        (t.type === 'income' ? '' : '-') + (t.amount || 0).toFixed(2),
        t.payment_method || '-',
        t.status || '-'
      ]) || []

      // Calcular totais
      const totalReceitas = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const totalDespesas = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const saldo = totalReceitas - totalDespesas

      // Adicionar linha vazia e resumo
      const summary = [
        [''],
        ['RESUMO DO PERÍODO'],
        ['Total Receitas:', '', '', '', totalReceitas.toFixed(2), '', ''],
        ['Total Despesas:', '', '', '', `-${totalDespesas.toFixed(2)}`, '', ''],
        ['Saldo:', '', '', '', saldo.toFixed(2), '', ''],
      ]

      const allData = [...headers, ...data, ...summary]

      // Obter o nome correto da primeira aba (pode variar por idioma: Sheet1, Página1, etc)
      const firstSheetName = spreadsheet.sheets?.[0]?.properties?.title || spreadsheet.sheets?.[0]?.title || 'Dados'
      
      // Escrever dados
      const range = `${firstSheetName}!A1:G${allData.length}`
      const success = await this.writeData(
        spreadsheet.spreadsheetId,
        range,
        allData,
        workspaceId
      )

      if (!success) throw new Error('Erro ao escrever dados')

      // Log de sucesso
      const duration = Date.now() - startTime
      await supabase.rpc('log_google_sync', {
        p_user_id: user?.id,
        p_workspace_id: workspaceId || null,
        p_service: 'sheets',
        p_operation: 'export',
        p_status: 'success',
        p_metadata: { type: 'finance', month, year, rows: transactions?.length || 0 },
        p_duration_ms: duration
      })

      return spreadsheet.spreadsheetUrl
    } catch (error: any) {
      console.error('Erro ao exportar relatório financeiro:', error)
      
      // Log de erro
      const duration = Date.now() - startTime
      try {
        await supabase.rpc('log_google_sync', {
          p_user_id: user?.id,
          p_workspace_id: workspaceId || null,
          p_service: 'sheets',
          p_operation: 'export',
          p_status: 'error',
          p_metadata: { type: 'finance', month, year },
          p_error_message: error.message,
          p_duration_ms: duration
        })
      } catch (logError) {
        console.error('Erro ao logar:', logError)
      }
      
      throw error
    }
  }

  /**
   * Exportar lista de tasks
   */
  static async exportTasks(
    workspaceId?: string
  ): Promise<string | null> {
    const startTime = Date.now()
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      // Importar Supabase client já configurado

      // Buscar tasks reais do Supabase
      if (!user) throw new Error('Usuário não autenticado')

      // Query simplificada
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar por workspace no código
      let tasks = tasksData || []
      if (workspaceId) {
        tasks = tasks.filter(t => t.workspace_id === workspaceId)
      } else {
        tasks = tasks.filter(t => !t.workspace_id)
      }

      const spreadsheet = await this.createSpreadsheet(
        `Tasks Export - ${new Date().toISOString().split('T')[0]}`,
        workspaceId
      )

      if (!spreadsheet) throw new Error('Erro ao criar planilha')

      // Headers
      const headers = [
        ['Título', 'Status', 'Prioridade', 'Data Início', 'Data Fim', 'Concluída em', 'Descrição'],
      ]

      // Converter tasks para formato de tabela
      const data = tasks?.map(task => [
        task.title || '-',
        task.status || '-',
        task.priority || '-',
        task.start_date ? new Date(task.start_date).toLocaleDateString('pt-BR') : '-',
        task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-',
        task.completed_at ? new Date(task.completed_at).toLocaleDateString('pt-BR') : '-',
        task.description || '-',
      ]) || []

      // Calcular estatísticas
      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0
      const todoTasks = tasks?.filter(t => t.status === 'todo').length || 0

      // Adicionar linha vazia e resumo
      const summary = [
        [''],
        ['RESUMO DAS TASKS'],
        ['Total de Tasks:', totalTasks.toString(), '', '', '', '', ''],
        ['Concluídas:', completedTasks.toString(), '', '', '', '', ''],
        ['Em Progresso:', inProgressTasks.toString(), '', '', '', '', ''],
        ['A Fazer:', todoTasks.toString(), '', '', '', '', ''],
      ]

      const allData = [...headers, ...data, ...summary]

      // Obter o nome correto da primeira aba (pode variar por idioma: Sheet1, Página1, etc)
      const firstSheetName = spreadsheet.sheets?.[0]?.properties?.title || spreadsheet.sheets?.[0]?.title || 'Dados'
      
      const range = `${firstSheetName}!A1:G${allData.length}`
      const success = await this.writeData(
        spreadsheet.spreadsheetId,
        range,
        allData,
        workspaceId
      )

      if (!success) throw new Error('Erro ao escrever dados')

      // Log de sucesso
      const duration = Date.now() - startTime
      await supabase.rpc('log_google_sync', {
        p_user_id: user?.id,
        p_workspace_id: workspaceId || null,
        p_service: 'sheets',
        p_operation: 'export',
        p_status: 'success',
        p_metadata: { type: 'tasks', rows: tasks?.length || 0 },
        p_duration_ms: duration
      })

      return spreadsheet.spreadsheetUrl
    } catch (error: any) {
      console.error('Erro ao exportar tasks:', error)
      
      // Log de erro
      const duration = Date.now() - startTime
      try {
        await supabase.rpc('log_google_sync', {
          p_user_id: user?.id,
          p_workspace_id: workspaceId || null,
          p_service: 'sheets',
          p_operation: 'export',
          p_status: 'error',
          p_metadata: { type: 'tasks' },
          p_error_message: error.message,
          p_duration_ms: duration
        })
      } catch (logError) {
        console.error('Erro ao logar:', logError)
      }
      
      throw error
    }
  }
}
