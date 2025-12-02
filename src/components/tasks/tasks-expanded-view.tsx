import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Plus,
  Maximize2,
  CheckSquare,
  Minimize2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Task, User } from '@/types/tasks';
import { TaskRow } from './task-row';
import { TasksCardSkeleton, TasksListSkeleton } from './tasks-card-skeleton';
import { getCurrentUserId, getUsers } from '@/lib/tasks/tasks-storage';
import { useI18n } from '@/hooks/use-i18n';

interface TasksExpandedViewProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}

export function TasksExpandedView({
  open,
  onClose,
  tasks,
  onTaskClick,
  onDeleteTask,
  onToggleComplete,
}: TasksExpandedViewProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('pendente');
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId).catch(console.error);
    getUsers().then(setUsers).catch(console.error);
  }, []);

  // Calcular totais para badges animados
  const totalTasks = tasks.length;
  const hasPendingTasks = totalTasks > 0;

  const handleUpdate = () => {
    forceUpdate({});
  };

  const pendingTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  // Tarefas delegadas (atribuídas a outros)
  const delegatedTasks = tasks.filter(task => {
    if (task.assignee_ids.length === 0) return false;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        showClose={false}
        className={`!w-screen !max-w-5xl md:!rounded-lg !rounded-none p-0 gap-0 ${
          isFullscreen ? '!h-screen !max-w-full !rounded-none' : '!h-[85vh] md:!w-[90vw]'
        }`}
      >
        {/* Content com Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          {/* Header Único - Ícone + Tabs + Botões - Responsivo */}
          <div className="flex items-center justify-between border-b dark:border-gray-800 px-1.5 md:px-2 py-1.5">
            {/* Ícone Animado + Tabs */}
            <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0 overflow-x-auto">
              {/* Ícone com pulse */}
              <motion.div
                animate={{
                  scale: hasPendingTasks ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <CheckSquare className="size-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
              
              {/* Badge contador */}
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
              
              {/* Tabs - Menores em mobile */}
              <TabsList variant="transparent">
                <TabsTrigger value="pendente" className="text-[10px] md:text-sm px-2 md:px-3">{t('tasks.expanded.pending')}</TabsTrigger>
                <TabsTrigger value="em_progresso" className="text-[10px] md:text-sm px-2 md:px-3">{t('tasks.expanded.inProgress')}</TabsTrigger>
                <TabsTrigger value="concluido" className="text-[10px] md:text-sm px-2 md:px-3">{t('tasks.expanded.completed')}</TabsTrigger>
              </TabsList>
            </div>

            {/* Botões com Micro-interações */}
            <TooltipProvider>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="size-3.5" />
                      ) : (
                        <Maximize2 className="size-3.5" />
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? t('tasks.expanded.restore') : t('tasks.expanded.fullscreen')}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Fechar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={onClose}>
                      <X className="size-3.5" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tasks.expanded.close')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>
          </div>

          {/* Tabs Content com Transições */}
          <div className="flex-1 overflow-y-auto p-2 md:p-4 relative">
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
                  >
                    <TabsContent value="pendente" className="mt-0 space-y-6">
                {/* Hoje */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{t('tasks.expanded.today')}</span>
                      <span className="text-xs font-normal text-gray-500">
                        {pendingTasks.length}
                      </span>
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button variant="ghost" size="sm">
                            <motion.div
                              whileHover={{ rotate: 90 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Plus className="size-4 mr-1" />
                            </motion.div>
                            {t('tasks.expanded.addTask')}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>{t('tasks.expanded.addTask')}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    {pendingTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TaskRow 
                          task={task} 
                          onTaskClick={onTaskClick}
                          onUpdate={handleUpdate}
                          onToggleComplete={onToggleComplete}
                          onDelete={onDeleteTask}
                        />
                      </motion.div>
                    ))}
                    {pendingTasks.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 text-gray-500 dark:text-gray-400"
                      >
                        <p className="text-sm">{t('tasks.expanded.noPending')}</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Em atraso */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>{t('tasks.expanded.overdue')}</span>
                    <span className="text-xs font-normal text-gray-500">0</span>
                  </h3>
                </div>

                {/* Próximo */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>{t('tasks.expanded.upcoming')}</span>
                    <span className="text-xs font-normal text-gray-500">0</span>
                  </h3>
                </div>
                    </TabsContent>
                  </motion.div>
                )}

                {activeTab === 'em_progresso' && (
                  <motion.div
                    key="em_progresso"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <TabsContent value="em_progresso" className="mt-0">
                      <div className="space-y-2">
                        {inProgressTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TaskRow 
                              task={task} 
                              onTaskClick={onTaskClick}
                              onUpdate={handleUpdate}
                              onToggleComplete={onToggleComplete}
                              onDelete={onDeleteTask}
                            />
                          </motion.div>
                        ))}
                        {inProgressTasks.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            <p className="text-sm">{t('tasks.expanded.noInProgress')}</p>
                          </motion.div>
                        )}
                      </div>
                    </TabsContent>
                  </motion.div>
                )}

                {activeTab === 'concluido' && (
                  <motion.div
                    key="concluido"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <TabsContent value="concluido" className="mt-0">
                      <div className="space-y-2">
                        {completedTasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TaskRow 
                              task={task} 
                              onTaskClick={onTaskClick}
                              onUpdate={handleUpdate}
                              onToggleComplete={onToggleComplete}
                              onDelete={onDeleteTask}
                            />
                          </motion.div>
                        ))}
                        {completedTasks.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            <p className="text-sm">{t('tasks.expanded.noCompleted')}</p>
                          </motion.div>
                        )}
                      </div>
                    </TabsContent>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </Tabs>

        <DialogTitle className="sr-only">{t('tasks.expanded.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('tasks.expanded.description')}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
