import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTasksCard } from '@/hooks/tasks/use-tasks-card';
import {
  TasksGroupView
} from '@/components/tasks/tasks-group-view';
import { TaskModal } from '@/components/tasks/task-modal';
import { TaskTemplateSelector } from '@/components/tasks/task-template-selector';
import { QuickAddTaskDialog } from '@/components/tasks/quick-add-task-dialog';
import { TasksExpandedView } from '@/components/tasks/tasks-expanded-view';
import { MinimalCardSkeleton } from '@/components/minimal-card-skeleton';
import { Plus, CheckSquare, Maximize2, GripVertical, Sparkles, Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskGroups, Task, TaskTemplate } from '@/types/tasks';
import { createTask, getCurrentUserId } from '@/lib/tasks/tasks-storage';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { useWorkspace } from '@/contexts/workspace-context';
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks';
import { supabase } from '@/lib/supabase';

interface TasksCardProps {
  className?: string;
  dragHandleProps?: any;
}

export function TasksCard({ className, dragHandleProps }: TasksCardProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const cardName = t('sidebar.tasks');
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
    console.log('🔄 Workspace mudou, recarregando tasks...', currentWorkspace?.id);
    refetch();
  }, [currentWorkspace?.id, refetch]);

  // ✨ REALTIME: Sincronização automática de tasks (sem notificações duplicadas)
  useRealtimeTasks({
    workspaceId: currentWorkspace?.id || null,
    onUpdate: refetch,
    showNotifications: false, // Desabilitado para evitar toasts duplicados
    enabled: true,
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isExpandedViewOpen, setIsExpandedViewOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialTab, setQuickAddInitialTab] = useState<'tarefa' | 'lembrete'>('tarefa');
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  // Calcular total de tarefas para animação
  const totalTasks = Object.values(tasks).flat().length;
  const hasPendingTasks = totalTasks > 0;

  // Buscar contagem de membros do workspace
  useEffect(() => {
    const fetchMemberCount = async () => {
      if (!currentWorkspace?.id) {
        setMemberCount(0);
        return;
      }

      try {
        const { count } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'active');

        setMemberCount(count || 0);
      } catch (error) {
        console.error('Error fetching member count:', error);
        setMemberCount(0);
      }
    };

    fetchMemberCount();
  }, [currentWorkspace?.id]);

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
    try {
      console.log(' Template selecionado:', template);
      const userId = await getCurrentUserId();
      console.log(' User ID:', userId);
      
      const newTask: any = {
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
        list_id: null,
        parent_task_id: null,
        custom_fields: template.task.custom_fields || [],
        checklists: template.task.checklists || [],
        workspace_id: currentWorkspace?.id || null,
      };

      console.log(' Tarefa a ser criada:', newTask);
      const createdTask = await createTask(newTask);
      console.log(' Tarefa criada:', createdTask);

    // Criar sub-tarefas se houver E se a tarefa foi criada com sucesso
    if (template.task.subtasks && createdTask?.id) {
      for (const [index, subtaskData] of template.task.subtasks.entries()) {
        const subtask: any = {
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
          list_id: null,
          parent_task_id: createdTask.id, // ✨ Usar ID real da tarefa criada
          custom_fields: [],
          workspace_id: currentWorkspace?.id || null, // Mesmo workspace da tarefa pai
        };
        await createTask(subtask);
      }
    }

    toast.success(t('tasks.toast.taskCreated'));
    setIsTemplateSelectorOpen(false); // Fechar o seletor
    refetch(); // Atualizar lista imediatamente
    // ✨ REMOVIDO refetch() - deixar o Realtime fazer o trabalho
  } catch (error) {
    console.error(' Erro ao criar tarefa do template:', error);
    toast.error('Erro ao criar tarefa: ' + (error as Error).message);
  }
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
        assignee_ids: taskData.assignee_ids || [userId], // Usar assignees do dialog ou fallback para usuário atual
        created_by: userId,
        tag_ids: taskData.tags || [],
        project_id: null,
        list_id: taskData.list || 'lista-pessoal',
        parent_task_id: null,
        custom_fields: [],
        workspace_id: currentWorkspace?.id || null, // Permite tarefas pessoais (null) ou colaborativas
      };
      
      const createdTask = await createTask(newTask);
      toast.success(t('tasks.toast.taskCreated'));
      refetch(); // Atualizar lista imediatamente
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(t('tasks.toast.errorCreating'));
    }
  };

  const handleQuickAddReminder = async (reminderData: any) => {
    // O ReminderTab já cria o lembrete no Supabase com todas as funcionalidades avançadas
    // Este handler apenas atualiza a UI
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

  return (
    <>
    <Card className="flex flex-col w-full h-full bg-card overflow-hidden group">
        {/* Header Inline - Estilo Finance */}
        <CardHeader className="p-0">
          <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
            {/* Drag Handle + Input Editável */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* Drag Handle - sempre visível no mobile, hover no desktop */}
              <div 
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </div>
              
              {/* Nome Fixo + Badge Contador */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {cardName}
                </h3>
                
                {/* Badge contador animado */}
                {totalTasks > 0 && (
                  <motion.div
                    key={totalTasks}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {totalTasks}
                    </Badge>
                  </motion.div>
                )}
                
                {/* Badge Ao vivo - Realtime ativo */}
                {currentWorkspace && memberCount > 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[10px] border-green-500/30 bg-green-500/10">
                          <motion.div
                            className="h-1.5 w-1.5 rounded-full bg-green-500"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span className="hidden sm:inline">{t('realtime.live')}</span>
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tasks.card.realtimeSync')} {memberCount} {t('tasks.card.members')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Botões com Micro-interações - Sempre visíveis */}
            <TooltipProvider>
            <div className="flex items-center gap-0.5">
              {/* Botão Adicionar com Popover */}
              <Popover open={isAddPopoverOpen} onOpenChange={setIsAddPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <motion.div
                            whileHover={{ rotate: 90 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Plus className="size-3.5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('tasks.card.addTask')}</p>
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsTemplateSelectorOpen(true)}
                    >
                      <Sparkles className="size-3.5" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tasks.card.templates')}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Botão Expandir */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsExpandedViewOpen(true)}
                    >
                      <Maximize2 className="size-3.5" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tasks.card.expand')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>
          </div>
        </CardHeader>

        {/* Conteúdo */}
        <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
          {/* Mostrar apenas tarefas pendentes - tabs ficam no dialog */}
          <div className="h-full flex flex-col">
            {/* Conteúdo sem tabs */}
            <div className="flex-1 overflow-auto relative">
              {loading ? (
                // Skeleton com animação
                <div className="p-2 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: i * 0.1,
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                    >
                      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                      <Skeleton className="h-3.5 flex-1 max-w-[160px]" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              ) : totalTasks === 0 ? (
                // Empty state
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center h-full text-center py-16 px-6"
                >
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-2">{t('tasks.card.empty')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('tasks.card.createFirst')}
                  </p>
                </motion.div>
              ) : (
                // Mostrar apenas tarefas pendentes no card
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <TasksGroupView
                    groups={tasks as TaskGroups}
                    onTaskClick={handleTaskClick}
                    onUpdate={refetch}
                    isGroupExpanded={isGroupExpanded}
                    toggleGroup={toggleGroup}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Expanded View */}
      <TasksExpandedView
        open={isExpandedViewOpen}
        onClose={() => setIsExpandedViewOpen(false)}
        tasks={Object.values(tasks).flat()}
        onTaskClick={handleTaskClick}
        onDeleteTask={async (taskId) => {
          try {
            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('id', taskId);
            
            if (error) throw error;
            toast.success(t('tasks.toast.taskDeleted'));
            refetch();
          } catch (error: any) {
            console.error('Error deleting task:', error);
            toast.error(t('tasks.toast.errorDeleting'));
          }
        }}
        onToggleComplete={async (taskId) => {
          try {
            // Buscar tarefa atual para verificar status
            const allTasks = Object.values(tasks).flat();
            const task = allTasks.find(t => t.id === taskId);
            
            if (!task) {
              toast.error(t('tasks.toast.notFound'));
              return;
            }

            const isCompleted = !!task.completed_at;
            const { error } = await supabase
              .from('tasks')
              .update({
                completed_at: isCompleted ? null : new Date().toISOString(),
                status: isCompleted ? 'todo' : 'done'
              })
              .eq('id', taskId);
            
            if (error) throw error;
            
            toast.success(isCompleted ? t('tasks.toast.taskReopened') : t('tasks.toast.taskCompleted'));
            refetch();
          } catch (error: any) {
            console.error('Error toggling task:', error);
            toast.error(t('tasks.toast.errorUpdating'));
          }
        }}
      />

      {/* Quick Add Dialog */}
      <QuickAddTaskDialog
        open={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCreateTask={handleQuickAddTask}
        onCreateReminder={handleQuickAddReminder}
        initialTab={quickAddInitialTab}
      />
    </>
  );
}