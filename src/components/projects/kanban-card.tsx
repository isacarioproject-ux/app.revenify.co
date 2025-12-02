import {
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Trash,
  TrendingUp,
  Edit,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { ShareMembersSelector } from './share-members-selector'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'

type ProjectStatusKanban = 'pending' | 'active' | 'completed' | 'no-status'

interface ProjectItem {
  id: string
  name: string
  sharedWith: string[]
  createdAt: string
  description: string
  isPrivate: boolean
  status: ProjectStatusKanban
  financeDocs: number
}

interface KanbanCardProps {
  project: ProjectItem
  statusColor: string
  statusLabel: string
  onOpenSheet: () => void
  onTogglePrivate: () => void
  onUpdateName: (name: string) => void
  onUpdateSharedWith: (members: string[]) => void
  onUpdateCreatedAt: (date: string) => void
  onUpdateDescription: (desc: string) => void
  onUpdateStatus: (status: ProjectStatusKanban) => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
}

export function KanbanCard({
  project,
  statusColor,
  statusLabel,
  onOpenSheet,
  onTogglePrivate,
  onUpdateName,
  onUpdateSharedWith,
  onUpdateCreatedAt,
  onUpdateDescription,
  onUpdateStatus,
  onDelete,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg p-2 md:p-3 transition-all group",
        statusColor,
        "hover:shadow-md",
        isExpanded ? "space-y-1.5 md:space-y-2 cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Header: Nome + Botões */}
      <div className="flex items-start gap-1.5 md:gap-2" onClick={(e) => isExpanded && e.stopPropagation()}>
        <Input
          value={project.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="Digite um nome..."
          readOnly={!isExpanded}
          className="border-none !bg-transparent focus-visible:ring-0 focus:!bg-transparent hover:!bg-transparent h-auto p-0 text-xs md:text-sm font-medium flex-1"
        />
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isExpanded ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(true)
                  }}
                  className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded transition-all whitespace-nowrap flex items-center gap-0.5 md:gap-1"
                >
                  <Edit className="h-2.5 md:h-3 w-2.5 md:w-3" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Editar campos do projeto</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSheet()
                  }}
                  className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded transition-all whitespace-nowrap"
                >
                  <span className="hidden sm:inline">ABRIR</span>
                  <span className="sm:hidden">+</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Abrir no modo lado a lado</p>
              </TooltipContent>
            </Tooltip>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }} className="text-destructive">
                <Trash className="h-3 w-3 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Campos editáveis - Mostrar apenas quando expandido */}
      {isExpanded && (
      <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs pt-1.5 md:pt-2" onClick={(e) => e.stopPropagation()}>
        {/* Compartilhado com - ShareMembersSelector (igual à tabela) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1">
              <Users className="h-3 w-3 text-muted-foreground" />
          <ShareMembersSelector
            selectedMembers={project.sharedWith}
            onMembersChange={onUpdateSharedWith}
            trigger={
              <button className="flex items-center gap-1.5 text-xs flex-1 text-left">
                {project.sharedWith.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center -space-x-2">
                      {project.sharedWith.slice(0, 3).map((member, idx) => (
                        <Avatar key={idx} className="h-5 w-5 border-2 border-background">
                          <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
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
                  </div>
                ) : (
                  <span className="text-muted-foreground">Adicionar Compartilhado com</span>
                )}
              </button>
            }
          />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Compartilhar com membros</p>
          </TooltipContent>
        </Tooltip>

        {/* Data de Criação - Input date (igual à tabela) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 rounded"
              onClick={(e) => {
                if (isMobile) {
                  e.stopPropagation()
                  setDateDrawerOpen(true)
                }
              }}
            >
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {isMobile ? (
                <span className="text-xs flex-1">
                  {project.createdAt ? (
                    <span className="text-foreground">
                      {new Date(project.createdAt + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Adicionar Data</span>
                  )}
                </span>
              ) : (
                <Input
                  type="date"
                  value={project.createdAt}
                  onChange={(e) => onUpdateCreatedAt(e.target.value)}
                  placeholder="Adicionar Data de Criação"
                  className="border-none !bg-transparent focus-visible:ring-0 focus:!bg-transparent hover:!bg-transparent h-auto p-0 text-xs flex-1"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Data de criação</p>
          </TooltipContent>
        </Tooltip>

        {/* Descrição - Input inline */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <Input
                value={project.description}
                onChange={(e) => onUpdateDescription(e.target.value)}
                placeholder="Adicionar Descrição"
                className="border-none !bg-transparent focus-visible:ring-0 focus:!bg-transparent hover:!bg-transparent h-auto p-0 text-xs flex-1"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Adicionar descrição</p>
          </TooltipContent>
        </Tooltip>

        {/* Checkbox Privado */}
        <div className="flex items-center gap-2 px-2 py-1">
          <Checkbox checked={project.isPrivate} onCheckedChange={onTogglePrivate} />
          <span className="text-muted-foreground">Privado</span>
        </div>

        {/* Status - DropdownMenu (igual à tabela) */}
        <div className="flex items-center gap-2 px-2 py-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                {statusLabel === 'Sem Status' || !project.status ? (
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Adicionar Status
                  </span>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity w-fit',
                      statusColor
                    )}
                  >
                    {statusLabel}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">A fazer</div>
              <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>
                <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-400 hover:bg-slate-500/30">
                  Pendente
                </Badge>
              </DropdownMenuItem>
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Em andamento</div>
              <DropdownMenuItem onClick={() => onUpdateStatus('active')}>
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30">
                  Em Progresso
                </Badge>
              </DropdownMenuItem>
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Concluídos</div>
              <DropdownMenuItem onClick={() => onUpdateStatus('completed')}>
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
        </div>
      </div>
      )}

      {/* Versão compacta - Mostrar apenas quando recolhido */}
      {!isExpanded && (
        <div className="flex items-center justify-between pt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={project.isPrivate} 
              onCheckedChange={(checked) => {
                onTogglePrivate()
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-muted-foreground">Privado</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="focus:outline-none">
                {statusLabel === 'Sem Status' || !project.status ? (
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Adicionar Status
                  </span>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity w-fit',
                      statusColor
                    )}
                  >
                    {statusLabel}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">A fazer</div>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onUpdateStatus('pending')
              }}>
                <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-400 hover:bg-slate-500/30">
                  Pendente
                </Badge>
              </DropdownMenuItem>
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Em andamento</div>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onUpdateStatus('active')
              }}>
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30">
                  Em Progresso
                </Badge>
              </DropdownMenuItem>
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">Concluídos</div>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onUpdateStatus('completed')
              }}>
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30">
                  Concluído
                </Badge>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Drawer para seleção de data em mobile */}
      {dateDrawerOpen && (
        <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle>Selecionar Data</DrawerTitle>
            <div className="flex gap-2 pt-3">
              <Badge 
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  onUpdateCreatedAt(today)
                  setDateDrawerOpen(false)
                }}
              >
                Hoje
              </Badge>
              {project.createdAt && (
                <Badge 
                  variant="outline"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors px-3 py-1.5"
                  onClick={() => {
                    onUpdateCreatedAt('')
                    setDateDrawerOpen(false)
                  }}
                >
                  Limpar
                </Badge>
              )}
            </div>
          </DrawerHeader>
          <div className="flex justify-center px-4 pb-4">
            <CalendarComponent
              mode="single"
              selected={project.createdAt ? new Date(project.createdAt + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  const dateString = date.toISOString().split('T')[0]
                  onUpdateCreatedAt(dateString)
                  setDateDrawerOpen(false)
                }
              }}
              locale={ptBR}
              initialFocus
              className="w-auto"
              classNames={{
                months: "w-full",
                month: "w-full",
                table: "w-full border-collapse",
                head_row: "grid grid-cols-7",
                head_cell: "text-center text-xs text-muted-foreground font-medium p-1",
                row: "grid grid-cols-7",
                cell: "text-center p-0.5",
                day: "h-9 w-9 mx-auto p-0 font-normal text-sm hover:bg-accent rounded",
                day_selected: "bg-primary text-primary-foreground font-semibold",
                day_today: "bg-accent font-semibold",
                day_outside: "opacity-30",
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
      )}
    </div>
  )
}
