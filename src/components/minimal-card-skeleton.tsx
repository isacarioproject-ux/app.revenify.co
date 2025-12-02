import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Skeleton minimalista e bonito
 * Apenas overlay com pulse suave - SEM mostrar componentes internos
 */
export const MinimalCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn(
    "relative overflow-hidden bg-card border border-border/40",
    className
  )}>
    {/* Overlay com gradiente animado */}
    <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-muted/10 to-muted/5">
      {/* Brilho sutil que se move */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent"
        style={{
          animation: 'shimmer 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
    </div>
    
    {/* Ponto de pulse central (opcional - mais sutil) */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-primary/10 animate-pulse" />
    </div>
  </Card>
)
