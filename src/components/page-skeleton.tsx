import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// =============================================
// SKELETON MINIMALISTA E LIMPO
// Sem bordas, suave, sem poluição visual
// =============================================

interface PageSkeletonProps {
  className?: string
}

// Skeleton para título e descrição da página
export function HeaderSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-7 w-48 bg-muted/40" />
      <Skeleton className="h-4 w-72 bg-muted/30" />
    </div>
  )
}

// Skeleton para botão
export function ButtonSkeleton({ className }: PageSkeletonProps) {
  return <Skeleton className={cn('h-9 w-28 rounded-md bg-muted/40', className)} />
}

// Skeleton para select/dropdown
export function SelectSkeleton({ className }: PageSkeletonProps) {
  return <Skeleton className={cn('h-9 w-[180px] rounded-md bg-muted/40', className)} />
}

// Skeleton para card métrica (stats)
export function MetricCardSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('p-4 rounded-lg bg-muted/20 space-y-3', className)}>
      <Skeleton className="h-4 w-24 bg-muted/40" />
      <Skeleton className="h-8 w-20 bg-muted/50" />
      <Skeleton className="h-3 w-16 bg-muted/30" />
    </div>
  )
}

// Skeleton para card grande (conteúdo)
export function CardSkeleton({ className, lines = 4 }: PageSkeletonProps & { lines?: number }) {
  return (
    <div className={cn('p-4 rounded-lg bg-muted/20 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 bg-muted/40" />
        <Skeleton className="h-4 w-4 rounded bg-muted/30" />
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="h-4 bg-muted/30" 
            style={{ width: `${85 + Math.random() * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// Skeleton para linha de tabela
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 bg-muted/30 flex-1" 
          style={{ maxWidth: i === 0 ? '200px' : i === cols - 1 ? '80px' : undefined }}
        />
      ))}
    </div>
  )
}

// Skeleton para tabela completa
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-4 py-2 border-b border-muted/20">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 bg-muted/40 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  )
}

// Skeleton para gráfico
export function ChartSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('p-4 rounded-lg bg-muted/20', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-40 bg-muted/40" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded bg-muted/30" />
          <Skeleton className="h-6 w-16 rounded bg-muted/30" />
        </div>
      </div>
      <div className="h-[200px] flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 bg-muted/30 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// Skeleton para input com label
export function InputSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-20 bg-muted/40" />
      <Skeleton className="h-9 w-full rounded-md bg-muted/30" />
    </div>
  )
}

// Skeleton para lista de itens
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
          <Skeleton className="h-10 w-10 rounded-lg bg-muted/40" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-muted/40" />
            <Skeleton className="h-3 w-48 bg-muted/30" />
          </div>
          <Skeleton className="h-6 w-16 rounded bg-muted/30" />
        </div>
      ))}
    </div>
  )
}

// Skeleton para integração card
export function IntegrationCardSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('p-4 rounded-lg bg-muted/20 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg bg-muted/40" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24 bg-muted/40" />
          <Skeleton className="h-3 w-48 bg-muted/30" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-muted/30" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full bg-muted/30" />
        <Skeleton className="h-4 w-3/4 bg-muted/30" />
      </div>
      <Skeleton className="h-9 w-32 rounded-md bg-muted/40" />
    </div>
  )
}

// Skeleton para formulário de settings
export function SettingsFormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <InputSkeleton key={i} />
      ))}
      <Skeleton className="h-9 w-24 rounded-md bg-muted/40 mt-4" />
    </div>
  )
}

// Skeleton para página de settings completa
export function SettingsPageSkeleton() {
  return (
    <div className="w-full p-4 md:p-6 space-y-6 max-w-2xl">
      <HeaderSkeleton />
      <div className="rounded-lg bg-muted/10 p-6">
        <SettingsFormSkeleton fields={4} />
      </div>
    </div>
  )
}

// Skeleton para página com header + cards
export function PageWithCardsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <HeaderSkeleton />
        <div className="flex gap-2">
          <SelectSkeleton />
          <ButtonSkeleton />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <CardSkeleton lines={6} />
    </div>
  )
}

// Skeleton para página com tabela
export function PageWithTableSkeleton() {
  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <HeaderSkeleton />
        <div className="flex gap-2">
          <SelectSkeleton />
          <ButtonSkeleton />
        </div>
      </div>
      <div className="rounded-lg bg-muted/10 p-4">
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  )
}
