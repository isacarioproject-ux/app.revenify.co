import { ReactNode, createContext, useContext } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableContextValue {
  setActivatorNodeRef: (element: HTMLElement | null) => void
  listeners: ReturnType<typeof useSortable>['listeners']
}

const SortableItemContext = createContext<SortableContextValue | null>(null)

export const useSortableHandle = () => {
  const context = useContext(SortableItemContext)
  if (!context) return null
  return context
}

interface SortableBlockProps {
  id: string
  children: ReactNode
}

/**
 * Wrapper para tornar um bloco arrastável
 */
export const SortableBlock = ({ id, children }: SortableBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <SortableItemContext.Provider value={{ setActivatorNodeRef, listeners }}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="touch-auto"
      >
        {children}
      </div>
    </SortableItemContext.Provider>
  )
}
