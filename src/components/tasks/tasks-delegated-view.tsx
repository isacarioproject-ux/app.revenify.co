import { Task, User } from '@/types/tasks';
import { motion } from 'framer-motion';
import { TaskRow } from './task-row';
import { getCurrentUserId, getUsers } from '@/lib/tasks/tasks-storage';
import { useI18n } from '@/hooks/use-i18n';
import { useState, useEffect } from 'react';

interface TasksDelegatedViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onUpdate: () => void;
  variant?: 'compact' | 'table';
}

export function TasksDelegatedView({ tasks, onTaskClick, onUpdate, variant = 'compact' }: TasksDelegatedViewProps) {
  const { t } = useI18n();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId).catch(console.error);
    getUsers().then(setUsers).catch(console.error);
  }, []);

  // Filtrar tarefas delegadas (atribuídas a outros, não a mim)
  const delegatedTasks = tasks.filter(task => {
    // Tarefa está atribuída a alguém
    if (task.assignee_ids.length === 0) return false;
    
    // Tarefa NÃO está atribuída a mim OU está atribuída a mim E a outros
    const isAssignedToMe = task.assignee_ids.includes(currentUserId);
    const hasOtherAssignees = task.assignee_ids.some(id => id !== currentUserId);
    
    return hasOtherAssignees;
  });

  // Agrupar por responsável
  const tasksByAssignee = delegatedTasks.reduce((acc, task) => {
    task.assignee_ids.forEach(assigneeId => {
      if (assigneeId !== currentUserId) {
        if (!acc[assigneeId]) {
          acc[assigneeId] = [];
        }
        acc[assigneeId].push(task);
      }
    });
    return acc;
  }, {} as Record<string, Task[]>);

  if (delegatedTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">{t('tasks.delegated.noDelegated')}</p>
          <p className="text-xs mt-1">{t('tasks.delegated.assignTo')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(tasksByAssignee).map(([assigneeId, assigneeTasks], groupIndex) => {
        const user = users.find(u => u.id === assigneeId);
        if (!user) return null;

        return (
          <motion.div
            key={assigneeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            {/* Header do Responsável com animação */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="flex items-center gap-2 flex-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium"
                >
                  {user.avatar || user.name.substring(0, 2).toUpperCase()}
                </motion.div>
                <span className="text-sm font-medium dark:text-white">{user.name}</span>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  ({assigneeTasks.length})
                </motion.span>
              </div>
            </motion.div>

            {/* Tarefas do Responsável com stagger */}
            <div className="ml-4 space-y-1">
              {assigneeTasks.map((task, taskIndex) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.1 + taskIndex * 0.03 }}
                >
                  <TaskRow
                    task={task}
                    onTaskClick={onTaskClick}
                    onUpdate={onUpdate}
                    variant={variant}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
