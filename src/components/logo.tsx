import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  collapsed?: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, collapsed = false, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  if (collapsed) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <img 
          src="/pwa-192x192.png" 
          alt="ISACAR" 
          className={cn(sizeClasses[size], 'rounded-md')}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 transition-all', className)}>
      <img 
        src="/pwa-192x192.png" 
        alt="ISACAR" 
        className={cn(sizeClasses[size], 'rounded-md')}
      />
      {showText && (
        <span className="text-sm font-semibold tracking-tight">ISACAR</span>
      )}
    </div>
  )
}
