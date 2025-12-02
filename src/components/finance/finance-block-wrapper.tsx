import { ReactNode, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FinanceBlockType } from '@/types/finance-blocks'
import { getBlockDefinition } from '@/lib/finance-blocks-registry'
import { useSortableHandle } from './sortable-block'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceBlockWrapperProps {
  type: FinanceBlockType
  children: ReactNode
  onRemove?: () => void
  className?: string
  blockId?: string
}

/**
 * Wrapper para blocos financeiros
 * Adiciona header, controles e estilo consistente
 */
export const FinanceBlockWrapper = ({
  type,
  children,
  onRemove,
  className,
  blockId,
}: FinanceBlockWrapperProps) => {
  const { t } = useI18n()
  const definition = getBlockDefinition(type)
  const dragContext = useSortableHandle()
  const dragButtonRef = useRef<HTMLButtonElement | null>(null)
  
  // Carregar estado de collapse do localStorage
  const storageKey = blockId ? `block-collapsed-${blockId}` : null
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!storageKey) return false
    const saved = localStorage.getItem(storageKey)
    return saved === 'true'
  })

  // Salvar estado quando mudar
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (storageKey) {
      localStorage.setItem(storageKey, String(newState))
    }
  }

  if (!definition) {
    return <div>Bloco não encontrado: {type}</div>
  }

  const Icon = definition.icon

  useEffect(() => {
    if (dragContext && dragButtonRef.current) {
      dragContext.setActivatorNodeRef(dragButtonRef.current)
    }
  }, [dragContext])

  return (
    <Card className={cn('overflow-hidden transition-all duration-200 ease-in-out', className)}>
      {/* Header do bloco - compacto */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Ícone do bloco - menor */}
          <div
            className="p-1 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${definition.color}20` }}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={{ color: definition.color }}
            />
          </div>

          {/* Nome do bloco */}
          <h3 className="text-xs font-semibold truncate">{definition.name}</h3>
        </div>

        <TooltipProvider>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Botão collapse com tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{isCollapsed ? t('finance.blocks.expand') : t('finance.blocks.collapse')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Drag handle com tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                ref={dragButtonRef}
                {...dragContext?.listeners}
                className="h-6 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Arrastar para reordenar</p>
            </TooltipContent>
          </Tooltip>

          {/* Botão remover com tooltip */}
          {onRemove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Remover bloco</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        </TooltipProvider>
      </div>

      {/* Conteúdo do bloco - recolhível com animação suave */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "max-h-0 opacity-0 py-0" : "max-h-[5000px] opacity-100 py-3"
        )}
      >
        <div className="px-3">
          {children}
        </div>
      </div>
    </Card>
  )
}
