import { useState } from 'react'
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, BarChart3, Download, Layers } from 'lucide-react'
import { FilterState } from './transaction-filters'
import { FinanceCategory } from '@/types/finance'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceDockProps {
  onAddTransaction: () => void
  onToggleCharts: () => void
  onToggleSearch: () => void
  onExportCSV: () => void
  onExportSummary: () => void
  onToggleSidebar: () => void
  showCharts?: boolean
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: FinanceCategory[]
  showFilters: boolean
  onToggleFilters: () => void
}

export const FinanceDock = ({
  onAddTransaction,
  onToggleCharts,
  onToggleSearch,
  onExportCSV,
  onExportSummary,
  onToggleSidebar,
  showCharts,
  filters,
  onFiltersChange,
  categories,
  showFilters,
  onToggleFilters,
}: FinanceDockProps) => {
  const { t } = useI18n()
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value !== 'all' && value !== ''
  ).length

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      category: 'all',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: '',
      dateTo: '',
    })
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:block">
      <Dock className="bg-background/80 backdrop-blur-lg border shadow-lg">
        {/* Adicionar Transação */}
        <DockItem>
          <DockIcon>
            <button
              onClick={onAddTransaction}
              className={cn(
                "flex items-center justify-center w-full h-full transition-colors",
                "hover:bg-primary hover:text-primary-foreground rounded-lg"
              )}
            >
              <Plus className="h-5 w-5" />
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.new')}</DockLabel>
        </DockItem>

        {/* Buscar */}
        <DockItem>
          <DockIcon>
            <button
              onClick={onToggleSearch}
              className="flex items-center justify-center w-full h-full transition-colors hover:bg-accent rounded-lg"
            >
              <Search className="h-5 w-5" />
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.search')}</DockLabel>
        </DockItem>

        {/* Filtros - controla o Popover da página */}
        <DockItem>
          <DockIcon>
            <button 
              onClick={onToggleFilters}
              className="flex items-center justify-center w-full h-full transition-colors hover:bg-accent rounded-lg relative"
            >
              <Filter className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.filters')}</DockLabel>
        </DockItem>

        {/* Gráficos */}
        <DockItem>
          <DockIcon>
            <button
              onClick={onToggleCharts}
              className={cn(
                "flex items-center justify-center w-full h-full transition-colors rounded-lg",
                showCharts 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent"
              )}
            >
              <BarChart3 className="h-5 w-5" />
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.charts')}</DockLabel>
        </DockItem>

        {/* Exportar */}
        <DockItem>
          <DockIcon>
            <button 
              onClick={onExportCSV}
              className="flex items-center justify-center w-full h-full transition-colors hover:bg-accent rounded-lg"
            >
              <Download className="h-5 w-5" />
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.export')}</DockLabel>
        </DockItem>

        {/* Elementos */}
        <DockItem>
          <DockIcon>
            <button
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-full h-full transition-colors hover:bg-accent rounded-lg"
            >
              <Layers className="h-5 w-5" />
            </button>
          </DockIcon>
          <DockLabel>{t('finance.dock.blocks')}</DockLabel>
        </DockItem>
      </Dock>
    </div>
  )
}
