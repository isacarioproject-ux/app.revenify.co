import { GoogleAuthService } from './google-auth.service'

/**
 * 📅 Google Calendar Service
 * Sincronização bidirecional entre Tasks e Google Calendar
 */

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  status: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink: string
}

export class CalendarService {
  private static BASE_URL = 'https://www.googleapis.com/calendar/v3'

  /**
   * Criar evento no Google Calendar
   */
  static async createEvent(
    event: Partial<CalendarEvent>,
    workspaceId?: string
  ): Promise<CalendarEvent | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) throw new Error('Erro ao criar evento')

      return await response.json()
    } catch (error) {
      console.error('Erro ao criar evento no Calendar:', error)
      return null
    }
  }

  /**
   * Atualizar evento existente
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>,
    workspaceId?: string
  ): Promise<CalendarEvent | null> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) throw new Error('Erro ao atualizar evento')

      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar evento no Calendar:', error)
      return null
    }
  }

  /**
   * Deletar evento
   */
  static async deleteEvent(eventId: string, workspaceId?: string): Promise<boolean> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const response = await fetch(
        `${this.BASE_URL}/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('Erro ao deletar evento no Calendar:', error)
      return false
    }
  }

  /**
   * Listar eventos em um período
   */
  static async listEvents(
    startDate: Date,
    endDate: Date,
    workspaceId?: string
  ): Promise<CalendarEvent[]> {
    try {
      const accessToken = await GoogleAuthService.getAccessToken(workspaceId)
      if (!accessToken) throw new Error('Token de acesso não disponível')

      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      })

      const response = await fetch(
        `${this.BASE_URL}/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) throw new Error('Erro ao listar eventos')

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Erro ao listar eventos do Calendar:', error)
      return []
    }
  }

  /**
   * Sincronizar Task com Calendar
   * Criar evento para task com due_date
   */
  static async syncTaskToCalendar(task: {
    id: string
    title: string
    description?: string
    due_date?: string
    start_date?: string
    calendar_event_id?: string
  }, workspaceId?: string): Promise<string | null> {
    const startTime = Date.now()
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      // Verificar se task tem data
      if (!task.due_date) {
        console.log('Task sem due_date, ignorando sincronização')
        return null
      }

      const dueDate = new Date(task.due_date)
      const startDate = task.start_date ? new Date(task.start_date) : dueDate

      const event: Partial<CalendarEvent> = {
        summary: `📋 ${task.title}`,
        description: task.description || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: dueDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        status: 'confirmed',
      }

      // Se já tem evento, atualizar. Senão, criar novo
      let eventId: string | null = null
      if (task.calendar_event_id) {
        const updated = await this.updateEvent(task.calendar_event_id, event, workspaceId)
        eventId = updated?.id || null
      } else {
        const created = await this.createEvent(event, workspaceId)
        eventId = created?.id || null
      }

      // Log de sucesso
      const duration = Date.now() - startTime
      try {
        await supabase.rpc('log_google_sync', {
          p_user_id: user?.id,
          p_workspace_id: workspaceId || null,
          p_service: 'calendar',
          p_operation: 'sync',
          p_status: 'success',
          p_metadata: { task_id: task.id, event_id: eventId },
          p_duration_ms: duration
        })
      } catch (logError) {
        console.error('Erro ao logar:', logError)
      }

      return eventId
    } catch (error: any) {
      console.error('Erro ao sincronizar task com Calendar:', error)
      
      // Log de erro
      const duration = Date.now() - startTime
      try {
        await supabase.rpc('log_google_sync', {
          p_user_id: user?.id,
          p_workspace_id: workspaceId || null,
          p_service: 'calendar',
          p_operation: 'sync',
          p_status: 'error',
          p_metadata: { task_id: task.id },
          p_error_message: error.message,
          p_duration_ms: duration
        })
      } catch (logError) {
        console.error('Erro ao logar:', logError)
      }
      
      return null
    }
  }

  /**
   * Remover sincronização (deletar evento do Calendar)
   */
  static async unsyncTask(calendarEventId: string, workspaceId?: string): Promise<boolean> {
    return await this.deleteEvent(calendarEventId, workspaceId)
  }

  /**
   * 🔄 Importar eventos do Google Calendar como Tarefas
   * Sync bidirecional: Calendar → Tasks
   */
  static async importEventsAsTasks(
    startDate: Date,
    endDate: Date,
    projectId?: string,
    workspaceId?: string
  ): Promise<{ imported: number; skipped: number }> {
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuário não autenticado')

    let imported = 0
    let skipped = 0

    try {
      // Buscar eventos do Calendar
      const events = await this.listEvents(startDate, endDate, workspaceId)
      
      for (const event of events) {
        // Verificar se já existe task com este calendar_event_id
        const { data: existing } = await supabase
          .from('tasks')
          .select('id')
          .eq('calendar_event_id', event.id)
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        // Criar nova task
        const dueDate = event.start.dateTime 
          ? new Date(event.start.dateTime).toISOString()
          : null

        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId || null,
            project_id: projectId || null,
            title: event.summary.replace(/^📋\s*/, ''), // Remover emoji se houver
            description: event.description || null,
            status: 'todo',
            priority: 'medium',
            due_date: dueDate,
            calendar_event_id: event.id,
            tags: ['calendar-import']
          })

        if (!error) {
          imported++
        }
      }

      return { imported, skipped }
    } catch (error) {
      console.error('Erro ao importar eventos:', error)
      throw error
    }
  }

  /**
   * Buscar eventos do dia/semana para preview
   */
  static async getUpcomingEvents(
    days: number = 7,
    workspaceId?: string
  ): Promise<CalendarEvent[]> {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)
    
    return this.listEvents(startDate, endDate, workspaceId)
  }
}
