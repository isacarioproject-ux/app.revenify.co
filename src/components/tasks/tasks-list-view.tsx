import { Task } from '@/types/tasks';
import { motion } from 'framer-motion';
import { TaskRow } from '@/components/tasks/task-row';
import { TasksListSkeleton } from '@/components/tasks/tasks-list-skeleton';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';

interface TasksListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onUpdate: () => void;
  loading?: boolean;
  variant?: 'compact' | 'table';
}

export function TasksListView({ tasks, onTaskClick, onUpdate, loading = false, variant = 'compact' }: TasksListViewProps) {
  const { t } = useI18n();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);

  if (loading || isInitialLoad) {
    return <TasksListSkeleton />;
  }

  return (
    <div className="space-y-1">
      
      {tasks.length > 0 ? (
        tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <TaskRow
              task={task}
              onTaskClick={onTaskClick}
              onUpdate={onUpdate}
              variant={variant}
            />
          </motion.div>
        ))
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <p>{t('tasks.list.noTasks')}</p>
        </motion.div>
      )}
    </div>
  );
}