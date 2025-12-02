import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTasksCard } from '@/hooks/tasks/use-tasks-card';
import { TasksGroupView } from '@/components/tasks/tasks-group-view';
import { TasksListView } from '@/components/tasks/tasks-list-view';
import { TasksDelegatedView } from '@/components/tasks/tasks-delegated-view';
import { TaskModal } from '@/components/tasks/task-modal';
import { TaskTemplateSelector } from '@/components/tasks/task-template-selector';
import { QuickAddTaskDialog } from '@/components/tasks/quick-add-task-dialog';
import { TasksSettingsDialog } from '@/components/tasks/tasks-settings-dialog';
import { TasksCardSkeleton, TasksListSkeleton, TasksHeaderSkeleton } from '@/components/tasks/tasks-card-skeleton';
import { Plus, CheckSquare, Square, Bell, Sparkles, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TaskGroups, Task, TaskTemplate } from '@/types/tasks';
import { createTask, getCurrentUserId } from '@/lib/tasks/tasks-storage';
import { getReminders } from '@/lib/tasks/reminders-storage';
import { Reminder } from '@/types/reminders';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { useWorkspace } from '@/contexts/workspace-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TasksPageView() {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const {
    tasks,
    activeTab,
    setActiveTab,
    loading,
    refetch,
    toggleGroup,
    isGroupExpanded,
  } = useTasksCard();

  // ✨ Recarregar tasks quando mudar de workspace
  useEffect(() => {
    refetch();
  }, [currentWorkspace?.id]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialTab, setQuickAddInitialTab] = useState<'tarefa' | 'lembrete'>('tarefa');
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('📋');
  const [workspaceName, setWorkspaceName] = useState('Meu trabalho');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Carregar lembretes
  useEffect(() => {
    const loadReminders = async () => {
      setLoadingReminders(true);
      try {
        const data = await getReminders({ status: 'active', limit: 20 });
        setReminders(data);
      } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
      } finally {
        setLoadingReminders(false);
      }
    };
    loadReminders();
  }, [currentWorkspace?.id]);

  // Calcular total de tarefas para animação
  const totalTasks = Array.isArray(tasks) 
    ? tasks.length 
    : Object.values(tasks).flat().length;
  const hasPendingTasks = totalTasks > 0;

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleCreateTask = () => {
    setIsTemplateSelectorOpen(true);
  };

  const handleTemplateSelect = async (template: TaskTemplate) => {
    const userId = await getCurrentUserId();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: template.task.title || 'Nova Tarefa',
      description: template.task.description || '',
      status: template.task.status || 'todo',
      priority: template.task.priority || 'medium',
      due_date: null,
      start_date: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      assignee_ids: [userId],
      created_by: userId,
      tag_ids: [],
      project_id: null,
      finance_document_id: null,
      list_id: null,
      parent_task_id: null,
      custom_fields: template.task.custom_fields || [],
      location: 'Lista pessoal',
      workspace: 'Pessoal',
    };

    await createTask(newTask);

    // Criar sub-tarefas se houver
    if (template.task.subtasks) {
      for (const [index, subtaskData] of template.task.subtasks.entries()) {
        const subtask: Task = {
          id: `task-${Date.now()}-subtask-${index}`,
          title: subtaskData.title || 'Sub-tarefa',
          description: '',
          status: subtaskData.status || 'todo',
          priority: subtaskData.priority || 'medium',
          due_date: null,
          start_date: null,
          created_at: new Date().toISOString(),
          completed_at: null,
          assignee_ids: [userId],
          created_by: userId,
          tag_ids: [],
          project_id: null,
          finance_document_id: null,
          list_id: null,
          parent_task_id: newTask.id,
          custom_fields: [],
          location: 'Lista pessoal',
          workspace: 'Pessoal',
        };
        await createTask(subtask);
      }
    }

    toast.success('Tarefa criada com sucesso!');
    refetch();
    handleTaskClick(newTask.id);
  };

  const handleQuickAddTask = async (taskData: any) => {
    try {
      const userId = await getCurrentUserId();
      
      // Converter prioridade do dialog para o formato do banco
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (taskData.priority === 'urgente') priority = 'urgent';
      else if (taskData.priority === 'alta') priority = 'high';
      else if (taskData.priority === 'normal') priority = 'medium';
      else if (taskData.priority === 'baixa') priority = 'low';
      
      const newTask: any = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as const,
        priority,
        due_date: taskData.selectedDateTag ? taskData.selectedDateTag.toISOString() : null,
        start_date: null,
        completed_at: null,
        assignee_ids: [userId],
        created_by: userId,
        tag_ids: taskData.tags || [],
        project_id: null,
        list_id: taskData.list || 'lista-pessoal',
        parent_task_id: null,
        custom_fields: [],
      };
      
      const createdTask = await createTask(newTask);
      toast.success('Tarefa criada com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa: ' + (error as Error).message);
    }
  };

  const handleQuickAddReminder = async (reminderData: any) => {
    // O ReminderTab já cria o lembrete no Supabase com todas as funcionalidades avançadas
    // Este handler recarrega os lembretes
    try {
      const data = await getReminders({ status: 'active', limit: 20 });
      setReminders(data);
    } catch (error) {
      console.error('Erro ao recarregar lembretes:', error);
    }
    refetch();
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M - Nova tarefa
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        handleCreateTask();
      }
      
      // ESC - Fechar modal
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const availableIcons = ['📋', '✅', '📝', '🎯', '⚡', '🔥', '💼', '📊', '🎨', '🚀'];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      {/* Header Padrão */}
      {loading ? (
        <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      ) : (
      <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold truncate">Meu Trabalho</h2>
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-0.5">
            {/* Botão Adicionar com Popover */}
            <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-52 p-1" align="end">
                <button
                  onClick={() => {
                    setQuickAddInitialTab('tarefa');
                    setIsQuickAddOpen(true);
                    setIsAddPopoverOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                >
                  <CheckSquare className="size-4" />
                  <span>{t('tasks.group.addTask')}</span>
                </button>
                <button
                  onClick={() => {
                    setQuickAddInitialTab('lembrete');
                    setIsQuickAddOpen(true);
                    setIsAddPopoverOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                >
                  <Bell className="size-4" />
                  <span>{t('tasks.group.addReminder')}</span>
                </button>
              </PopoverContent>
            </Popover>

            {/* Botão Templates */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsTemplateSelectorOpen(true)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tasks.card.templates')}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Botão Configurações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      )}

      {/* Tabs com ícones estilo Gestor de Projetos */}
      {loading ? (
        <TasksHeaderSkeleton />
      ) : (
      <div className="flex items-center justify-between px-4 md:px-16 shrink-0 py-1 md:py-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-shrink-0"
        >
          <TabsList variant="transparent" className="border-0 p-0 gap-0.5 md:gap-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="pendente" 
                    className="text-xs gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-2 md:px-3 py-1.5"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('tasks.card.pending')}</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('tasks.card.pending')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="feito" 
                    className="text-xs gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-2 md:px-3 py-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('tasks.card.done')}</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('tasks.card.done')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="delegado" 
                    className="text-xs gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-2 md:px-3 py-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('tasks.card.delegated')}</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{t('tasks.card.delegated')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="lembretes" 
                    className="text-xs gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-2 md:px-3 py-1.5"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lembretes</span>
                    {reminders.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {reminders.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Meus Lembretes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </Tabs>

        {/* Badge contador */}
        {totalTasks > 0 && (
          <motion.div
            key={totalTasks}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Badge variant="secondary" className="text-xs h-6 px-2">
              {totalTasks}
            </Badge>
          </motion.div>
        )}
      </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-hidden px-4 md:px-16 pt-4">
        {/* Conteúdo das Abas com Transições */}
        <div className="h-full overflow-auto pb-8">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'pendente' ? (
                  <TasksCardSkeleton />
                ) : (
                  <TasksListSkeleton count={6} />
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'pendente' && (
                  <motion.div
                    key="pendente"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <TasksGroupView
                      groups={tasks as TaskGroups}
                      onTaskClick={handleTaskClick}
                      onUpdate={refetch}
                      isGroupExpanded={isGroupExpanded}
                      toggleGroup={toggleGroup}
                      variant="table"
                    />
                  </motion.div>
                )}

                {activeTab === 'feito' && (
                  <motion.div
                    key="feito"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <TasksListView
                      tasks={tasks as Task[]}
                      onTaskClick={handleTaskClick}
                      onUpdate={refetch}
                      variant="table"
                    />
                  </motion.div>
                )}

                {activeTab === 'delegado' && (
                  <motion.div
                    key="delegado"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="h-full"
                  >
                    <TasksDelegatedView
                      tasks={Object.values(tasks).flat()}
                      onTaskClick={handleTaskClick}
                      onUpdate={refetch}
                      variant="table"
                    />
                  </motion.div>
                )}

                {activeTab === 'lembretes' && (
                  <motion.div
                    key="lembretes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="h-full"
                  >
                    {loadingReminders ? (
                      <TasksListSkeleton count={4} />
                    ) : reminders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">{t('tasks.reminder.noReminders')}</h3>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                          {t('tasks.reminder.noRemindersDesc')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reminders.map((reminder) => (
                          <motion.div
                            key={reminder.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-medium">{reminder.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {reminder.reminder_date && format(new Date(reminder.reminder_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {reminder.is_recurring && (
                                <Badge variant="outline" className="text-xs">
                                  {t('tasks.reminder.recurring')}
                                </Badge>
                              )}
                              <Badge 
                                variant={reminder.priority === 'high' || reminder.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {reminder.priority === 'low' ? t('tasks.priority.low') : 
                                 reminder.priority === 'medium' ? t('tasks.priority.medium') : 
                                 reminder.priority === 'high' ? t('tasks.priority.high') : t('tasks.priority.urgent')}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTaskId}
        open={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={refetch}
      />

      {/* Template Selector */}
      <TaskTemplateSelector
        open={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
      />

      {/* Quick Add Dialog */}
      <QuickAddTaskDialog
        open={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCreateTask={handleQuickAddTask}
        onCreateReminder={handleQuickAddReminder}
        initialTab={quickAddInitialTab}
      />

      {/* Settings Dialog */}
      <TasksSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
