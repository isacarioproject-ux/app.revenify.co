import { useState, useEffect } from 'react'
import { motion, Reorder } from 'framer-motion'
import { useProjectItems } from '@/hooks/use-project-items'
import { FinanceDocsSelector } from './finance-docs-selector'
import { FinanceDocViewer } from './finance-doc-viewer'
import { ProjectDriveFiles } from './project-drive-files'
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  SortAsc,
  MoreHorizontal,
  Calendar,
  Users,
  FileText,
  Lock,
  TrendingUp,
  Info,
  CheckSquare,
  X,
  Table,
  BarChart3,
  LayoutGrid,
  GripVertical,
  ChevronRight,
  Eye,
  EyeOff,
  PieChart,
  FolderOpen,
  Paperclip,
} from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Label, Tooltip as RechartsTooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShareMembersSelector } from './share-members-selector'
import { KanbanCard } from './kanban-card'
import { cn } from '@/lib/utils'

interface ProjectManagerProps {
  projectId: string
  projectName: string
  onBack: () => void
}

// Tipos do banco de dados
type ProjectStatusDB = 'Planejamento' | 'Em andamento' | 'Concluído' | 'Pausado' | 'Cancelado'
type ProjectStatusKanban = 'pending' | 'active' | 'completed' | 'no-status'

interface ProjectItem {
  id: string
  name: string
  sharedWith: string[]
  createdAt: string
  description: string
  isPrivate: boolean
  status: ProjectStatusKanban
  statusDB?: ProjectStatusDB // Status real do banco
  financeDocs: number
}

// Mapeamento: Banco → Kanban
const mapDBToKanban = (dbStatus: ProjectStatusDB | null): ProjectStatusKanban => {
  if (!dbStatus) return 'no-status'
  const mapping: Record<ProjectStatusDB, ProjectStatusKanban> = {
    'Planejamento': 'pending',
    'Em andamento': 'active',
    'Concluído': 'completed',
    'Pausado': 'no-status',
    'Cancelado': 'no-status',
  }
  return mapping[dbStatus] || 'no-status'
}

// Mapeamento: Kanban → Banco
const mapKanbanToDB = (kanbanStatus: ProjectStatusKanban): ProjectStatusDB => {
  const mapping: Record<ProjectStatusKanban, ProjectStatusDB> = {
    'pending': 'Planejamento',
    'active': 'Em andamento',
    'completed': 'Concluído',
    'no-status': 'Pausado',
  }
  return mapping[kanbanStatus]
}

