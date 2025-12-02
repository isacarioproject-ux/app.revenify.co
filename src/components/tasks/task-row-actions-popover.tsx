import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, User } from '@/types/tasks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Trash2, Calendar, UserPlus, Flag, CheckCircle2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { updateTask, deleteTask, getUsers } from '@/lib/tasks/tasks-storage';
import { useWorkspace } from '@/contexts/workspace-context';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale';
import { useI18n } from '@/hooks/use-i18n';
import { Separator } from '@/components/ui/separator';

interface TaskRowActionsPopoverProps {
  task: Task;
  onUpdate: () => void;
}

export function TaskRowActionsPopover({ task, onUpdate }: TaskRowActionsPopoverProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const dateFnsLocale = useDateFnsLocale();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);
  const [showActions, setShowActions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('tasks.actions.deleteConfirm'))) {
      try {
        await deleteTask(task.id);
        toast.success(t('tasks.actions.deleted'));
        setShowActions(false);
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
      setShowActions(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(t('tasks.actions.updateError'));
    }
  };

  return (
    <Popover open={showActions} onOpenChange={setShowActions}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Settings className="size-4" />
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-1.5" align="end" sideOffset={8}>
        <div className="space-y-0.5">
          {/* Atribuir Responsável */}
          <Popover open={showAssignee} onOpenChange={setShowAssignee}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <UserPlus className="size-4 text-blue-500" />
                <span className="dark:text-white">{t('tasks.row.assign')}</span>
              </button>
            </PopoverTrigger>
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
                      setShowActions(false);
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

          {/* Alterar Data */}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Calendar className="size-4 text-green-500" />
                <span className="dark:text-white">{t('tasks.row.changeDate')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start" side="left">
              <div className="p-3 border-b dark:border-gray-700">
                <p className="text-sm font-medium dark:text-white">{t('tasks.quickAdd.selectDate')}</p>
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
                    setShowActions(false);
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
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                >
                  {t('tasks.common.today')}
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
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                >
                  {t('tasks.common.tomorrow')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setSelectedDate(nextWeek);
                    updateTask(task.id, { due_date: format(nextWeek, 'yyyy-MM-dd') });
                    toast.success(t('tasks.actions.dateSet'));
                    onUpdate();
                    setShowCalendar(false);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                >
                  {t('tasks.common.nextWeek')}
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
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
                  >
                    {t('tasks.toast.dateRemoved')}
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Set Priority */}
          <Popover open={showPriority} onOpenChange={setShowPriority}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <Flag className="size-4 text-orange-500" />
                <span className="dark:text-white">{t('tasks.row.setPriority')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start" side="left">
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t('tasks.priority.label')}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(task.id, { priority: 'urgent' });
                    toast.success(`${t('tasks.prioritySet')}: ${t('tasks.priority.urgent')}`);
                    onUpdate();
                    setShowPriority(false);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-red-500" />
                  <span className="dark:text-white">{t('tasks.priority.urgent')}</span>
                  {task.priority === 'urgent' && (
                    <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(task.id, { priority: 'high' });
                    toast.success(`${t('tasks.prioritySet')}: ${t('tasks.priority.high')}`);
                    onUpdate();
                    setShowPriority(false);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-orange-500" />
                  <span className="dark:text-white">{t('tasks.priority.high')}</span>
                  {task.priority === 'high' && (
                    <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(task.id, { priority: 'medium' });
                    toast.success(`${t('tasks.prioritySet')}: ${t('tasks.priority.medium')}`);
                    onUpdate();
                    setShowPriority(false);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-yellow-500" />
                  <span className="dark:text-white">{t('tasks.priority.medium')}</span>
                  {task.priority === 'medium' && (
                    <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(task.id, { priority: 'low' });
                    toast.success(`${t('tasks.prioritySet')}: ${t('tasks.priority.low')}`);
                    onUpdate();
                    setShowPriority(false);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-gray-500" />
                  <span className="dark:text-white">{t('tasks.priority.low')}</span>
                  {task.priority === 'low' && (
                    <CheckCircle2 className="size-4 ml-auto text-blue-600" />
                  )}
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator className="my-1" />

          {/* Marcar como Concluída */}
          <button
            onClick={handleStatusToggle}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-green-50 dark:hover:bg-green-950 text-green-600 dark:text-green-400 text-left transition-colors"
          >
            <CheckCircle2 className="size-4" />
            <span>{task.status === 'done' ? t('tasks.toast.reopened') : t('tasks.row.markDone')}</span>
          </button>

          <Separator className="my-1" />

          {/* Excluir */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-left transition-colors"
          >
            <Trash2 className="size-4" />
            <span>{t('tasks.row.delete')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
