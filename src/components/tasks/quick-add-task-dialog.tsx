import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Flag, 
  Tag, 
  Sparkles, 
  FileText,
  MoreHorizontal,
  X,
  Search,
  Check,
  ChevronDown,
  Users,
  FolderOpen,
  Plus,
  Bell,
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input as SearchInput } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ReminderTab } from './reminder-tab';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotionBlockEditor, Block } from './notion-block-editor';
import { useWorkspace } from '@/contexts/workspace-context';
import { useI18n } from '@/hooks/use-i18n';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUsers } from '@/lib/tasks/tasks-storage';
import { Calendar } from '@/components/ui/calendar';
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale';
import type { User } from '@/types/tasks';

interface QuickAddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (taskData: any) => void;
  onCreateAndOpen?: (taskData: any) => void;
  onCreateReminder?: (reminderData: any) => void;
  defaultGroup?: string;
  initialTab?: 'tarefa' | 'lembrete';
}

export function QuickAddTaskDialog({ 
  open, 
  onClose, 
  onCreateTask,
  onCreateAndOpen,
  onCreateReminder,
  defaultGroup,
  initialTab = 'tarefa'
}: QuickAddTaskDialogProps) {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const dateFnsLocale = useDateFnsLocale();
  const [activeTab, setActiveTab] = useState<'tarefa' | 'lembrete'>(initialTab);
  const [taskName, setTaskName] = useState('');
  const [selectedList, setSelectedList] = useState('lista-pessoal');
  const [taskType, setTaskType] = useState('tarefa');
  const [selectedDate, setSelectedDate] = useState(defaultGroup);
  const [priority, setPriority] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState('PENDENTE');
  const [workspace, setWorkspace] = useState('kleoye');
  const [assignee, setAssignee] = useState('Eu');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // ✨ IDs reais dos assignees
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]); // ✨ Membros do workspace
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDateTag, setSelectedDateTag] = useState<Date | undefined>();
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionBlocks, setDescriptionBlocks] = useState<Block[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // ✨ Buscar membros do workspace e usuário atual
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!currentWorkspace?.id) {
        console.log('⚠️ currentWorkspace não definido');
        return;
      }

      console.log('🔍 Buscando membros do workspace:', currentWorkspace.id);

      try {
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Usuário atual:', user.id);
          setCurrentUserId(user.id);
          setAssigneeIds([user.id]); // Default: usuário atual
        }

        // Buscar membros do workspace usando a função que JÁ FUNCIONA no TaskDetailView
        const users = await getUsers();
        console.log('✅ Membros encontrados:', users.length, users);
        setWorkspaceMembers(users);
      } catch (error) {
        console.error('❌ Erro ao buscar membros do workspace:', error);
      }
    };

    if (open && currentWorkspace) {
      fetchWorkspaceMembers();
    }
  }, [open, currentWorkspace]);

  // Atualizar tab quando initialTab mudar
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const statusColors = {
    'PENDENTE': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    'EM PROGRESSO': 'bg-blue-600 text-white',
    'CONCLUÍDO': 'bg-green-600 text-white'
  };

  const priorityConfig = {
    'urgente': { label: t('tasks.priorityUrgent'), color: 'text-red-500', icon: '🚩' },
    'alta': { label: t('tasks.priorityHigh'), color: 'text-orange-500', icon: '🚩' },
    'normal': { label: t('tasks.priorityNormal'), color: 'text-blue-500', icon: '🚩' },
    'baixa': { label: t('tasks.priorityLow'), color: 'text-gray-500', icon: '🚩' }
  };

  // Verificar se há conteúdo preenchido
  const hasContent = () => {
    return taskName.trim() !== '' || 
           descriptionBlocks.length > 0 || 
           priority !== null || 
           tags.length > 0;
  };

  // Função para fechar com verificação
  const handleClose = () => {
    if (hasContent()) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  // Excluir rascunho
  const handleDiscard = () => {
    setTaskName('');
    setPriority(null);
    setTags([]);
    setStatus('PENDENTE');
    setShowDescription(false);
    setDescriptionBlocks([]);
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCreate = () => {
    if (!taskName.trim()) return;

    const taskData = {
      title: taskName,
      list: selectedList,
      type: taskType,
      date: selectedDate,
      selectedDateTag, // Data real para o banco
      priority,
      tags,
      status,
      workspace: currentWorkspace?.id || workspace,
      workspace_name: currentWorkspace?.name || workspace,
      assignee,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : (currentUserId ? [currentUserId] : []), // ✨ IDs reais
      description: descriptionBlocks.length > 0 ? JSON.stringify(descriptionBlocks) : null,
    };

    onCreateTask(taskData);

    // Reset form
    setTaskName('');
    setPriority(null);
    setTags([]);
    setStatus('PENDENTE');
    setShowDescription(false);
    setDescriptionBlocks([]);
    onClose();
  };

  const handleCreateAndOpen = () => {
    if (!taskName.trim()) return;

    const taskData = {
      title: taskName,
      list: selectedList,
      type: taskType,
      date: selectedDate,
      priority,
      tags,
      status,
      workspace,
      assignee,
    };

    if (onCreateAndOpen) {
      onCreateAndOpen(taskData);
    }

    // Reset form
    setTaskName('');
    setPriority(null);
    setTags([]);
    setStatus('PENDENTE');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showClose={false} className="!w-[600px] !max-w-[95vw] p-0 gap-0">
        <DialogTitle className="sr-only">{t('tasks.common.createTask')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('tasks.quickAdd.title')} ou {t('tasks.quickAdd.reminder')}
        </DialogDescription>

        {/* Header com Ícone Animado */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            {/* Ícone Animado */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
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
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList variant="underlined">
                <TabsTrigger 
                  value="tarefa"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2"
                >
                  {t('tasks.quickAdd.title')}
                </TabsTrigger>
                <TabsTrigger 
                  value="lembrete"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2"
                >
                  {t('tasks.quickAdd.reminder')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="size-8" onClick={handleClose}>
                  <X className="size-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('tasks.quickAdd.close')}</p>
            </TooltipContent>
          </Tooltip>
          </TooltipProvider>
        </div>

        {/* Content */}
        {activeTab === 'tarefa' ? (
        <div className="p-4 space-y-4">
          {/* Selects Row - Only for Tarefa */}
          {activeTab === 'tarefa' && (
            <div className="flex items-center gap-2">
              {/* Lista Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">
                    <span>📋 {selectedList === 'lista-pessoal' ? t('tasks.quickAdd.personalList') : currentWorkspace?.name || t('tasks.quickAdd.selectList')}</span>
                    <ChevronDown className="size-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  {/* Search */}
                  <div className="p-3 border-b dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <SearchInput 
                        placeholder="Pesquisar..." 
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Lista pessoal - Sempre disponível */}
                  <div className="p-2">
                    <button 
                      onClick={() => setSelectedList('lista-pessoal')}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span>📋</span>
                      <span>{t('tasks.quickAdd.personalList')}</span>
                      {selectedList === 'lista-pessoal' && <Check className="size-4 ml-auto text-blue-600" />}
                    </button>
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  {/* Workspace atual - Se houver */}
                  {currentWorkspace && (
                    <>
                      <div className="p-2">
                        <div className="px-2 py-1 mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Workspace Atual</span>
                        </div>
                        <button 
                          onClick={() => setSelectedList(currentWorkspace.id)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <span className="size-5 rounded bg-blue-500 text-white text-xs flex items-center justify-center">
                            {currentWorkspace.name.substring(0, 1).toUpperCase()}
                          </span>
                          <span className="dark:text-white">{currentWorkspace.name}</span>
                          {selectedList === currentWorkspace.id && <Check className="size-4 ml-auto text-blue-600" />}
                        </button>
                      </div>
                      <Separator className="dark:bg-gray-700" />
                    </>
                  )}

                  {/* Outros workspaces - Colaborativos */}
                  <div className="p-2">
                    <div className="px-2 py-1 mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Outros Workspaces</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-2 text-center">
                      Nenhum outro workspace disponível
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Task Type Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">
                    <span>⚪ {taskType === 'tarefa' ? t('tasks.quickAdd.taskTypeDefault') : taskType === 'marco' ? t('tasks.quickAdd.milestone') : taskType === 'anotacao' ? t('tasks.quickAdd.meetingNote') : t('tasks.quickAdd.formResponse')}</span>
                    <ChevronDown className="size-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-xs text-gray-500">Tipos de tarefa</span>
                    <button className="text-xs text-blue-600 hover:text-blue-700">Editar</button>
                  </div>
                  <button 
                    onClick={() => setTaskType('tarefa')}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>⚪</span>
                      <span>{t('tasks.quickAdd.taskType')} <span className="text-xs text-gray-500">({t('common.default')})</span></span>
                    </div>
                    {taskType === 'tarefa' && <Check className="size-4 text-blue-600" />}
                  </button>
                  <button 
                    onClick={() => setTaskType('marco')}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>◆</span>
                      <span>Marco</span>
                    </div>
                    {taskType === 'marco' && <Check className="size-4 ml-auto text-blue-600" />}
                  </button>
                  <button 
                    onClick={() => setTaskType('anotacao')}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>Anotação da reunião</span>
                    </div>
                    {taskType === 'anotacao' && <Check className="size-4 ml-auto text-blue-600" />}
                  </button>
                  <button 
                    onClick={() => setTaskType('formulario')}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>📋</span>
                      <span>Resposta do formulário</span>
                    </div>
                    {taskType === 'formulario' && <Check className="size-4 ml-auto text-blue-600" />}
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          )}


          {/* Task Name Input */}
          <Input
            placeholder={t('tasks.quickAdd.taskName')}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="text-base border-none px-0 focus-visible:ring-0 placeholder:text-gray-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreate();
              }
            }}
          />

          {/* Description & AI - Only for Tarefa */}
          {activeTab === 'tarefa' && (
            <div className="space-y-3">
              {!showDescription ? (
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowDescription(true);
                          if (descriptionBlocks.length === 0) {
                            setDescriptionBlocks([{
                              id: Math.random().toString(36).substr(2, 9),
                              type: 'text',
                              content: '',
                            }]);
                          }
                        }}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <FileText className="size-4" />
                        Adicionar descrição
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar descrição com blocos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border border-gray-700 rounded-lg p-3 bg-gray-900/50 dark:bg-gray-900/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => {
                              setShowDescription(false);
                              setDescriptionBlocks([]);
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('tasks.quickAdd.closeDescription')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="min-h-[100px]">
                    <NotionBlockEditor
                      blocks={descriptionBlocks}
                      onChange={setDescriptionBlocks}
                      placeholder="Adicionar bloco"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Properties - Only for Tarefa */}
          {activeTab === 'tarefa' && (
            <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={`px-2 py-1 text-xs font-normal rounded hover:opacity-80 ${statusColors[status as keyof typeof statusColors]}`}>
                  {status}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="mb-2">
                  <SearchInput placeholder="Pesquisar..." className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <div className="px-2 py-1 text-xs text-gray-500">Não iniciado</div>
                  <button 
                    onClick={() => setStatus('PENDENTE')}
                    className="flex items-center justify-between w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-gray-400"></span>
                      <span>PENDENTE</span>
                    </div>
                    {status === 'PENDENTE' && <Check className="size-4 text-blue-600" />}
                  </button>
                  <div className="px-2 py-1 text-xs text-gray-500 mt-2">Ativo</div>
                  <button 
                    onClick={() => setStatus('EM PROGRESSO')}
                    className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    <span>EM PROGRESSO</span>
                  </button>
                  <button 
                    onClick={() => setStatus('CONCLUÍDO')}
                    className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="size-2 rounded-full bg-green-500"></span>
                    <span>CONCLUÍDO</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Workspace Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-xs">{currentWorkspace?.name || workspace}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Workspace: {currentWorkspace?.name || workspace}</p>
              </TooltipContent>
            </Tooltip>

            {/* Responsáveis - Círculos com botão + */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Responsáveis</span>
              <div className="flex items-center gap-1">
                {/* Avatares dos membros selecionados */}
                {assigneeIds.map((userId) => {
                  const user = workspaceMembers.find(u => u.id === userId);
                  if (!user) return null;
                  
                  return (
                    <Avatar 
                      key={user.id} 
                      className="size-6 cursor-pointer hover:opacity-80 border border-gray-200 dark:border-gray-700"
                      onClick={() => {
                        // Remover ao clicar
                        setAssigneeIds(prev => prev.filter(id => id !== user.id));
                      }}
                    >
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                
                {/* Botão + para adicionar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="size-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                      <Plus className="size-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      {workspaceMembers.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Nenhum membro encontrado
                        </div>
                      ) : (
                        workspaceMembers.map((user) => {
                          const isSelected = assigneeIds.includes(user.id);
                          const isCurrentUser = user.id === currentUserId;
                          
                          return (
                            <div
                              key={user.id}
                              onClick={() => {
                                if (isSelected) {
                                  setAssigneeIds(prev => prev.filter(id => id !== user.id));
                                } else {
                                  setAssigneeIds(prev => [...prev, user.id]);
                                }
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left cursor-pointer"
                            >
                              <Check className={`size-4 ${isSelected ? 'text-primary' : 'text-transparent'}`} />
                              <Avatar className="size-5">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-xs">
                                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm dark:text-white">
                                {isCurrentUser ? 'Eu' : user.name || user.email}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date with Calendar */}
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <CalendarIcon className="size-3" />
                  <span>
                    {selectedDate === 'hoje' ? 'Hoje' : 
                     selectedDate === 'amanhã' ? 'Amanhã' :
                     selectedDate === 'fim-de-semana' ? 'Fim de semana' :
                     selectedDate === 'proxima-semana' ? 'Próxima semana' :
                     selectedDateTag ? selectedDateTag.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) :
                     'Selecionar data'}
                  </span>
                  {selectedDate && (
                    <X 
                      className="size-3 ml-1 hover:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate('');
                        setSelectedDateTag(undefined);
                      }}
                    />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  {/* Quick Options */}
                  <div className="w-48 border-r p-2">
                    <button 
                      onClick={() => {
                        setSelectedDate('hoje');
                        setSelectedDateTag(new Date());
                        setIsDatePopoverOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Hoje
                    </button>
                    <button 
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setSelectedDateTag(tomorrow);
                        setSelectedDate('amanhã');
                        setIsDatePopoverOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Amanhã
                    </button>
                    <button 
                      onClick={() => {
                        const weekend = new Date();
                        weekend.setDate(weekend.getDate() + (6 - weekend.getDay()));
                        setSelectedDateTag(weekend);
                        setSelectedDate('fim-de-semana');
                        setIsDatePopoverOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Este final de semana
                    </button>
                    <button 
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setSelectedDateTag(nextWeek);
                        setSelectedDate('proxima-semana');
                        setIsDatePopoverOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Semana que vem
                    </button>
                  </div>
                  {/* Calendar Component */}
                  <div className="p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDateTag}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDateTag(date);
                          setSelectedDate(date.toISOString());
                          setIsDatePopoverOpen(false);
                        }
                      }}
                      locale={dateFnsLocale}
                      className="rounded-md"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Priority with Flags */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={`flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  priority ? priorityConfig[priority as keyof typeof priorityConfig].color : ''
                }`}>
                  {priority ? (
                    <>
                      <Flag className="size-3" />
                      {priorityConfig[priority as keyof typeof priorityConfig].label}
                    </>
                  ) : (
                    <>
                      <Flag className="size-3" />
                      {t('tasks.priority.label')}
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="mb-2 px-2 text-xs text-gray-500">{t('tasks.priorityDescription')}</div>
                <button 
                  onClick={() => setPriority('urgente')}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-red-500" />
                  <span>Urgente</span>
                </button>
                <button 
                  onClick={() => setPriority('alta')}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-orange-500" />
                  <span>Alta</span>
                </button>
                <button 
                  onClick={() => setPriority('normal')}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-blue-500" />
                  <span>Normal</span>
                </button>
                <button 
                  onClick={() => setPriority('baixa')}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Flag className="size-4 text-gray-500" />
                  <span>Baixa</span>
                </button>
                <Separator className="my-2" />
                <button 
                  onClick={() => setPriority(null)}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="size-4" />
                  <span>Limpar</span>
                </button>
              </PopoverContent>
            </Popover>

            {/* Tags with Input */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Tag className="size-3" />
                  Etiquetas {tags.length > 0 && `(${tags.length})`}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <SearchInput 
                  placeholder="Digite e pressione Enter..." 
                  className="h-8 text-sm mb-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget as HTMLInputElement;
                      const newTag = input.value.trim();
                      if (newTag && !tags.includes(newTag)) {
                        setTags([...tags, newTag]);
                        input.value = '';
                      }
                    }
                  }}
                />
                
                {/* Tags selecionadas */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="size-3 cursor-pointer hover:text-red-500"
                          onClick={() => setTags(tags.filter(t => t !== tag))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Tags sugeridas */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Sugestões:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Bug', 'Feature', 'Urgente', 'Documentação', 'Design'].map((suggestedTag) => (
                      <button
                        key={suggestedTag}
                        onClick={() => {
                          if (!tags.includes(suggestedTag)) {
                            setTags([...tags, suggestedTag]);
                          }
                        }}
                        disabled={tags.includes(suggestedTag)}
                        className="px-2 py-1 text-xs rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestedTag}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            </div>
          )}
        </div>
        ) : (
          <ReminderTab onCreateReminder={(data) => {
            onCreateReminder?.(data);
            onClose();
          }} />
        )}

        {/* Footer - Only for Tarefa */}
        {activeTab === 'tarefa' && (
        <div className="flex items-center justify-end px-4 py-3 border-t border-gray-800 dark:border-gray-800 bg-[#1a1a1a] dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-gray-500 cursor-help">⚡ 1</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atalho: Enter para criar</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleCreate}
                    disabled={!taskName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="size-4 mr-2" />
                    {t('tasks.quickAdd.createTask')}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Criar tarefa em {currentWorkspace?.name || workspace}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        )}
      </DialogContent>

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0">
          <DialogTitle className="sr-only">Salvar rascunho?</DialogTitle>
          <DialogDescription className="sr-only">
            Confirme se deseja salvar o rascunho da tarefa
          </DialogDescription>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 dark:text-white" aria-hidden="true">Salvar rascunho?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quer salvar um rascunho da tarefa? Acesse-o na bandeja de tarefas.
            </p>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Excluir rascunho
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleCreate();
                  setShowConfirmDialog(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
