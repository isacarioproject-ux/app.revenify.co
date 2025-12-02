import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, User } from '@/types/tasks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, UserPlus, Calendar, Flag, Check, CheckCircle2 } from 'lucide-react';
import { updateTask, deleteTask, getUsers } from '@/lib/tasks/tasks-storage';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { useWorkspace } from '@/contexts/workspace-context';

interface TaskRowInlineActionsProps {
  task: Task;
  onUpdate: () => void;
}

export function TaskRowInlineActions({ task, onUpdate }: TaskRowInlineActionsProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const dateFnsLocale = useDateFnsLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [showAssignee, setShowAssignee] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('tasks.actions.deleteConfirm'))) {
      try {
        await deleteTask(task.id);
        toast.success(t('tasks.actions.deleted'));
        onUpdate();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        toast.error(t('tasks.actions.deleteError'));
      }
    }
  };

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updates: Partial<Task> = {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    };
    try {
      await updateTask(task.id, updates);
      toast.success(newStatus === 'done' ? t('tasks.actions.completed') : t('tasks.actions.reopened'));
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error(t('tasks.actions.updateError'));
    }
  };

  return (
    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <TooltipProvider>
        {/* Deletar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <Trash2 className="size-3.5 text-muted-foreground" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('tasks.actions.delete')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Atribuir */}
        <Popover open={showAssignee} onOpenChange={setShowAssignee}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <UserPlus className="size-3.5 text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.actions.assignee')}</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-2" align="start" side="left">
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {currentWorkspace ? `${t('tasks.actions.workspaceMembers')} ${currentWorkspace.name}` : t('tasks.actions.users')}
              </div>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newAssignees = task.assignee_ids.includes(user.id)
                      ? task.assignee_ids.filter(id => id !== user.id)
                      : [...task.assignee_ids, user.id];
                    updateTask(task.id, { assignee_ids: newAssignees });
                    toast.success(t('tasks.actions.assignedTo'));
                    onUpdate();
                    setShowAssignee(false);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs bg-blue-500 text-white">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="dark:text-white">{user.name}</span>
                  {task.assignee_ids.includes(user.id) && (
                    <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Data */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Calendar className="size-3.5 text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.actions.dueDate')}</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start" side="left">
            <div className="p-3 border-b dark:border-gray-700">
              <p className="text-sm font-medium dark:text-white">{t('tasks.reminder.selectDate')}</p>
            </div>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  updateTask(task.id, { due_date: format(date, 'yyyy-MM-dd') });
                  toast.success(t('tasks.actions.dateSet'));
                  onUpdate();
                  setShowCalendar(false);
                }
              }}
              locale={dateFnsLocale}
              className="rounded-md border-0"
            />
            <div className="p-3 border-t dark:border-gray-700 space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  setSelectedDate(today);
                  updateTask(task.id, { due_date: format(today, 'yyyy-MM-dd') });
                  toast.success(t('tasks.actions.dateSet'));
                  onUpdate();
                  setShowCalendar(false);
                }}
                className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
              >
                {t('tasks.actions.today')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                  updateTask(task.id, { due_date: format(tomorrow, 'yyyy-MM-dd') });
                  toast.success(t('tasks.actions.dateSet'));
                  onUpdate();
                  setShowCalendar(false);
                }}
                className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
              >
                {t('tasks.actions.tomorrow')}
              </button>
              {task.due_date && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(undefined);
                    updateTask(task.id, { due_date: null });
                    toast.success(t('tasks.actions.dateRemoved'));
                    onUpdate();
                    setShowCalendar(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
                >
                  {t('tasks.actions.removeDate')}
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority */}
        <Popover open={showPriority} onOpenChange={setShowPriority}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Flag className="size-3.5 text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.actions.changePriority')}</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent className="w-56 p-2" align="start" side="left">
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {t('tasks.priority.label')}
              </div>
              {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => {
                const labels: Record<string, string> = {
                  urgent: t('tasks.priority.urgent'),
                  high: t('tasks.priority.high'),
                  medium: t('tasks.priority.medium'),
                  low: t('tasks.priority.low'),
                };
                const colors: Record<string, string> = {
                  urgent: 'text-red-500',
                  high: 'text-orange-500',
                  medium: 'text-yellow-500',
                  low: 'text-gray-500',
                };
                return (
                  <button
                    key={priority}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, { priority });
                      toast.success(`${t('tasks.prioritySet')}: ${labels[priority]}`);
                      onUpdate();
                      setShowPriority(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Flag className={`size-4 ${colors[priority]}`} />
                    <span className="dark:text-white">{labels[priority]}</span>
                    {task.priority === priority && (
                      <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Concluir */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStatusToggle}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <Check className="size-3.5 text-muted-foreground" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{task.status === 'done' ? t('tasks.actions.reopenTask') : t('tasks.actions.markComplete')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

