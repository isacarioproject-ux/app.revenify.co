import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Plus,
  Search,
  Filter,
  BarChart3,
  Download,
  Layers,
  FileText,
  TrendingUp,
  Calendar,
  Target,
  Receipt,
  DollarSign,
  PieChart,
} from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceCommandMenuProps {
  onAddTransaction: () => void
  onToggleSearch: () => void
  onToggleFilters: () => void
  onToggleCharts: () => void
  onExport: () => void
  onToggleSidebar: () => void
  onAddBlock: (blockType: string) => void
}

export const FinanceCommandMenu = ({
  onAddTransaction,
  onToggleSearch,
  onToggleFilters,
  onToggleCharts,
  onExport,
  onToggleSidebar,
  onAddBlock,
}: FinanceCommandMenuProps) => {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleAction = (action: () => void) => {
    action()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('finance.command.title')} />
      <CommandList>
        <CommandEmpty>{t('finance.command.noResults')}</CommandEmpty>
        
        <CommandGroup heading={t('finance.command.quickActions')}>
          <CommandItem onSelect={() => handleAction(onAddTransaction)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>{t('finance.newTransaction')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">N</span>
            </kbd>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(onToggleSearch)}>
            <Search className="mr-2 h-4 w-4" />
            <span>{t('finance.command.searchTransactions')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">S</span>
            </kbd>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(onToggleFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            <span>{t('finance.filters')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">F</span>
            </kbd>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(onToggleCharts)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>{t('finance.command.toggleCharts')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">G</span>
            </kbd>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(onExport)}>
            <Download className="mr-2 h-4 w-4" />
            <span>{t('finance.command.exportData')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">E</span>
            </kbd>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(onToggleSidebar)}>
            <Layers className="mr-2 h-4 w-4" />
            <span>{t('finance.elements')}</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">B</span>
            </kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('finance.command.addBlocks')}>
          <CommandItem onSelect={() => handleAction(() => onAddBlock('quick-expense'))}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.quickExpense')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('category-summary'))}>
            <PieChart className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.categorySummary')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('transaction-table'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.transactionTable')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('recurring-bills'))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.recurringBills')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('calendar'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.calendar')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('receipts'))}>
            <Receipt className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.receipts')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('goals'))}>
            <Target className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.goals')}</span>
          </CommandItem>
          
          <CommandItem onSelect={() => handleAction(() => onAddBlock('monthly-report'))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>{t('finance.blocks.monthlyReport')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
