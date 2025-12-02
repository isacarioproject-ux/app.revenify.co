import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cloneElement, isValidElement } from 'react'

interface DraggableCardWrapperProps {
  id: string
  children: React.ReactNode
}

export const DraggableCardWrapper = ({ id, children }: DraggableCardWrapperProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
  }

  // Passar dragHandleProps para o children
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        dragHandleProps: { ...attributes, ...listeners },
      })
    : children

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-[400px] md:h-auto',
        isDragging && 'z-50 opacity-50'
      )}
    >
      {childrenWithProps}
    </div>
  )
}
