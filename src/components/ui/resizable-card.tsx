import { ReactNode, useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ResizableCardProps {
  children: ReactNode
  className?: string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  defaultWidth?: number
  defaultHeight?: number
  onResize?: (width: number, height: number) => void
  storageKey?: string
  enableResize?: {
    top?: boolean
    right?: boolean
    bottom?: boolean
    left?: boolean
    topRight?: boolean
    bottomRight?: boolean
    bottomLeft?: boolean
    topLeft?: boolean
  }
}

/**
 * Card redimensionável robusto com handles em todas as bordas e cantos
 * Persiste dimensões no localStorage
 */
export const ResizableCard = ({
  children,
  className,
  minWidth = 300,
  minHeight = 200,
  maxWidth = 1200,
  maxHeight = 800,
  defaultWidth = 400,
  defaultHeight = 300,
  onResize,
  storageKey,
  enableResize = {
    top: true,
    right: true,
    bottom: true,
    left: true,
    topRight: true,
    bottomRight: true,
    bottomLeft: true,
    topLeft: true,
  },
}: ResizableCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)

  // Carregar dimensões salvas ou usar padrão
  const [dimensions, setDimensions] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`resizable-card-${storageKey}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            width: Math.max(minWidth, Math.min(maxWidth, parsed.width || defaultWidth)),
            height: Math.max(minHeight, Math.min(maxHeight, parsed.height || defaultHeight)),
          }
        } catch {
          return { width: defaultWidth, height: defaultHeight }
        }
      }
    }
    return { width: defaultWidth, height: defaultHeight }
  })

  // Salvar dimensões quando mudarem
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(
        `resizable-card-${storageKey}`,
        JSON.stringify(dimensions)
      )
    }
    onResize?.(dimensions.width, dimensions.height)
  }, [dimensions, storageKey, onResize])

  // Handler de resize
  const handleMouseDown = useCallback(
    (direction: string) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeDirection(direction)

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = dimensions.width
      const startHeight = dimensions.height

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        let newWidth = startWidth
        let newHeight = startHeight

        // Calcular novas dimensões baseado na direção
        if (direction.includes('right')) {
          newWidth = startWidth + deltaX
        }
        if (direction.includes('left')) {
          newWidth = startWidth - deltaX
        }
        if (direction.includes('bottom')) {
          newHeight = startHeight + deltaY
        }
        if (direction.includes('top')) {
          newHeight = startHeight - deltaY
        }

        // Aplicar limites
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

        setDimensions({ width: newWidth, height: newHeight })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        setResizeDirection(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
    },
    [dimensions, minWidth, minHeight, maxWidth, maxHeight]
  )

  // Cursor styles baseado na direção
  const getCursorStyle = (direction: string) => {
    const cursors: Record<string, string> = {
      top: 'n-resize',
      right: 'e-resize',
      bottom: 's-resize',
      left: 'w-resize',
      'top-right': 'ne-resize',
      'bottom-right': 'se-resize',
      'bottom-left': 'sw-resize',
      'top-left': 'nw-resize',
    }
    return cursors[direction] || 'default'
  }

  // Classes para handles - invisíveis mas funcionais
  // z-1 para não interferir com headers dos cards
  const handleBaseClass = "absolute z-[1]"
  const handleHoverClass = ""
  const handleActiveClass = ""

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-all duration-300 ease-in-out w-full h-full",
        isResizing && "transition-none",
        className
      )}
      style={{
        cursor: isResizing ? getCursorStyle(resizeDirection || '') : 'default',
      }}
      onWheel={(e) => {
        // Prevenir scroll da página quando mouse sobre o card
        e.stopPropagation();
      }}
    >
      {/* Conteúdo do card */}
      <div className="w-full h-full overflow-hidden relative z-[2]">
        {children}
      </div>

      {/* Handles de redimensionamento - APENAS DESKTOP */}
      {/* Posicionados abaixo do header típico (48-56px) para não interferir */}
      
      {/* Handle TOP - APENAS DESKTOP - Dentro da borda, abaixo do header */}
      {enableResize.top && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block top-14 left-2 right-2 h-1 cursor-n-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('top')}
        />
      )}

      {/* Handle RIGHT - APENAS DESKTOP - Dentro da borda, abaixo do header */}
      {enableResize.right && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block top-14 right-1 bottom-2 w-1 cursor-e-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('right')}
        />
      )}

      {/* Handle BOTTOM - APENAS DESKTOP - Dentro da borda */}
      {enableResize.bottom && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block bottom-1 left-2 right-2 h-1 cursor-s-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('bottom')}
        />
      )}

      {/* Handle LEFT - APENAS DESKTOP - Dentro da borda, abaixo do header */}
      {enableResize.left && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block top-14 left-1 bottom-2 w-1 cursor-w-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('left')}
        />
      )}

      {/* Handle TOP-RIGHT (canto) - APENAS DESKTOP - Abaixo do header */}
      {enableResize.topRight && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block top-14 right-1 w-6 h-6 cursor-ne-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('top-right')}
        />
      )}

      {/* Handle BOTTOM-RIGHT (canto) - APENAS DESKTOP - Dentro da borda */}
      {enableResize.bottomRight && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block bottom-1 right-1 w-6 h-6 cursor-se-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('bottom-right')}
        />
      )}

      {/* Handle BOTTOM-LEFT (canto) - APENAS DESKTOP - Dentro da borda */}
      {enableResize.bottomLeft && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block bottom-1 left-1 w-6 h-6 cursor-sw-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('bottom-left')}
        />
      )}

      {/* Handle TOP-LEFT (canto) - APENAS DESKTOP - Abaixo do header */}
      {enableResize.topLeft && (
        <div
          className={cn(
            handleBaseClass,
            handleHoverClass,
            handleActiveClass,
            "hidden md:block top-14 left-1 w-6 h-6 cursor-nw-resize pointer-events-auto"
          )}
          onMouseDown={handleMouseDown('top-left')}
        />
      )}

      {/* Overlay durante resize para evitar problemas com iframes/etc */}
      {isResizing && (
        <div className="absolute inset-0 z-[100] pointer-events-none" />
      )}
    </div>
  )
}
