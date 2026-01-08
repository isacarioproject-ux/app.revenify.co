import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: 'primary' | 'white' | 'muted'
}

const sizeClasses = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-[3px]',
}

const colorClasses = {
  primary: 'border-primary/20 border-t-primary',
  white: 'border-white/20 border-t-white',
  muted: 'border-muted-foreground/20 border-t-muted-foreground',
}

export function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

// Componente de loading para páginas inteiras
interface PageLoaderProps {
  message?: string
  className?: string
}

export function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div className={cn('flex min-h-[200px] flex-col items-center justify-center gap-3', className)}>
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}

// Componente de loading para tela cheia (auth, etc)
interface FullScreenLoaderProps {
  message?: string
  submessage?: string
}

export function FullScreenLoader({ message = 'Carregando...', submessage }: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <div className="space-y-1">
          <p className="text-lg font-medium">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground">{submessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Spinner
