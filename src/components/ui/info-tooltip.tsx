import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Info, HelpCircle, Lightbulb, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface InfoTooltipProps {
  content: React.ReactNode
  icon?: 'info' | 'help' | 'lightbulb' | 'alert'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  children?: React.ReactNode
  maxWidth?: number
}

export function InfoTooltip({
  content,
  icon = 'info',
  side = 'top',
  className,
  children,
  maxWidth = 300,
}: InfoTooltipProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  
  const icons = {
    info: Info,
    help: HelpCircle,
    lightbulb: Lightbulb,
    alert: AlertCircle,
  }

  const Icon = icons[icon]

  const triggerButton = children || (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center',
        'text-muted-foreground hover:text-foreground',
        'transition-colors',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  const contentElement = (
    <div className="space-y-1.5">
      {typeof content === 'string' ? (
        <p className="text-foreground font-medium">{content}</p>
      ) : (
        content
      )}
    </div>
  )

  // Mobile: Use Popover (tap to open, tap to close)
  if (isMobile) {
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          {triggerButton}
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side={side}
            sideOffset={8}
            className={cn(
              'z-50 overflow-hidden rounded-lg border bg-popover px-4 py-3 text-sm shadow-xl',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
            )}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Fechar"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            {contentElement}
            <PopoverPrimitive.Arrow className="fill-border" />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  }

  // Desktop: Use Tooltip (hover)
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {triggerButton}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className={cn(
              'z-50 overflow-hidden rounded-lg border bg-popover px-4 py-3 text-sm shadow-xl',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {contentElement}
            <TooltipPrimitive.Arrow className="fill-border" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Tooltip com título + descrição
interface InfoTooltipRichProps {
  title: string
  description: string
  icon?: 'info' | 'help' | 'lightbulb' | 'alert'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  children?: React.ReactNode
}

export function InfoTooltipRich({
  title,
  description,
  icon = 'info',
  side = 'top',
  className,
  children,
}: InfoTooltipRichProps) {
  return (
    <InfoTooltip
      icon={icon}
      side={side}
      className={className}
      maxWidth={320}
      content={
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      }
    >
      {children}
    </InfoTooltip>
  )
}

// Tooltip com exemplo de código
interface InfoTooltipCodeProps {
  title: string
  description: string
  code: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function InfoTooltipCode({
  title,
  description,
  code,
  side = 'top',
  className,
}: InfoTooltipCodeProps) {
  return (
    <InfoTooltip
      icon="help"
      side={side}
      className={className}
      maxWidth={400}
      content={
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-foreground mb-1">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <pre className="bg-muted rounded-md p-2 text-xs font-mono overflow-x-auto">
            {code}
          </pre>
        </div>
      }
    />
  )
}
