import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-12' : 'py-20'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted',
          compact ? 'h-16 w-16' : 'h-20 w-20'
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground',
            compact ? 'h-8 w-8' : 'h-10 w-10'
          )}
        />
      </div>
      <h3
        className={cn(
          'font-semibold',
          compact ? 'mt-4 text-base' : 'mt-6 text-lg'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-muted-foreground',
            compact ? 'mt-1 text-xs max-w-xs' : 'mt-2 text-sm max-w-sm'
          )}
        >
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-4' : 'mt-6'}>{action}</div>}
    </div>
  )
}
