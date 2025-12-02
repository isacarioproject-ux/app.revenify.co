import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OnboardingStepProps } from '@/types/onboarding'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CalendarIcon, Loader2, Sparkles, Flag, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useI18n } from '@/hooks/use-i18n'

export function FirstTaskStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error(t('onboarding.task.titleRequired'))
      return
    }

    if (!user) return

    setLoading(true)

    try {
      // Salvar no modo "Pessoal" (workspace_id = null)
      // Dados pessoais do onboarding ficam sem workspace
      // Usuário pode criar workspace colaborativo depois
      console.log('🏠 Salvando task no modo PESSOAL (sem workspace)')

      const taskData = {
        workspace_id: null,  // ✅ Modo PESSOAL (sem workspace)
        created_by: user.id,
        title: title.trim(),
        description: '',
        status: status,
        priority: priority,
        start_date: startDate?.toISOString() || null,
        due_date: dueDate?.toISOString() || null,
        assigned_to: [],
        labels: [],
        parent_task_id: null
      }

      console.log('📝 Criando tarefa com dados:', {
        title: taskData.title,
        status: taskData.status,
        priority: taskData.priority,
        start_date: taskData.start_date,
        due_date: taskData.due_date
      })

      const { error } = await supabase
        .from('tasks')
        .insert(taskData)

      if (error) {
        console.error('❌ Erro ao criar tarefa:', error.message, error)
        throw error
      }

      console.log('✅ Tarefa criada com sucesso com todos os dados!')
      toast.success(t('onboarding.task.created'))
      
      onNext({ 
        createdFirstTask: true,
        firstTaskTitle: title 
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar tarefa:', error)
      toast.error(`${t('onboarding.task.error')}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setSkipping(true)
    onNext({ createdFirstTask: false })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg space-y-2 pb-32 sm:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Logo com gradiente colorido de fundo */}
        <div className="text-center space-y-1">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40 overflow-visible">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
        </div>

        {/* Header - SEM ÍCONE */}
        <div className="text-center space-y-0.5">
          <h2 className="text-base font-semibold text-gray-900">{t('onboarding.task.title')}</h2>
          <p className="text-xs text-gray-600">{t('onboarding.task.subtitle')}</p>
        </div>

        {/* Formulário - SEM CARD */}
        <div className="space-y-3">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="task-title">{t('onboarding.task.whatToDo')}</Label>
          <Input
            id="task-title"
            placeholder={t('onboarding.task.placeholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Status e Prioridade */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              {t('tasks.status')}
            </Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">{t('tasks.status.todo')}</SelectItem>
                <SelectItem value="in_progress">{t('tasks.status.inProgress')}</SelectItem>
                <SelectItem value="done">{t('tasks.status.done')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flag className="h-3.5 w-3.5" />
              {t('tasks.priority')}
            </Label>
            <Select value={priority} onValueChange={setPriority} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                <SelectItem value="urgent">{t('tasks.priority.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="start-date">{t('tasks.startDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm bg-white hover:bg-gray-50 border-gray-300"
                  disabled={loading}
                  type="button"
                  onClick={() => console.log('Clicou Data Início')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : t('common.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    console.log('Data Início selecionada:', date)
                    setStartDate(date)
                    // Fechar popover após selecionar
                    document.getElementById('start-date')?.click()
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">{t('tasks.dueDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due-date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm bg-white hover:bg-gray-50 border-gray-300"
                  disabled={loading}
                  type="button"
                  onClick={() => console.log('Clicou Prazo')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : t('common.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    console.log('Prazo selecionado:', date)
                    setDueDate(date)
                    // Fechar popover após selecionar
                    document.getElementById('due-date')?.click()
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Motivação */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/50 p-4 rounded-lg text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-medium">{t('onboarding.task.firstExperience')}</p>
          </div>
          <p className="text-muted-foreground text-xs">
            {t('onboarding.task.firstExperienceDesc')}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-1">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={loading || skipping}
            className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
          >
            {skipping ? t('common.skipping') : t('onboarding.task.doLater')}
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || loading}
            className="flex-1 h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.creating')}
              </>
            ) : (
              t('onboarding.task.createTask')
            )}
          </Button>
        </div>
        </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-2 z-20">
        <p className="text-xs">{t('onboarding.task.loggedAs')} <span className="font-medium">{user?.email}</span></p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          {t('onboarding.task.switchUser')}
        </Button>
      </div>

    </div>
  )
}
