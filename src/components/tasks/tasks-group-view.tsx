import { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, TaskGroups } from '@/types/tasks';
import { ChevronDown, ChevronRight, Plus, Bell } from 'lucide-react';
import { TaskRow } from '@/components/tasks/task-row';
import { QuickAddTaskDialog } from '@/components/tasks/quick-add-task-dialog';
import { useI18n } from '@/hooks/use-i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksGroupViewProps {
  groups: TaskGroups;
  onTaskClick: (taskId: string) => void;
  onUpdate: () => void;
  isGroupExpanded: (groupName: string) => boolean;
  toggleGroup: (groupName: string) => void;
  variant?: 'compact' | 'table';
}

const getGroupLabel = (t: any, key: string) => {
  const labels: Record<string, string> = {
    hoje: t('tasks.group.today'),
    em_atraso: t('tasks.group.overdue'),
    proximo: t('tasks.group.upcoming'),
    nao_programado: t('tasks.group.notScheduled'),
  };
  return labels[key] || key;
};

const groupColors = {
  hoje: 'text-blue-600 dark:text-blue-400',
  em_atraso: 'text-red-600 dark:text-red-400',
  proximo: 'text-green-600 dark:text-green-400',
  nao_programado: 'text-gray-600 dark:text-gray-400',
};

export function TasksGroupView({
  groups,
  onTaskClick,
  onUpdate,
  isGroupExpanded,
  toggleGroup,
  variant = 'compact',
}: TasksGroupViewProps) {
  const { t } = useI18n();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [quickAddInitialTab, setQuickAddInitialTab] = useState<'tarefa' | 'lembrete'>('tarefa');

  const handleAddTask = (groupKey: string) => {
    setSelectedGroup(groupKey);
    setQuickAddInitialTab('tarefa');
    setIsQuickAddOpen(true);
  };

  const handleAddReminder = (groupKey: string) => {
    setSelectedGroup(groupKey);
    setQuickAddInitialTab('lembrete');
    setIsQuickAddOpen(true);
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const { createTask, getCurrentUserId } = await import('@/lib/tasks/tasks-storage');
      
      const userId = await getCurrentUserId();
      console.log('👤 User ID:', userId);
      
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
      
      console.log('📝 Criando tarefa:', newTask);
      const createdTask = await createTask(newTask);
      console.log('✅ Tarefa criada:', createdTask);
      
      const { toast } = await import('sonner');
      toast.success('Tarefa criada com sucesso!');
      
      onUpdate();
      
      // Retornar ID da tarefa criada para uso posterior
      return createdTask?.id || null;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      const { toast } = await import('sonner');
      toast.error('Erro ao criar tarefa: ' + (error as Error).message);
      return null;
    }
  };

  const handleCreateAndOpenTask = async (taskData: any) => {
    const taskId = await handleCreateTask(taskData);
    
    // Abrir modal da tarefa criada
    if (taskId) {
      // Pequeno delay para garantir que a tarefa foi salva
      setTimeout(() => {
        onTaskClick(taskId);
      }, 100);
    }
  };

  return (
    <div className="space-y-1">
      
      {(Object.keys(groups) as Array<keyof TaskGroups>).map(groupKey => {
        const tasks = groups[groupKey];
        const isExpanded = isGroupExpanded(groupKey);

        if (tasks.length === 0) return null;

        return (
          <div key={groupKey}>
            {/* Group Header */}
            <div className="flex items-center gap-0.5">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleGroup(groupKey)}
                className={`flex items-center gap-1 flex-1 py-0.5 px-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors ${groupColors[groupKey]}`}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="size-3" />
                </motion.div>
                <span className="text-xs font-medium">{getGroupLabel(t, groupKey)}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">({tasks.length})</span>
              </motion.button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 dark:text-gray-400"
                    title={t('tasks.common.add')}
                  >
                    <Plus className="size-3.5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleAddTask(groupKey)}>
                    <Plus className="size-4 mr-2" />
                    {t('tasks.group.addTask')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddReminder(groupKey)}>
                    <Bell className="size-4 mr-2" />
                    {t('tasks.group.addReminder')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Group Tasks com AnimatePresence */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 mt-1 space-y-1 overflow-hidden"
              >
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TaskRow
                      task={task}
                      onTaskClick={onTaskClick}
                      onUpdate={onUpdate}
                      variant={variant}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}

      {Object.values(groups).every(g => g.length === 0) && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t('tasks.reminder.noTasks')}</p>
        </div>
      )}

      <QuickAddTaskDialog
        open={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCreateTask={handleCreateTask}
        onCreateAndOpen={handleCreateAndOpenTask}
        onCreateReminder={async () => { onUpdate(); }}
        defaultGroup={selectedGroup}
        initialTab={quickAddInitialTab}
      />
    </div>
  );
}