import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search, RotateCcw } from 'lucide-react'
import { FinanceCategory } from '@/types/finance'
import { useDebounce } from '@/hooks/use-debounce'
import { useI18n } from '@/hooks/use-i18n'

interface TransactionFiltersProps {
  categories: FinanceCategory[]
  onFilterChange: (filters: FilterState) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideButton?: boolean
}

export interface FilterState {
  search: string
  type: 'all' | 'income' | 'expense'
  category: string
  status: 'all' | 'pending' | 'completed'
  paymentMethod: string
  dateFrom: string
  dateTo: string
}

export const TransactionFilters = ({
  categories,
  onFilterChange,
  open,
  onOpenChange,
  hideButton = false,
}: TransactionFiltersProps) => {
  const { t } = useI18n()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
  })

  // Debounce apenas para busca (search)
  const debouncedSearch = useDebounce(filters.search, 300)

  // Notificar mudanças de filtros (exceto search que usa debounce)
  useEffect(() => {
    onFilterChange({ ...filters, search: debouncedSearch })
  }, [debouncedSearch, filters.type, filters.category, filters.status, filters.paymentMethod, filters.dateFrom, filters.dateTo])

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      type: 'all',
      category: 'all',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: '',
      dateTo: '',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value !== 'all' && value !== ''
  ).length

  return (
    <div className="flex gap-2 items-center">
      {/* Busca - Simples */}
      {isSearchOpen ? (
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder={t('finance.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchOpen(false)
                updateFilter('search', '')
              }
            }}
            onBlur={() => {
              if (!filters.search) setIsSearchOpen(false)
            }}
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="h-8 w-8 p-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      )}

      {/* Botão Filtros */}
      {!hideButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onOpenChange?.(!open)}
          className="h-8 gap-2 px-3"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">{t('finance.filters')}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Dialog de Filtros */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t('finance.filters')}
              </DialogTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                  <RotateCcw className="h-3 w-3" />
                  {t('finance.filters.clear')}
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('finance.filters.type')}</label>
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('finance.filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finance.filters.all')}</SelectItem>
                  <SelectItem value="income">{t('finance.filters.income')}</SelectItem>
                  <SelectItem value="expense">{t('finance.filters.expense')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('finance.filters.category')}</label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('finance.filters.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finance.filters.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('finance.filters.status')}</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('finance.filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finance.filters.all')}</SelectItem>
                  <SelectItem value="completed">{t('finance.filters.completed')}</SelectItem>
                  <SelectItem value="pending">{t('finance.filters.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Método de Pagamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('finance.filters.payment')}</label>
              <Select value={filters.paymentMethod} onValueChange={(value) => updateFilter('paymentMethod', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('finance.filters.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finance.filters.all')}</SelectItem>
                  <SelectItem value="money">{t('finance.payment.cash')}</SelectItem>
                  <SelectItem value="credit_card">{t('finance.payment.creditCard')}</SelectItem>
                  <SelectItem value="debit_card">{t('finance.payment.debitCard')}</SelectItem>
                  <SelectItem value="pix">{t('finance.payment.pix')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('finance.payment.bankTransfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('finance.filters.date')}</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{t('finance.filters.dateFrom')}</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{t('finance.filters.dateTo')}</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {activeFiltersCount > 0 && (
            <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {activeFiltersCount} {t('finance.filters.active')}
              </span>
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                <X className="h-3 w-3" />
                {t('finance.filters.clearAll')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
