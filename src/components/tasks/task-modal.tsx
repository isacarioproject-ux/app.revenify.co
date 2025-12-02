import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskWithDetails } from '@/types/tasks';
import { getTaskWithDetails, getTasks, deleteTask } from '@/lib/tasks/tasks-storage';
import { TaskDetailView } from '@/components/tasks/task-detail-view';
import { TaskActivitySidebar } from '@/components/tasks/task-activity-sidebar';
import { TaskModalSkeleton } from '@/components/tasks/task-modal-skeleton';
import { ChevronLeft, ChevronRight, Share2, X, MoreVertical, Maximize2, Minimize2, ListChecks, Star, Grid3x3, CheckSquare, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { supabase } from '@/lib/supabase';

interface TaskModalProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskModal({ taskId, open, onClose, onUpdate }: TaskModalProps) {
  const { t } = useI18n();
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [allTaskIds, setAllTaskIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Função para gerar link público de compartilhamento
  const handleShare = async () => {
    if (!task?.id) return;
    
    setIsSharing(true);
    try {
      // Verificar se já existe um share para esta tarefa
      const { data: existingShare } = await supabase
        .from('task_shares')
        .select('token')
        .eq('task_id', task.id)
        .eq('is_active', true)
        .single();

      let shareToken: string;

      if (existingShare?.token) {
        // Usar token existente
        shareToken = existingShare.token;
      } else {
        // Gerar novo token
        shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Você precisa estar logado');
          return;
        }

        // Criar novo share
        const { error } = await supabase
          .from('task_shares')
          .insert({
            task_id: task.id,
            token: shareToken,
            created_by: user.id,
            expires_at: null, // Sem expiração
          });

        if (error) throw error;
      }

      // Gerar URL e copiar
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('tasks.modal.publicLinkCopied'));
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!taskId) return;

    console.log('🔄 TaskModal: Recarregando tarefa', taskId);
    
    // Simular loading
    setLoading(true);
    
    // Carregar tarefa de forma assíncrona
    const loadTask = async () => {
      try {
        const taskData = await getTaskWithDetails(taskId);
        console.log('📋 Tarefa carregada:', taskData);
        setTask(taskData || null);
        
        // Carregar estado de favorito do localStorage
        const favorites = JSON.parse(localStorage.getItem('task-favorites') || '[]');
        setIsFavorite(favorites.includes(taskId));
      } catch (error) {
        console.error('Erro ao carregar tarefa:', error);
        toast.error(t('tasks.modal.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadTask();

    // Carregar lista de IDs de tarefas para navegação
    const loadTaskIds = async () => {
      try {
        const allTasks = await getTasks();
        const ids = allTasks.map(t => t.id);
        setAllTaskIds(ids);
        setCurrentIndex(ids.indexOf(taskId));
      } catch (error) {
        console.error('Erro ao carregar IDs das tarefas:', error);
      }
    };
    loadTaskIds();
  }, [taskId, open]); // Recarregar quando taskId ou open mudar

  const handleRefresh = async () => {
    if (!taskId) return;
    try {
      const taskData = await getTaskWithDetails(taskId);
      setTask(taskData || null);
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(t('tasks.modal.updateError'));
    }
  };

  const handleNavigate = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < allTaskIds.length) {
      const newTaskId = allTaskIds[newIndex];
      try {
        const taskData = await getTaskWithDetails(newTaskId);
        setTask(taskData || null);
        setCurrentIndex(newIndex);
      } catch (error) {
        console.error('Erro ao navegar para tarefa:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm(t('tasks.modal.deleteConfirm'))) {
      try {
        await deleteTask(task.id);
        toast.success(t('tasks.modal.deleteSuccess'));
        onClose();
        onUpdate(); // Atualizar lista imediatamente
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        toast.error(t('tasks.toast.errorDeleting'));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle className="sr-only">
        {task ? task.title : t('tasks.modal.loading')}
      </DialogTitle>
      <DialogContent 
        showClose={false} 
        className={cn(
          "p-0 gap-0",
          isMaximized 
            ? "!fixed !inset-0 !w-screen !max-w-none !h-screen !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !transform-none !m-0 !rounded-none" 
            : isMobile
              ? "!fixed !inset-0 !w-screen !max-w-none !h-screen !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !transform-none !m-0 !rounded-none"
              : "!w-[57rem] !max-w-[95vw] !h-[75vh]"
        )}
      >
        {/* Mostrar Skeleton durante loading */}
        {loading || !task ? (
          <TaskModalSkeleton />
        ) : (
          <>
            {/* Header com Ícone Animado - Compacto em mobile */}
            <div className="flex items-center justify-between px-1 md:px-2 py-1.5 border-b dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
                {/* Ícone Animado + Badge - Ocultar ícone em mobile */}
                <div className="flex items-center gap-1 md:gap-2">
                  {/* Ícone CheckSquare - Apenas Desktop */}
                  <motion.div
                    className="hidden md:block"
                    animate={{
                  scale: task.status === 'todo' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
              </motion.div>
              {/* Badge - Apenas Desktop */}
              {task.subtasks && task.subtasks.length > 0 && (
                <motion.div
                  className="hidden md:block"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {task.subtasks.length}
                  </Badge>
                </motion.div>
              )}
            </div>
            {/* Navegação com Micro-interações */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10"
                      onClick={() => handleNavigate('prev')}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>{t('tasks.modal.previous')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10"
                      onClick={() => handleNavigate('next')}
                      disabled={currentIndex === allTaskIds.length - 1}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>{t('tasks.modal.next')}</TooltipContent>
              </Tooltip>
            </div>

            {/* Localização e Data - Ocultos em mobile para economizar espaço */}
          </div>

          <div className="flex items-center gap-0 md:gap-0.5 flex-shrink-0">
            {/* Favorito com Animação - Salva no localStorage */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    onClick={() => {
                      const newFavorite = !isFavorite;
                      setIsFavorite(newFavorite);
                      // Salvar em localStorage
                      const favorites = JSON.parse(localStorage.getItem('task-favorites') || '[]');
                      if (newFavorite) {
                        if (!favorites.includes(task?.id)) {
                          favorites.push(task?.id);
                        }
                        toast.success(t('tasks.modal.addedToFavorites'));
                      } else {
                        const index = favorites.indexOf(task?.id);
                        if (index > -1) favorites.splice(index, 1);
                        toast.success(t('tasks.modal.removedFromFavorites'));
                      }
                      localStorage.setItem('task-favorites', JSON.stringify(favorites));
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: isFavorite ? [0, -10, 10, -10, 0] : 0,
                        scale: isFavorite ? [1, 1.2, 1] : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Star className={`size-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </motion.div>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{isFavorite ? t('tasks.modal.removeFromFavorites') : t('tasks.modal.addToFavorites')}</TooltipContent>
            </Tooltip>

            {/* Toggle Subtarefas com Animação */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant={showSubtasks ? "secondary" : "ghost"} 
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                    onClick={() => setShowSubtasks(!showSubtasks)}
                  >
                    <ListChecks className="size-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{t('tasks.modal.subtasks')}</TooltipContent>
            </Tooltip>

            {/* Toggle Chat/Atividade (Mobile) */}
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={showActivitySidebar ? "secondary" : "ghost"} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowActivitySidebar(!showActivitySidebar)}
                    >
                      <Grid3x3 className="size-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>{t('tasks.modal.chatActivity')}</TooltipContent>
              </Tooltip>
            )}

            {/* Maximizar com Animação */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => setIsMaximized(!isMaximized)}>
                    {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{isMaximized ? t('tasks.modal.restore') : t('tasks.modal.maximize')}</TooltipContent>
            </Tooltip>

            {/* Compartilhar - Gera link público */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 md:h-10 md:w-10"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{t('tasks.modal.sharePublic')}</TooltipContent>
            </Tooltip>

            {/* Menu 3 Pontos com Animação */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('tasks.modal.moreOptions')}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="size-4" />
                  {t('tasks.modal.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fechar com Animação */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="size-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{t('tasks.modal.close')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Conteúdo - Layout de 3 Colunas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Esquerda - Subtarefas (Colapsável) */}
          {showSubtasks && (
            <div className={cn(
              "border-r bg-gray-50 dark:bg-gray-950 flex flex-col",
              isMobile ? "absolute inset-0 z-10 w-full" : "w-64"
            )}>
              <div className="p-4 border-b dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2 dark:text-white">
                    <ListChecks className="size-4" />
                    {t('tasks.modal.subtasks')}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-6"
                    onClick={() => setShowSubtasks(false)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Subtarefas reais da tarefa */}
                  {task.subtasks && task.subtasks.length > 0 ? (
                    task.subtasks.map((subtask: any) => (
                      <div 
                        key={subtask.id} 
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={subtask.status === 'done'}
                          onChange={async () => {
                            const newStatus = subtask.status === 'done' ? 'todo' : 'done';
                            const { updateTask } = await import('@/lib/tasks/tasks-storage');
                            await updateTask(subtask.id, { 
                              status: newStatus,
                              completed_at: newStatus === 'done' ? new Date().toISOString() : null
                            });
                            handleRefresh();
                          }}
                        />
                        <span className={cn(
                          "text-sm dark:text-gray-300",
                          subtask.status === 'done' && "line-through text-gray-400"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {t('tasks.modal.noSubtasks')}
                    </p>
                  )}
                  
                  {/* Input para adicionar subtarefa */}
                  <div className="flex gap-2 pt-2 border-t dark:border-gray-800">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                          try {
                            const { createTask } = await import('@/lib/tasks/tasks-storage');
                            await createTask({
                              title: newSubtaskTitle.trim(),
                              description: '',
                              status: 'todo',
                              priority: 'medium',
                              due_date: null,
                              start_date: null,
                              completed_at: null,
                              assignee_ids: task?.assignee_ids || [],
                              created_by: task?.created_by || '',
                              tag_ids: [],
                              project_id: task?.project_id || null,
                              list_id: task?.list_id || null,
                              parent_task_id: task?.id || null,
                              custom_fields: [],
                            });
                            setNewSubtaskTitle('');
                            handleRefresh();
                            toast.success(t('tasks.toast.subtaskCreated'));
                          } catch (error) {
                            console.error('Erro ao criar subtarefa:', error);
                            toast.error(t('tasks.toast.subtaskError'));
                          }
                        }
                      }}
                      placeholder={t('tasks.modal.addSubtask')}
                      className="flex-1 text-sm px-2 py-1.5 rounded border dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      size="sm"
                      disabled={!newSubtaskTitle.trim()}
                      onClick={async () => {
                        if (!newSubtaskTitle.trim()) return;
                        try {
                          const { createTask } = await import('@/lib/tasks/tasks-storage');
                          await createTask({
                            title: newSubtaskTitle.trim(),
                            description: '',
                            status: 'todo',
                            priority: 'medium',
                            due_date: null,
                            start_date: null,
                            completed_at: null,
                            assignee_ids: task?.assignee_ids || [],
                            created_by: task?.created_by || '',
                            tag_ids: [],
                            project_id: task?.project_id || null,
                            list_id: task?.list_id || null,
                            parent_task_id: task?.id || null,
                            custom_fields: [],
                          });
                          setNewSubtaskTitle('');
                          handleRefresh();
                          toast.success(t('tasks.toast.subtaskCreated'));
                        } catch (error) {
                          console.error('Erro ao criar subtarefa:', error);
                          toast.error(t('tasks.toast.subtaskError'));
                        }
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coluna Central - Detalhes */}
          <div className="flex-1 overflow-y-auto">
            <TaskDetailView task={task} onUpdate={handleRefresh} />
          </div>

          {/* Coluna Direita - Atividade/Links */}
          {(isMobile ? showActivitySidebar : true) && (
          <div className={cn(
            "flex-shrink-0 border-l flex flex-col",
            isMobile ? "absolute inset-0 z-10 w-full bg-white dark:bg-black" : "w-80"
          )}>
            {/* Sidebar com Tabs integradas */}
            {isMobile && (
              <div className="p-2 border-b dark:border-gray-800">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8"
                  onClick={() => setShowActivitySidebar(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <TaskActivitySidebar
              taskId={task.id}
              comments={task.comments || []}
              activities={task.activities || []}
              links={task.links || []}
              onUpdate={handleRefresh}
            />
          </div>
          )}
        </div>

        <DialogDescription className="sr-only">
          Visualização detalhada da tarefa
        </DialogDescription>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}