import { getUsers } from '@/lib/tasks/tasks-storage';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, User } from '@/types/tasks';
import { TaskRowActionsPopover } from '@/components/tasks/task-row-actions-popover';
import { TaskRowInlineActions } from '@/components/tasks/task-row-inline-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Trash2, UserPlus, Flag, Check } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';
import { useI18n } from '@/hooks/use-i18n';

export interface TaskRowProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
  onUpdate: () => void;
  onToggleComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  simplified?: boolean;
  variant?: 'compact' | 'table';
}

export function TaskRow({ task, onTaskClick, onUpdate, onToggleComplete, onDelete, simplified = false, variant = 'compact' }: TaskRowProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const [users, setUsers] = useState<User[]>([]);
  
  // Checkbox independente do status - salva no localStorage
  const checkboxKey = `task-checkbox-${task.id}`;
  const [isChecked, setIsChecked] = useState(() => {
    const saved = localStorage.getItem(checkboxKey);
    return saved === 'true';
  });

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  // Salvar checkbox no localStorage (não muda status da tarefa)
  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    localStorage.setItem(checkboxKey, String(checked));
  };

  const assignees = users.filter(u => task.assignee_ids.includes(u.id));
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';

  const priorityIcons: Record<string, string> = {
    urgent: '🔴',
    high: '🏳️',
    medium: '🟡',
    low: '🟢',
  };

  const priorityLabels: Record<string, string> = {
    urgent: t('tasks.priority.urgent'),
    high: t('tasks.priority.high'),
    medium: t('tasks.priority.medium'),
    low: t('tasks.priority.low'),
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div
      className="group flex items-center gap-1.5 py-1 px-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors w-full"
      onClick={() => onTaskClick(task.id)}
    >
      {/* Checkbox Status - salva no banco */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={isChecked}
          onCheckedChange={(checked) => handleCheckboxChange(checked as boolean)}
          className="cursor-pointer"
        />
      </div>

      {/* Título */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-xs truncate ${
            task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'dark:text-gray-100'
          }`}
        >
          {task.title}
        </div>

        {/* Badges/Localização - Sempre visível em table, ocultar em cards pequenos */}
        {!simplified && (
          <div className={variant === 'table' ? 'flex items-center gap-0.5 mt-0.5' : 'hidden 2xl:flex items-center gap-0.5 mt-0.5'}>
            {task.location && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0 cursor-default">
                        {task.location}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.location}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {task.workspace && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[60px] cursor-default">{task.workspace}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.workspace}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>

      {/* Responsáveis - Sempre visível em table */}
      {!simplified && assignees.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={variant === 'table' ? 'flex items-center gap-0.5 cursor-default' : 'hidden lg:flex items-center gap-0.5 cursor-default'}>
                <Avatar className="size-3.5">
                  <AvatarFallback className="text-[7px]">{assignees[0].avatar || assignees[0].name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                {assignees.length > 1 && (
                  <span className="text-[9px] text-gray-500">+{assignees.length - 1}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {assignees.map(assignee => (
                  <p key={assignee.id}>{assignee.name}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Data de Vencimento - Sempre visível em table */}
      {!simplified && task.due_date && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`${variant === 'table' ? 'flex' : 'hidden lg:flex'} items-center gap-0.5 text-[10px] cursor-default ${
                  isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Calendar className="size-2.5" />
                <span className="whitespace-nowrap">{formatDate(task.due_date)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.dueDate')}: {new Date(task.due_date).toLocaleDateString()}</p>
              {isOverdue && <p className="text-red-500 font-semibold mt-1">{t('tasks.overdue')}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Priority - Always visible in table */}
      {!simplified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={variant === 'table' ? 'flex items-center text-[11px] leading-none cursor-default' : 'hidden xl:flex items-center text-[11px] leading-none cursor-default'}>
                {priorityIcons[task.priority]}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.priority.label')}: {priorityLabels[task.priority]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Ações - Inline em table, popover em compact */}
      {variant === 'table' ? (
        // Ícones inline animados para página - Monocromático com Popovers funcionais
        <TaskRowInlineActions task={task} onUpdate={onUpdate} />
      ) : (
        // Popover para card compacto
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center flex-shrink-0">
          <TaskRowActionsPopover task={task} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
