import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton SUAVE e minimalista para cards do dashboard
export const CardSkeleton = () => (
  <Card className="w-full h-[400px] md:h-auto flex flex-col overflow-hidden border-gray-200/40 dark:border-gray-800/40">
    {/* Header super minimalista */}
    <CardHeader className="pb-1.5 px-3 py-2 border-b border-gray-200/20 dark:border-gray-800/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center gap-0.5">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </CardHeader>
    
    {/* Conteúdo com espaçamento maior (mais suave) */}
    <CardContent className="flex-1 p-3 space-y-2">
      {/* Tabs muito finos */}
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-gray-200/15 dark:border-gray-800/15">
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
      
      {/* Lista com linhas mais finas e espaçadas (menos linhas) */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-[92%] rounded-md" />
        <Skeleton className="h-7 w-[96%] rounded-md" />
      </div>
    </CardContent>
  </Card>
)

export const StatsSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-3 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20 mt-1" />
    </CardContent>
  </Card>
)

// Skeleton para tabela de documentos financeiros
export const FinanceTableSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="p-4 space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2 rounded-md">
        <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
        <Skeleton className="h-4 flex-1 max-w-[200px]" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
      </div>
    ))}
  </div>
)

// Skeleton para header da página de finanças
export const FinanceHeaderSkeleton = () => (
  <div className="flex items-center justify-between gap-2 px-8 py-3 border-b">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
    <div className="flex items-center gap-1">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
)

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-10 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

// Skeleton minimalista para 4 cards do dashboard (número real)
export const DashboardSkeleton = () => (
  <div className="grid gap-3 md:gap-[3px] grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full md:h-full md:auto-rows-fr">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
)

// Skeleton minimalista para sidebar (largura fixa igual AppSidebar)
export const SidebarSkeleton = () => (
  <aside className="hidden md:flex h-full w-64 flex-col gap-3 border-r border-gray-200/50 dark:border-gray-800/50 bg-background p-4">
    {/* Logo/Header */}
    <div className="flex items-center gap-2 pb-3 border-b border-gray-200/30 dark:border-gray-800/30">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-5 w-28" />
    </div>
    
    {/* Menu items */}
    <div className="space-y-2">
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-9 w-[85%] rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-9 w-[90%] rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
    
    {/* Espaçador */}
    <div className="flex-1" />
    
    {/* Bottom items */}
    <div className="space-y-2 pt-3 border-t border-gray-200/30 dark:border-gray-800/30">
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  </aside>
)

// Skeleton minimalista para header principal
export const HeaderSkeleton = () => (
  <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-border/40 bg-sidebar px-3">
    {/* Toggle sidebar - visível apenas em mobile */}
    <Skeleton className="h-8 w-8 rounded-md md:hidden" />
    <div className="flex flex-1 items-center justify-end gap-2">
      {/* Button de busca */}
      <Skeleton className="h-7 w-auto md:w-48 lg:w-56 rounded-md" />
      {/* ThemeToggle */}
      <Skeleton className="h-8 w-8 rounded-md" />
      {/* LanguageSwitcher */}
      <Skeleton className="h-7 w-7 rounded-md" />
    </div>
  </header>
)

// Preload inicial - Logo R animada igual ao callback
export const InitialPreload = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
    <div className="relative w-16 h-16">
      {/* Logo central */}
      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center animate-pulse">
        <span className="text-2xl font-bold text-primary">R</span>
      </div>
      {/* Barra de progresso circular */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary/20"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray="44 132"
        />
      </svg>
    </div>
  </div>
)

// Skeleton para cards da Dashboard - Leve e elegante
export const DashboardCardSkeleton = () => (
  <div className="relative overflow-hidden rounded-lg border bg-card shadow-sm animate-pulse">
    {/* Header do card */}
    <div className="flex items-center justify-between p-4 border-b bg-muted/5">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
    
    {/* Conteúdo */}
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  </div>
)

// Grid de Skeleton para Dashboard
export const DashboardGridSkeleton = () => (
  <div className="grid gap-3 md:gap-[3px] grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full md:h-full md:auto-rows-fr">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <DashboardCardSkeleton key={i} />
    ))}
  </div>
)

// Skeleton apenas para o Header de um Card (para usar quando card está carregando dados individuais)
export const CardHeaderSkeleton = () => (
  <div className="flex items-center justify-between gap-2 px-0.5 py-0.5 animate-pulse">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-8 rounded" />
    </div>
    <div className="flex items-center gap-1">
      <Skeleton className="h-7 w-7 rounded" />
      <Skeleton className="h-7 w-7 rounded" />
      <Skeleton className="h-7 w-7 rounded" />
    </div>
  </div>
)
