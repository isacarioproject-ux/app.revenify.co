import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Calendar, CheckCircle2, XCircle, RefreshCw, Download, ArrowDownToLine } from 'lucide-react'
import { CalendarService, type CalendarEvent } from '@/services/google/calendar.service'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'

/**
 * 📅 Calendar Sync Panel
 * Sincronizar Tasks com Google Calendar
 * 
 * Funcionalidades:
 * - Habilitar/desabilitar sync automático
 * - Sincronizar todas as tasks com due_date
 * - Ver status de sincronização
 * - Desvincular tasks
 */

interface Task {
  id: string
  title: string
  due_date?: string
  start_date?: string
  status: 'todo' | 'in_progress' | 'done'
  calendar_event_id?: string
}

export function CalendarSyncPanel() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const [autoSync, setAutoSync] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [syncedCount, setSyncedCount] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [showImport, setShowImport] = useState(false)

  // Carregar tasks com due_date
  useEffect(() => {
    loadTasks()
  }, [currentWorkspace?.id])

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Query simplificada - buscar todas as tasks do usuário com due_date
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, due_date, start_date, status, calendar_event_id')
        .eq('created_by', user.id)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })

      if (error) {
        console.error('❌ Erro na query:', error)
        console.error('📋 Detalhes:', JSON.stringify(error, null, 2))
        console.error('🔍 Message:', error.message)
        console.error('🔍 Code:', error.code)
        throw error
      }

      console.log('✅ Tasks carregadas:', data?.length || 0, 'tasks com due_date')
      setTasks(data || [])
      setSyncedCount(data?.filter(t => t.calendar_event_id).length || 0)
    } catch (error) {
      console.error('Erro ao carregar tasks:', error)
      toast.error(t('calendar.errorLoad'))
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      toast.info(`🔄 ${t('calendar.syncing')}`)

      let successCount = 0
      let errorCount = 0

      for (const task of tasks) {
        try {
          const eventId = await CalendarService.syncTaskToCalendar(
            task,
            currentWorkspace?.id
          )

          if (eventId) {
            // Atualizar task com event_id
            await supabase
              .from('tasks')
              .update({ calendar_event_id: eventId })
              .eq('id', task.id)

            successCount++
          }
        } catch (error) {
          console.error('Erro task:', task.id, error)
          errorCount++
        }
      }

      await loadTasks()

      if (successCount > 0) {
        toast.success(`✅ ${successCount} ${t('calendar.tasksSynced')}`)
      }

      if (errorCount > 0) {
        toast.warning(`⚠️ ${errorCount} ${t('calendar.tasksError')}`)
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error)
      toast.error(t('calendar.errorSync'))
    } finally {
      setSyncing(false)
    }
  }

  const handleUnsyncTask = async (task: Task) => {
    if (!task.calendar_event_id) return

    try {
      // Deletar evento do Calendar
      const success = await CalendarService.unsyncTask(
        task.calendar_event_id,
        currentWorkspace?.id
      )

      if (success) {
        // Remover event_id da task
        await supabase
          .from('tasks')
          .update({ calendar_event_id: null })
          .eq('id', task.id)

        toast.success(`✅ ${t('calendar.taskUnlinked')}`)
        await loadTasks()
      } else {
        toast.error(t('calendar.errorUnlink'))
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error(t('calendar.errorUnlink'))
    }
  }

  // Carregar eventos do Google Calendar
  const loadUpcomingEvents = async () => {
    try {
      const events = await CalendarService.getUpcomingEvents(14, currentWorkspace?.id)
      
      // Filtrar eventos que já estão sincronizados
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('calendar_event_id')
        .not('calendar_event_id', 'is', null)
      
      const syncedIds = new Set(existingTasks?.map(t => t.calendar_event_id) || [])
      const newEvents = events.filter(e => !syncedIds.has(e.id))
      
      setUpcomingEvents(newEvents)
      setShowImport(true)
      
      if (newEvents.length === 0) {
        toast.info(t('calendar.allEventsSynced'))
      } else {
        toast.success(`${newEvents.length} ${t('calendar.eventsToImport')}`)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      toast.error(t('calendar.errorLoadEvents'))
    }
  }

  // Importar eventos como tasks
  const handleImportEvents = async () => {
    try {
      setImporting(true)
      toast.info(`📥 ${t('calendar.importingEvents')}`)

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // Próximos 30 dias

      const result = await CalendarService.importEventsAsTasks(
        startDate,
        endDate,
        undefined,
        currentWorkspace?.id
      )

      if (result.imported > 0) {
        toast.success(`✅ ${result.imported} ${t('calendar.eventsImported')}`)
      }
      
      if (result.skipped > 0) {
        toast.info(`${result.skipped} ${t('calendar.eventsSkipped')}`)
      }

      // Recarregar dados
      await loadTasks()
      setShowImport(false)
      setUpcomingEvents([])
    } catch (error: any) {
      console.error('Erro ao importar:', error)
      toast.error(t('calendar.errorImport'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('calendar.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {t('calendar.description')}
            </CardDescription>
          </div>

          {/* Controles - Empilhados em mobile, linha em desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Auto Sync Toggle */}
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('calendar.autoSync')}:</span>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSyncAll}
                  disabled={syncing || tasks.length === 0}
                  size="sm"
                  title={tasks.length === 0 ? t('calendar.createTasksWithDate') : t('calendar.syncAll')}
                  className="w-full sm:w-auto"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-xs sm:text-sm">{t('calendar.syncing')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">{t('calendar.syncAll')}</span>
                      {tasks.length === 0 && <span className="hidden sm:inline"> (0)</span>}
                    </>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={loadUpcomingEvents}
                  disabled={importing}
                  size="sm"
                  variant="outline"
                  title={t('calendar.importFromCalendar')}
                  className="w-full sm:w-auto"
                >
                  <ArrowDownToLine className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm truncate">{t('calendar.importFromCalendar')}</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {/* Estatísticas - Grid responsivo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-2 sm:p-4 bg-muted/50 rounded-lg"
          >
            <div className="text-lg sm:text-2xl font-bold">{tasks.length}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{t('calendar.tasksWithDate')}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-2 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg"
          >
            <div className="text-lg sm:text-2xl font-bold text-green-600">{syncedCount}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{t('calendar.synced')}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-2 sm:p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
          >
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {tasks.length - syncedCount}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{t('calendar.pending')}</div>
          </motion.div>
        </div>

        {/* Lista de tasks */}
        <div className="space-y-2 max-h-72 sm:max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="font-medium text-sm sm:text-base">{t('calendar.noTasksWithDate')}</p>
              <p className="text-[10px] sm:text-xs mt-2">
                💡 {t('calendar.createTasksWithDate')}
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.01 }}
                className="border rounded-lg p-2 sm:p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{task.title}</h4>
                      {task.calendar_event_id ? (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                          <span className="hidden xs:inline">{t('calendar.syncedBadge')}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />
                          <span className="hidden xs:inline">{t('calendar.notSyncedBadge')}</span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-sm text-muted-foreground">
                      {task.start_date && (
                        <span>📅 {new Date(task.start_date).toLocaleDateString('pt-BR')}</span>
                      )}
                      {task.due_date && (
                        <span>⏰ {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>

                  {task.calendar_event_id && (
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => handleUnsyncTask(task)}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Eventos para importar */}
        <AnimatePresence>
          {showImport && upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 sm:mb-6 border rounded-lg p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                  {t('calendar.eventsAvailable')} ({upcomingEvents.length})
                </h4>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-none">
                    <Button
                      onClick={handleImportEvents}
                      disabled={importing}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {importing ? (
                        <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                      <span className="text-xs sm:text-sm">{t('calendar.importAll')}</span>
                    </Button>
                  </motion.div>
                  <Button
                    onClick={() => setShowImport(false)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-36 sm:max-h-48 overflow-y-auto">
                {upcomingEvents.map((event, index) => (
                  <motion.div 
                    key={event.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 bg-white dark:bg-background rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{event.summary}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(event.start.dateTime).toLocaleDateString('pt-BR')} às {new Date(event.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs ml-2">
                      {event.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
            <strong>💡 {t('calendar.bidirectionalSync')}</strong> {t('calendar.bidirectionalSyncDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
