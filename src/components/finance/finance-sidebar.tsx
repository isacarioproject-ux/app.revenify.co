import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table as TableIcon,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Tag,
  Target,
  Receipt,
  X,
} from 'lucide-react'
import { CategoriesManager } from './categories-manager'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddElement: (type: string) => void
}

export const FinanceSidebar = ({
  open,
  onOpenChange,
  onAddElement,
}: FinanceSidebarProps) => {
  const { t } = useI18n()
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  
  const FINANCE_ELEMENTS_TRANSLATED = [
    {
      id: 'transactions-table',
      name: t('finance.sidebar.transactionsTable'),
      description: t('finance.sidebar.transactionsTableDesc'),
      icon: TableIcon,
      color: 'text-blue-500',
    },
    {
      id: 'budget-tracker',
      name: t('finance.sidebar.budgetTracker'),
      description: t('finance.sidebar.budgetTrackerDesc'),
      icon: Target,
      color: 'text-purple-500',
    },
    {
      id: 'category-summary',
      name: t('finance.sidebar.categorySummary'),
      description: t('finance.sidebar.categorySummaryDesc'),
      icon: Tag,
      color: 'text-orange-500',
    },
    {
      id: 'monthly-chart',
      name: t('finance.sidebar.monthlyChart'),
      description: t('finance.sidebar.monthlyChartDesc'),
      icon: BarChart3,
      color: 'text-green-500',
    },
    {
      id: 'pie-chart',
      name: t('finance.sidebar.pieChart'),
      description: t('finance.sidebar.pieChartDesc'),
      icon: PieChart,
      color: 'text-pink-500',
    },
    {
      id: 'trend-chart',
      name: t('finance.sidebar.trendChart'),
      description: t('finance.sidebar.trendChartDesc'),
      icon: TrendingUp,
      color: 'text-cyan-500',
    },
    {
      id: 'calendar-view',
      name: t('finance.sidebar.calendarView'),
      description: t('finance.sidebar.calendarViewDesc'),
      icon: Calendar,
      color: 'text-indigo-500',
    },
    {
      id: 'receipts',
      name: t('finance.sidebar.receipts'),
      description: t('finance.sidebar.receiptsDesc'),
      icon: Receipt,
      color: 'text-amber-500',
    },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
          <SheetHeader className="px-4 sm:px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{t('finance.sidebar.title')}</SheetTitle>
                <SheetDescription className="mt-1">
                  {t('finance.sidebar.description')}
                </SheetDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="px-4 sm:px-6 py-4 space-y-6">
              {/* Seção: Dados */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('finance.sidebar.data')}
                </h3>
                <div className="grid gap-2">
                  {FINANCE_ELEMENTS_TRANSLATED.slice(0, 3).map((element) => (
                    <button
                      key={element.id}
                      onClick={() => {
                        onAddElement(element.id)
                        onOpenChange(false)
                      }}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left"
                    >
                      <div className={`p-2 rounded-md bg-muted group-hover:bg-background transition-colors`}>
                        <element.icon className={`h-4 w-4 ${element.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {element.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {element.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção: Visualizações */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('finance.sidebar.visualizations')}
                </h3>
                <div className="grid gap-2">
                  {FINANCE_ELEMENTS_TRANSLATED.slice(3, 6).map((element) => (
                    <button
                      key={element.id}
                      onClick={() => {
                        onAddElement(element.id)
                        onOpenChange(false)
                      }}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left"
                    >
                      <div className={`p-2 rounded-md bg-muted group-hover:bg-background transition-colors`}>
                        <element.icon className={`h-4 w-4 ${element.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {element.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {element.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção: Outros */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('finance.sidebar.others')}
                </h3>
                <div className="grid gap-2">
                  {FINANCE_ELEMENTS_TRANSLATED.slice(6).map((element) => (
                    <button
                      key={element.id}
                      onClick={() => {
                        onAddElement(element.id)
                        onOpenChange(false)
                      }}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left"
                    >
                      <div className={`p-2 rounded-md bg-muted group-hover:bg-background transition-colors`}>
                        <element.icon className={`h-4 w-4 ${element.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {element.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {element.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gerenciar Categorias */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('finance.sidebar.settings')}
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCategoriesManager(true)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {t('finance.sidebar.manageCategories')}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog de categorias */}
      <CategoriesManager
        open={showCategoriesManager}
        onOpenChange={setShowCategoriesManager}
        onUpdate={() => {
          // Callback para atualizar categorias
        }}
      />
    </>
  )
}