export function ProjectManager({
  projectId,
  projectName,
  onBack,
}: ProjectManagerProps) {
  // 🔥 Hook para dados reais do Supabase
  const {
    items: projectsFromDB,
    loading: loadingProjects,
    updateStatus: updateStatusDB,
    updateName: updateNameDB,
    updateDescription: updateDescriptionDB,
    deleteItem: deleteItemDB,
    createItem: createItemDB,
  } = useProjectItems(projectId)

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)
  const [viewingFinanceDocId, setViewingFinanceDocId] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false)
  const [draggedProject, setDraggedProject] = useState<ProjectItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    sharedWith: true,
    createdAt: true,
    description: true,
    isPrivate: true,
    status: true,
    financeDocs: true,
  })
  
  // Estado para o calendário
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Sincronizar dados do hook com estado local
  useEffect(() => {
    setProjects(projectsFromDB)
  }, [projectsFromDB])

  // Filtrar projetos por busca
  // TODO: Integrar com banco de dados - fazer busca no backend quando searchQuery mudar
  // Implementar debounce e buscar diretamente no Supabase para melhor performance
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle do buscador
  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded)
    if (searchExpanded) {
      setSearchQuery('') // Limpar busca ao fechar
    }
  }

  const STATUS_CONFIG: Record<ProjectStatusKanban, {
    label: string
    badgeColor: string
    cardColor: string
    headerColor: string
    icon: any
  }> = {
    pending: {
      label: 'Pendente',
      badgeColor: 'bg-slate-500/20 text-slate-700 dark:text-slate-400 hover:bg-slate-500/30',
      cardColor: 'bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50',
      headerColor: 'text-slate-600 dark:text-slate-500',
      icon: Info,
    },
    active: {
      label: 'Em Progresso',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30',
      cardColor: 'bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50',
      headerColor: 'text-blue-600 dark:text-blue-500',
      icon: TrendingUp,
    },
    completed: {
      label: 'Concluído',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30',
      cardColor: 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50',
      headerColor: 'text-emerald-600 dark:text-emerald-500',
      icon: CheckSquare,
    },
    'no-status': {
      label: 'Sem Status',
      badgeColor: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-500/30',
      cardColor: 'bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/50',
      headerColor: 'text-zinc-600 dark:text-zinc-500',
      icon: Info,
    },
  }

  const openProjectSheet = (project: ProjectItem) => {
    setSelectedProject(project)
    setSheetOpen(true)
  }

  const toggleRowSelection = (projectId: string) => {
    setSelectedRows(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const toggleAllRows = () => {
    setSelectedRows(prev => 
      prev.length === projects.length ? [] : projects.map(p => p.id)
    )
  }

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }))
  }

  const togglePrivate = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, isPrivate: !p.isPrivate } : p
    ))
  }

  const updateSharedWith = (projectId: string, members: string[]) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, sharedWith: members } : p
    ))
  }

  const updateStatus = (projectId: string, status: 'pending' | 'active' | 'completed') => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, status } : p
    ))
  }

  const updateFinanceDocs = (projectId: string, docs: number) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, financeDocs: docs } : p
    ))
  }

  const moveProjectToStatus = (projectId: string, newStatus: 'pending' | 'active' | 'completed') => {
    updateStatusDB(projectId, newStatus)
  }

  const handleDragStart = (project: ProjectItem) => (e: React.DragEvent) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (status: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDrop = (newStatus: 'pending' | 'active' | 'completed') => (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedProject && draggedProject.status !== newStatus) {
      updateStatusDB(draggedProject.id, newStatus)
    }
    setDraggedProject(null)
  }

  const handleDropNoStatus = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedProject && draggedProject.status !== 'no-status') {
      // Mover para sem status
      updateStatusDB(draggedProject.id, 'no-status')
    }
    setDraggedProject(null)
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setDragOverColumn(null)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const updateProjectField = <K extends keyof ProjectItem>(
    projectId: string,
    field: K,
    value: ProjectItem[K]
  ) => {
    // Atualizar no banco via hook
    if (field === 'status') {
      updateStatusDB(projectId, value as ProjectStatusKanban)
    } else if (field === 'name') {
      updateNameDB(projectId, value as string)
    } else if (field === 'description') {
      updateDescriptionDB(projectId, value as string)
    } else {
      // Para outros campos, atualizar localmente por enquanto
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, [field]: value } : p))
      )
    }
  }

  const deleteProject = (projectId: string) => {
    deleteItemDB(projectId)
  }

  const addNewProject = (status: 'pending' | 'active' | 'completed' = 'pending') => {
    createItemDB(status)
  }

  const addNewProjectWithoutStatus = () => {
    createItemDB('no-status')
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onBack}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FolderKanban className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold truncate">
                Gestor de Projetos
              </h2>
            </div>
          </div>
        </div>

        {/* Tabs e ações na mesma linha */}
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            {/* Título do documento */}
            <div className="px-4 md:px-16 pt-2 md:pt-3 pb-1 md:pb-2">
              <input 
                type="text"
                defaultValue="Todos os Projetos"
                placeholder="Sem título"
                className="w-full text-xl md:text-2xl font-bold bg-transparent border-none outline-none focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex items-center justify-between px-4 md:px-16 shrink-0 py-1 md:py-0">
              <TabsList variant="transparent" className="border-0 p-0 gap-0.5 md:gap-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="all" 
                      className="text-xs gap-1 md:gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-1.5 md:px-2 py-1"
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Todos os Projetos</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Todos os Projetos</p>
                    <p className="text-muted-foreground">coleção</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="status" 
                      className="text-xs gap-1 md:gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-1.5 md:px-2 py-1"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Por Status</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Por Status</p>
                    <p className="text-muted-foreground">coleção</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="cards" 
                      className="text-xs gap-1 md:gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-1.5 md:px-2 py-1"
                    >
                      <PieChart className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Gráfico</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Gráfico</p>
                    <p className="text-muted-foreground">Visualização em gráfico</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="calendar" 
                      className="text-xs gap-1 md:gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-1.5 md:px-2 py-1"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Calendário</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Calendário</p>
                    <p className="text-muted-foreground">Visualização em calendário</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="files" 
                      className="text-xs gap-1 md:gap-1.5 data-[state=active]:bg-secondary hover:bg-secondary/60 rounded-md transition-colors px-1.5 md:px-2 py-1"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Arquivos</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Arquivos</p>
                    <p className="text-muted-foreground">Arquivos do Google Drive</p>
                  </TooltipContent>
                </Tooltip>
              </TabsList>

              {/* Botões de ação à direita */}
              <div className="flex items-center gap-0.5 md:gap-1">
                {/* Buscador recolhível - apenas nas abas "all" e "status" */}
                {(activeTab === 'all' || activeTab === 'status') && (
                  <div className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{ width: searchExpanded ? 'auto' : '28px' }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="relative flex items-center overflow-hidden"
                    >
                      {searchExpanded ? (
                        <div className="flex items-center gap-1 bg-secondary/50 rounded-md px-2 py-1">
                          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <Input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-5 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs w-32 md:w-48 p-0"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={toggleSearch}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={toggleSearch}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  </div>
                )}
                
                {activeTab === 'files' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="secondary"
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => setShowDrivePicker(true)}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Anexar arquivos do Drive</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <Button 
                  size="sm" 
                  className="h-7 gap-1 text-xs"
                  onClick={() => addNewProject('pending')}
                  disabled={loadingProjects}
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Novo</span>
                </Button>
              </div>
            </div>

            {activeTab === 'all' && (
            <TabsContent value="all" className="flex-1 m-0 overflow-auto py-1 md:py-2">
              {/* Tabela estilo Notion - com scroll horizontal e px-16 */}
              <div className="overflow-x-auto px-4 md:px-16">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      {/* Coluna de controles */}
                      <th className="text-left py-2 pr-2 w-20">
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => addNewProject()}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Nova linha</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Reordenar</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox 
                                checked={selectedRows.length === projects.length && projects.length > 0}
                                onCheckedChange={toggleAllRows}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Selecionar tudo</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                      
                      {/* Nome do Projeto */}
                      {visibleColumns.name && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <FileText className="h-3 w-3" />
                                Nome do Projeto
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Nome do Projeto</p>
                              <p className="text-xs text-muted-foreground">O nome do projeto</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      {visibleColumns.sharedWith && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Users className="h-3 w-3" />
                                Compartilhado com
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Compartilhado com</p>
                              <p className="text-xs text-muted-foreground">Pessoas com acesso a este projeto</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      {visibleColumns.createdAt && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Calendar className="h-3 w-3" />
                                Data de Criação
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Data de Criação</p>
                              <p className="text-xs text-muted-foreground">Data em que o projeto foi criado</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      {visibleColumns.description && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <FileText className="h-3 w-3" />
                              Descrição
                              <Info className="h-3 w-3 opacity-50" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="font-medium">Descrição</p>
                            <p className="text-xs text-muted-foreground">Descrição do projeto</p>
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      )}
                      
                      {visibleColumns.isPrivate && (
                        <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1 cursor-help">
                                <Lock className="h-3 w-3" />
                                Privado
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Privado</p>
                              <p className="text-xs text-muted-foreground">Marcar se o projeto é privado</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      {visibleColumns.status && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <TrendingUp className="h-3 w-3" />
                                Status
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Status</p>
                              <p className="text-xs text-muted-foreground">Status do projeto</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      {visibleColumns.financeDocs && (
                        <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <FileText className="h-3 w-3" />
                                Documentos Finance...
                                <Info className="h-3 w-3 opacity-50" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px]">
                              <p className="font-medium">Documentos Financeiros</p>
                              <p className="text-xs text-muted-foreground">Documentos financeiros relacionados a este projeto</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )}
                      
                      <th className="text-center p-2 text-xs font-medium text-muted-foreground whitespace-nowrap w-10">
                        {/* Menu de visibilidade de colunas */}
                        <DropdownMenu open={visibilityMenuOpen} onOpenChange={setVisibilityMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 mx-auto">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[280px]">
                            <div className="px-2 py-1.5 text-sm font-semibold">Visibilidade da propriedade</div>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-2 text-xs text-muted-foreground">Mostradas na tabela</div>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('name')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <FileText className="h-3 w-3" />
                              <span className="flex-1">Nome do Projeto</span>
                              {visibleColumns.name ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('status')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <TrendingUp className="h-3 w-3" />
                              <span className="flex-1">Status</span>
                              {visibleColumns.status ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('financeDocs')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <ChevronRight className="h-3 w-3" />
                              <span className="flex-1">Documentos Financeiros</span>
                              {visibleColumns.financeDocs ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('isPrivate')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <CheckSquare className="h-3 w-3" />
                              <span className="flex-1">Privado</span>
                              {visibleColumns.isPrivate ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('createdAt')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <Calendar className="h-3 w-3" />
                              <span className="flex-1">Data de Criação</span>
                              {visibleColumns.createdAt ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('description')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <FileText className="h-3 w-3" />
                              <span className="flex-1">Descrição</span>
                              {visibleColumns.description ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => toggleColumnVisibility('sharedWith')} className="gap-2">
                              <GripVertical className="h-3 w-3" />
                              <Users className="h-3 w-3" />
                              <span className="flex-1">Compartilhado com</span>
                              {visibleColumns.sharedWith ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-blue-600">
                              Ocultar tudo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </th>
                    </tr>
                  </thead>
                  <Reorder.Group as="tbody" axis="y" values={filteredProjects} onReorder={searchQuery ? () => {} : setProjects}>
                    {filteredProjects.map((project) => (
                      <Reorder.Item
                        as="tr"
                        key={project.id}
                        value={project}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/30 group"
                      >
                        {/* Coluna de controles por linha */}
                        <td className="py-1 pr-2">
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => addNewProject()}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Adicionar linha</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Arraste para mover</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Checkbox 
                                  checked={selectedRows.includes(project.id)}
                                  onCheckedChange={() => toggleRowSelection(project.id)}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Selecionar linha</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>

                        {/* Nome editável com botão ABRIR */}
                        {visibleColumns.name && (
                          <td className="py-1 px-2">
                            <div className="flex items-center gap-2">
                              <Input
                                defaultValue={project.name}
                                placeholder="Sem título"
                                onBlur={(e) => {
                                  const newName = e.target.value.trim()
                                  if (newName && newName !== project.name) {
                                    updateProjectField(project.id, 'name', newName)
                                  }
                                }}
                                className="border-none bg-transparent focus-visible:bg-accent/50 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 text-xs px-2 font-medium flex-1 transition-colors"
                              />
                              <button 
                                onClick={() => openProjectSheet(project)}
                                className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 bg-secondary hover:bg-secondary/80 rounded transition-all whitespace-nowrap"
                              >
                                ABRIR
                              </button>
                            </div>
                          </td>
                        )}

                        {/* Compartilhado com - Com buscador E avatares */}
                        {visibleColumns.sharedWith && (
                          <td className="py-1 px-2">
                            <ShareMembersSelector
                              selectedMembers={project.sharedWith}
                              onMembersChange={(members) => updateSharedWith(project.id, members)}
                              trigger={
                                <button className="flex items-center gap-1.5 hover:bg-accent px-2 py-1 rounded text-xs transition-colors">
                                  {project.sharedWith.length > 0 ? (
                                    <div className="flex items-center -space-x-2">
                                      {project.sharedWith.slice(0, 3).map((member, idx) => (
                                        <Avatar key={idx} className="h-5 w-5 border-2 border-background">
                                          <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                                            {member.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {project.sharedWith.length > 3 && (
                                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border-2 border-background text-[8px] text-muted-foreground">
                                          +{project.sharedWith.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-muted-foreground">Vazio</span>
                                    </>
                                  )}
                                </button>
                              }
                            />
                          </td>
                        )}

                        {/* Data de criação - Editável inline */}
                        {visibleColumns.createdAt && (
                          <td className="py-1 px-2">
                            <Input
                              type="date"
                              defaultValue={project.createdAt}
                              onBlur={(e) => {
                                const newDate = e.target.value
                                if (newDate && newDate !== project.createdAt) {
                                  updateProjectField(project.id, 'createdAt', newDate)
                                }
                              }}
                              className="border-none bg-transparent focus-visible:bg-accent/50 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 text-xs px-2 transition-colors"
                            />
                          </td>
                        )}

                        {/* Descrição - Editável inline */}
                        {visibleColumns.description && (
                          <td className="py-1 px-2 max-w-[200px]">
                            <Input
                              defaultValue={project.description}
                              placeholder="Vazio"
                              onBlur={(e) => {
                                const newDesc = e.target.value.trim()
                                if (newDesc !== project.description) {
                                  updateProjectField(project.id, 'description', newDesc)
                                }
                              }}
                              className="border-none bg-transparent focus-visible:bg-accent/50 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 text-xs px-2 transition-colors"
                            />
                          </td>
                        )}

                        {/* Privado */}
                        {visibleColumns.isPrivate && (
                          <td className="p-2">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={project.isPrivate}
                                onCheckedChange={() => togglePrivate(project.id)}
                              />
                            </div>
                          </td>
                        )}

                        {/* Status - Dropdown funcional */}
                        {visibleColumns.status && (
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="focus:outline-none flex items-center gap-2">
                                  {project.status && STATUS_CONFIG[project.status] ? (
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        'text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                                        STATUS_CONFIG[project.status].badgeColor
                                      )}
                                    >
                                      {STATUS_CONFIG[project.status].label}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                      Adicionar Status
                                    </span>
                                  )}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">A fazer</div>
                                <DropdownMenuItem onClick={() => updateStatus(project.id, 'pending')}>
                                  <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-400 hover:bg-slate-500/30">
                                    Pendente
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Em andamento</div>
                                <DropdownMenuItem onClick={() => updateStatus(project.id, 'active')}>
                                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30">
                                    Em Progresso
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Concluídos</div>
                                <DropdownMenuItem onClick={() => updateStatus(project.id, 'completed')}>
                                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30">
                                    Concluído
                                  </Badge>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-2" />
                                  Editar propriedade
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}

                        {/* Documentos Financeiro - Com buscador */}
                        {visibleColumns.financeDocs && (
                          <td className="py-1 px-2">
                            <FinanceDocsSelector
                              projectId={projectId}
                              projectDocumentId={project.id}
                              currentCount={project.financeDocs}
                              onUpdate={() => {
                                // Recarregar itens para atualizar contador
                                setProjects(projectsFromDB)
                              }}
                              onViewDocument={(docId) => setViewingFinanceDocId(docId)}
                            />
                          </td>
                        )}

                        {/* Actions */}
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </table>

                {/* Nova página - Dentro do px-16 */}
                <button 
                  onClick={() => addNewProject()}
                  className="flex items-center gap-2 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
                >
                  <Plus className="h-3 w-3" />
                  Nova página
                </button>
              </div>
            </TabsContent>
            )}

            {activeTab === 'status' && (
            <TabsContent value="status" className="flex-1 m-0 overflow-auto">
              {/* Kanban Board */}
              <div className="overflow-x-auto md:overflow-x-visible px-4 md:px-16 py-2 md:py-4">
                <div className="flex gap-2 md:gap-3 min-w-max md:min-w-0">
                  {/* Renderizar colunas dinamicamente */}
                  {(['completed', 'active', 'pending'] as const).map((status) => {
                    const config = STATUS_CONFIG[status]
                    const StatusIcon = config.icon
                    const statusProjects = filteredProjects.filter(p => p.status === status)
                    const isBeingDraggedOver = dragOverColumn === status

                    return (
                      <div
                        key={status}
                        className={cn(
                          "flex flex-col w-[240px] md:w-[240px] md:flex-1 shrink-0 rounded-lg transition-all",
                          isBeingDraggedOver && "ring-2 ring-primary ring-offset-2"
                        )}
                        onDragOver={handleDragOver(status)}
                        onDrop={handleDrop(status)}
                        onDragLeave={handleDragLeave}
                      >
                        {/* Header da coluna */}
                        <div className="flex items-center justify-between mb-2 md:mb-3 px-1.5 md:px-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <StatusIcon className={cn("h-3.5 md:h-4 w-3.5 md:w-4", config.headerColor)} />
                            <span className={cn("text-xs md:text-sm font-medium", config.headerColor)}>
                              {config.label === 'Concluído' ? 'Concluídos' : config.label}
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              ({statusProjects.length})
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 md:gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 md:h-6 w-5 md:w-6 p-0">
                                  <MoreHorizontal className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 md:h-6 w-5 md:w-6 p-0"
                                  onClick={() => addNewProject()}
                                >
                                  <Plus className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Nova página</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Cards da coluna */}
                        <div className="flex flex-col gap-1.5 md:gap-2 pb-1.5 md:pb-2">
                          {statusProjects.map((project) => (
                            <KanbanCard
                              key={project.id}
                              project={project}
                              statusColor={config.cardColor}
                              statusLabel={config.label}
                              onOpenSheet={() => openProjectSheet(project)}
                              onTogglePrivate={() => updateProjectField(project.id, 'isPrivate', !project.isPrivate)}
                              onUpdateName={(name) => updateProjectField(project.id, 'name', name)}
                              onUpdateSharedWith={(members) => updateProjectField(project.id, 'sharedWith', members)}
                              onUpdateCreatedAt={(date) => updateProjectField(project.id, 'createdAt', date)}
                              onUpdateDescription={(desc) => updateProjectField(project.id, 'description', desc)}
                              onUpdateStatus={(status) => updateProjectField(project.id, 'status', status)}
                              onDelete={() => deleteProject(project.id)}
                              onDragStart={handleDragStart(project)}
                              onDragEnd={handleDragEnd}
                            />
                          ))}
                          
                          {/* Botão Nova página - sempre após os cards */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => addNewProject(status as 'pending' | 'active' | 'completed')}
                                className={cn(
                                  "flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground transition-colors px-1.5 md:px-2 py-1 md:py-1.5 rounded hover:bg-accent w-full",
                                  `hover:${config.headerColor}`
                                )}
                              >
                                <Plus className="h-2.5 md:h-3 w-2.5 md:w-3" />
                                Nova página
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Adicionar nova página nesta coluna</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })}

                  {/* Coluna: Sem Status */}
                  <div 
                    className={cn(
                      "flex flex-col w-[240px] md:w-[240px] md:flex-1 shrink-0 rounded-lg transition-all",
                      dragOverColumn === 'no-status' && "ring-2 ring-primary ring-offset-2"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverColumn('no-status' as any)
                    }}
                    onDrop={handleDropNoStatus}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-3 px-1.5 md:px-2">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">Sem Status</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          ({filteredProjects.filter(p => p.status === 'no-status').length})
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 md:h-6 w-5 md:w-6 p-0">
                              <MoreHorizontal className="h-3 md:h-3.5 w-3 md:w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 md:h-6 w-5 md:w-6 p-0" onClick={() => addNewProjectWithoutStatus()}>
                              <Plus className="h-3 md:h-3.5 w-3 md:w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nova página sem status</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Cards da coluna - sem status */}
                    <div className="flex flex-col gap-1.5 md:gap-2 pb-1.5 md:pb-2">
                      {filteredProjects.filter(p => p.status === 'no-status').map((project) => (
                        <KanbanCard
                          key={project.id}
                          project={project}
                          statusColor="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/40"
                          statusLabel="Sem Status"
                          onOpenSheet={() => openProjectSheet(project)}
                          onTogglePrivate={() => updateProjectField(project.id, 'isPrivate', !project.isPrivate)}
                          onUpdateName={(name) => updateProjectField(project.id, 'name', name)}
                          onUpdateSharedWith={(members) => updateProjectField(project.id, 'sharedWith', members)}
                          onUpdateCreatedAt={(date) => updateProjectField(project.id, 'createdAt', date)}
                          onUpdateDescription={(desc) => updateProjectField(project.id, 'description', desc)}
                          onUpdateStatus={(status) => updateProjectField(project.id, 'status', status)}
                          onDelete={() => deleteProject(project.id)}
                          onDragStart={handleDragStart(project)}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                      
                      {/* Botão Nova página - sempre após os cards */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={addNewProjectWithoutStatus}
                            className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 md:px-2 py-1 md:py-1.5 rounded hover:bg-accent w-full"
                          >
                            <Plus className="h-2.5 md:h-3 w-2.5 md:w-3" />
                            Nova página
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Adicionar nova página sem status</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            )}

            {activeTab === 'calendar' && (
            <TabsContent value="calendar" className="flex-1 m-0 overflow-auto">
              <div className="p-2 md:py-8 md:px-16">
                {(() => {
                  const now = new Date()
                  const currentYear = calendarDate.getFullYear()
                  const currentMonth = calendarDate.getMonth()
                  const todayDay = now.getDate()
                  const todayMonth = now.getMonth()
                  const todayYear = now.getFullYear()
                  
                  // Primeiro dia do mês
                  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
                  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = domingo
                  
                  // Último dia do mês
                  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
                  const daysInMonth = lastDayOfMonth.getDate()
                  
                  // Nome do mês
                  const monthName = firstDayOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  
                  // Criar array de dias
                  const days = []
                  
                  // Dias vazios antes do início do mês
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(null)
                  }
                  
                  // Dias do mês
                  for (let day = 1; day <= daysInMonth; day++) {
                    days.push(day)
                  }
                  
                  const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']
                  
                  const goToPreviousMonth = () => {
                    setCalendarDate(new Date(currentYear, currentMonth - 1, 1))
                  }
                  
                  const goToNextMonth = () => {
                    setCalendarDate(new Date(currentYear, currentMonth + 1, 1))
                  }
                  
                  const goToToday = () => {
                    setCalendarDate(new Date())
                  }
                  
                  return (
                    <div className="max-w-7xl mx-auto">
                      {/* Header do calendário */}
                      <div className="flex items-center justify-between mb-3 md:mb-6">
                        <h2 className="text-sm md:text-lg font-semibold capitalize">{monthName}</h2>
                        <div className="flex items-center gap-1 md:gap-2">
                          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-7 w-7 md:h-9 md:w-9 p-0">
                            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 rotate-180" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={goToToday} className="h-7 px-2 md:h-9 md:px-3 text-xs md:text-sm">
                            Hoje
                          </Button>
                          <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-7 w-7 md:h-9 md:w-9 p-0">
                            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Grid do calendário */}
                      <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
                        {/* Header com dias da semana */}
                        {weekDays.map((day, index) => (
                          <div 
                            key={index} 
                            className="bg-muted p-1.5 md:p-3 text-center text-[10px] md:text-xs font-medium text-muted-foreground border-r border-b last:border-r-0"
                          >
                            {day}
                          </div>
                        ))}
                        
                        {/* Dias do mês */}
                        {days.map((day, index) => {
                          const isToday = day === todayDay && currentMonth === todayMonth && currentYear === todayYear
                          const isEmpty = day === null
                          
                          return (
                            <div 
                              key={index}
                              className={cn(
                                "min-h-[60px] md:min-h-[120px] p-1 md:p-2 border-r border-b relative",
                                index % 7 === 6 && "border-r-0",
                                isEmpty && "bg-muted/30",
                                !isEmpty && "hover:bg-accent/50 cursor-pointer transition-colors"
                              )}
                            >
                              {!isEmpty && (
                                <>
                                  <div className={cn(
                                    "text-xs md:text-sm font-medium mb-1 md:mb-2",
                                    isToday && "w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] md:text-sm"
                                  )}>
                                    {day}
                                  </div>
                                  {/* Documentos deste dia */}
                                  <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-xs">
                                    {projects
                                      .filter(p => {
                                        const projectDate = new Date(p.createdAt)
                                        return projectDate.getDate() === day &&
                                               projectDate.getMonth() === currentMonth &&
                                               projectDate.getFullYear() === currentYear
                                      })
                                      .slice(0, 2)
                                      .map(project => (
                                        <div
                                          key={project.id}
                                          className={cn(
                                            "px-1 py-0.5 rounded text-[9px] md:text-[10px] truncate cursor-pointer hover:opacity-80 transition-opacity",
                                            project.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                            project.status === 'active' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                            project.status === 'pending' && "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
                                            project.status === 'no-status' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400"
                                          )}
                                          onClick={() => openProjectSheet(project)}
                                        >
                                          {project.name || 'Sem título'}
                                        </div>
                                      ))}
                                    {projects.filter(p => {
                                      const projectDate = new Date(p.createdAt)
                                      return projectDate.getDate() === day &&
                                             projectDate.getMonth() === currentMonth &&
                                             projectDate.getFullYear() === currentYear
                                    }).length > 2 && (
                                      <div className="text-[9px] text-muted-foreground pl-1">
                                        +{projects.filter(p => {
                                          const projectDate = new Date(p.createdAt)
                                          return projectDate.getDate() === day &&
                                                 projectDate.getMonth() === currentMonth &&
                                                 projectDate.getFullYear() === currentYear
                                        }).length - 2} mais
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Info */}
                      <div className="mt-2 md:mt-4 text-center text-xs md:text-sm text-muted-foreground">
                        <p>Em desenvolvimento - Integração com Google Calendar em breve</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </TabsContent>
            )}

            {activeTab === 'cards' && (
            <TabsContent value="cards" className="flex-1 m-0 overflow-auto flex items-center justify-center px-2 md:px-16">
              <div className="w-full max-w-2xl py-3 md:py-8">
                {(() => {
                  // Calcular estatísticas
                  const stats = {
                    active: projects.filter(p => p.status === 'active').length,
                    pending: projects.filter(p => p.status === 'pending').length,
                    completed: projects.filter(p => p.status === 'completed').length,
                    noStatus: projects.filter(p => p.status === 'no-status').length,
                  }
                  
                  const total = stats.active + stats.pending + stats.completed + stats.noStatus
                  
                  // Todos os status para legenda
                  const allStatuses = [
                    { name: 'Em Progresso', color: '#3b82f6' },
                    { name: 'Sem Status', color: '#9ca3af' },
                    { name: 'Pendente', color: '#64748b' },
                    { name: 'Concluído', color: '#10b981' },
                  ]
                  
                  // Dados para o gráfico (apenas com valor > 0)
                  const chartData = [
                    { 
                      name: 'Em Progresso', 
                      value: stats.active, 
                      color: '#3b82f6',
                      percentage: total > 0 ? Math.round((stats.active / total) * 100) : 0
                    },
                    { 
                      name: 'Pendente', 
                      value: stats.pending, 
                      color: '#64748b',
                      percentage: total > 0 ? Math.round((stats.pending / total) * 100) : 0
                    },
                    { 
                      name: 'Concluído', 
                      value: stats.completed, 
                      color: '#10b981',
                      percentage: total > 0 ? Math.round((stats.completed / total) * 100) : 0
                    },
                    { 
                      name: 'Sem Status', 
                      value: stats.noStatus, 
                      color: '#9ca3af',
                      percentage: total > 0 ? Math.round((stats.noStatus / total) * 100) : 0
                    },
                  ].filter(item => item.value > 0)
                  
                  // Função para renderizar labels customizados
                  const renderCustomLabel = (props: any) => {
                    const { cx, cy, midAngle, outerRadius, value, percentage } = props
                    const RADIAN = Math.PI / 180
                    const radius = outerRadius + 30
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="currentColor" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        className="text-xs fill-muted-foreground"
                      >
                        {`${value} (${percentage}%)`}
                      </text>
                    )
                  }
                  
                  // Tooltip customizado
                  const CustomTooltip = ({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-sm" 
                              style={{ backgroundColor: data.color }}
                            />
                            <p className="font-semibold text-sm">{data.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {data.value} {data.value === 1 ? 'projeto' : 'projetos'} ({data.percentage}%)
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            Clique para ver os dados
                          </p>
                        </div>
                      )
                    }
                    return null
                  }
                  
                  return (
                    <div className="flex flex-col items-center gap-3 md:gap-8">
                      {/* Gráfico Donut */}
                      <div className="relative w-full h-[290px] md:h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={window.innerWidth < 768 ? 50 : 100}
                              outerRadius={window.innerWidth < 768 ? 80 : 140}
                              paddingAngle={2}
                              dataKey="value"
                              label={renderCustomLabel}
                              labelLine={{
                                stroke: 'currentColor',
                                strokeWidth: 1,
                                className: 'stroke-border'
                              }}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                          </RechartsPie>
                        </ResponsiveContainer>
                        
                        {/* Total no centro */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="text-3xl md:text-6xl font-bold">{total}</div>
                          <div className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1">Total</div>
                        </div>
                      </div>
                      
                      {/* Legenda customizada */}
                      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6">
                        {allStatuses.map((item) => (
                          <div key={item.name} className="flex items-center gap-1 md:gap-2">
                            <div 
                              className="w-2 h-2 md:w-3 md:h-3 rounded-sm" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[10px] md:text-sm font-medium">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </TabsContent>
            )}

            {activeTab === 'files' && (
            <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
              <ProjectDriveFiles 
                projectId={projectId} 
                showPicker={showDrivePicker}
                onPickerClose={() => setShowDrivePicker(false)}
              />
            </TabsContent>
            )}
          </Tabs>
        </TooltipProvider>
      </div>

      {/* Sheet lateral para edição rápida */}
      {sheetOpen && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 z-50">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-2xl font-bold">Nova página</SheetTitle>
            <SheetDescription className="sr-only">
              Formulário de preenchimento rápido do projeto
            </SheetDescription>
          </SheetHeader>

          {selectedProject && (
            <div className="px-6 py-4 space-y-4">
              {/* Compartilhado com */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Compartilhado com
                </label>
                <Input 
                  defaultValue={selectedProject.sharedWith.join(', ')}
                  placeholder="Vazio"
                  className="border-none bg-transparent focus-visible:ring-0 px-0"
                />
              </div>

              {/* Data de Criação */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Data de Criação
                </label>
                <Input 
                  type="date"
                  defaultValue={selectedProject.createdAt}
                  placeholder="Vazio"
                  className="border-none bg-transparent focus-visible:ring-0 px-0"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Descrição
                </label>
                <Input 
                  defaultValue={selectedProject.description}
                  placeholder="Vazio"
                  className="border-none bg-transparent focus-visible:ring-0 px-0"
                />
              </div>

              {/* Documentos Finance */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                  Documentos Finance...
                </label>
                <Input 
                  defaultValue={selectedProject.financeDocs.toString()}
                  placeholder="Vazio"
                  className="border-none bg-transparent focus-visible:ring-0 px-0"
                />
              </div>

              {/* Privado */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProject.isPrivate}
                  onCheckedChange={() => togglePrivate(selectedProject.id)}
                />
                <label className="text-sm">Privado</label>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Status
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedProject.status && STATUS_CONFIG[selectedProject.status]
                        ? STATUS_CONFIG[selectedProject.status].label
                        : 'Adicionar Status'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => updateStatus(selectedProject.id, 'pending')}>
                      Pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(selectedProject.id, 'active')}>
                      Em Progresso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(selectedProject.id, 'completed')}>
                      Concluído
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      )}

      {/* Visualizador de Documento Financeiro */}
      <FinanceDocViewer
        documentId={viewingFinanceDocId}
        open={viewingFinanceDocId !== null}
        onClose={() => setViewingFinanceDocId(null)}
      />
    </>
  )
}