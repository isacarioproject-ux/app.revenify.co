import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, Plus,
  BarChart3, Download, Layers, Target, X, Search, ImagePlus, Cloud, Loader2,
  FileSpreadsheet, FileText, Table2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FinanceDocument, FinanceTransaction, FinanceCategory } from '@/types/finance'
import { TransactionTable } from './transaction-table'
import { TransactionFilters, FilterState } from './transaction-filters'
import { FinanceCharts } from './finance-charts'
import { FinanceSidebar } from './finance-sidebar'
import { BudgetTracker } from './budget-tracker'
import { AddTransactionDrawer } from './add-transaction-drawer'
import { FinanceBlockWrapper } from './finance-block-wrapper'
import { SortableBlock } from './sortable-block'
import { QuickExpenseBlock, CategorySummaryBlock, RecurringBillsBlock, CalendarBlock, ReceiptsBlock, GoalsBlock, MonthlyReportBlock } from './blocks'
import { exportToCSV, exportSummaryToCSV } from '@/lib/export-finance'
import { exportToPDF, exportSummaryToPDF } from '@/lib/export-finance-pdf'
import { FinanceCommandMenu } from './finance-command-menu'
import { OfflineIndicator } from '@/components/offline-indicator'
import { cacheData, getCachedData } from '@/hooks/use-offline-sync'
import { FINANCE_BLOCKS_REGISTRY, getBlocksByCategory } from '@/lib/finance-blocks-registry'
import { useFinanceBlocks } from '@/hooks/use-finance-blocks'
import { verifyAndFixDocumentTotals } from '@/lib/finance-totals'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { FinanceDock } from './finance-dock'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { DriveService } from '@/services/google/drive.service'
import { FinanceCoverSelector } from './finance-cover-selector'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FinanceViewerProps {
  docId: string
  onBack: () => void
  showSidebar?: boolean
  setShowSidebar?: (show: boolean) => void
  onCoverChange?: (coverUrl: string | null) => void
  currentCover?: string | null
}

export const FinanceViewer = ({ 
  docId, 
  onBack,
  showSidebar: externalShowSidebar,
  setShowSidebar: externalSetShowSidebar,
  onCoverChange,
  currentCover: externalCurrentCover
}: FinanceViewerProps) => {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados do documento
  const [financeDoc, setFinanceDoc] = useState<FinanceDocument | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [iconEmoji, setIconEmoji] = useState<string | null>(null)
  const [coverImg, setCoverImg] = useState<string | null>(null)
  const [referenceMonth, setReferenceMonth] = useState<number | null>(null)
  const [referenceYear, setReferenceYear] = useState<number | null>(null)

  // Estados de transações
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [allTransactions, setAllTransactions] = useState<FinanceTransaction[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [showCharts, setShowCharts] = useState(false)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFiltersDialog, setShowFiltersDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [savingToDrive, setSavingToDrive] = useState(false)
  const { isConnected: isGoogleConnected } = useGoogleIntegration()
  const [internalShowSidebar, setInternalShowSidebar] = useState(false)
  
  // Usar props externas se fornecidas, senão usar estado interno
  const showSidebar = externalShowSidebar !== undefined ? externalShowSidebar : internalShowSidebar
  const setShowSidebar = externalSetShowSidebar || setInternalShowSidebar
  
  // Atalhos de teclado individuais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + K já é tratado pelo CommandMenu
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        return
      }

      // Atalhos individuais
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowAddTransaction(true)
      } else if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowSearch(true)
      } else if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowFiltersDialog(!showFiltersDialog)
      } else if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowCharts(!showCharts)
      } else if (e.key === 'e' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowExportDialog(true)
      } else if (e.key === 'b' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowSidebar(!showSidebar)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showFiltersDialog, showCharts, showSidebar])
  
  // Hook para gerenciar blocos (persiste no banco)
  const {
    blocks,
    loading: blocksLoading,
    addBlock,
    removeBlock,
    reorderBlocks,
    hasBlock,
  } = useFinanceBlocks(docId)

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handler de drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)

      const newBlocks = arrayMove(blocks, oldIndex, newIndex)
      reorderBlocks(newBlocks)
    }
  }

  // IDs dos blocos para o SortableContext
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks])

  const fetchDocument = async () => {
    if (!docId) {
      toast.error('ID do documento não fornecido')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finance_documents')
        .select('*')
        .eq('id', docId)
        .single()

      if (error) {
        console.error('Error fetching document:', error)
        throw error
      }

      if (data) {
        setFinanceDoc(data)
        setTitle(data.name)
        setDescription(data.description || '')
        setIconEmoji(data.icon)
        // Usar capa externa se fornecida, senão usar a do documento
        setCoverImg(externalCurrentCover !== undefined ? externalCurrentCover : data.cover_image)
        setReferenceMonth(data.reference_month)
        setReferenceYear(data.reference_year)
        
        // Verificar e corrigir totais se necessário (executa em background)
        verifyAndFixDocumentTotals(docId).then((fixed) => {
          if (fixed) {
            // Recarregar documento para atualizar totais na UI
            supabase
              .from('finance_documents')
              .select('total_income, total_expenses, balance')
              .eq('id', docId)
              .single()
              .then(({ data: updatedDoc }) => {
                if (updatedDoc) {
                  setFinanceDoc(prev => prev ? { ...prev, ...updatedDoc } : prev)
                }
              })
          }
        })
      } else {
        toast.error('Documento não encontrado')
      }
    } catch (err: any) {
      console.error('Error in fetchDocument:', err)
      toast.error('Erro ao carregar documento', {
        description: err.message || 'Tente novamente mais tarde',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!docId) return

    try {
      // Tentar carregar do cache primeiro se estiver offline
      if (!navigator.onLine) {
        const cached = getCachedData<FinanceTransaction[]>(`transactions_${docId}`)
        if (cached) {
          setAllTransactions(cached)
          applyFilters(cached, filters)
          return
        }
      }

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('finance_document_id', docId)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }

      // Cachear dados para uso offline
      if (data) {
        cacheData(`transactions_${docId}`, data)
      }

      setAllTransactions(data || [])
      applyFilters(data || [], filters)
    } catch (err: any) {
      // Se falhar, tentar carregar do cache
      const cached = getCachedData<FinanceTransaction[]>(`transactions_${docId}`)
      if (cached) {
        setAllTransactions(cached)
        applyFilters(cached, filters)
        toast.warning('Usando dados em cache (offline)')
      } else {
        toast.error('Erro ao carregar transações', {
          description: err.message,
        })
      }
    }
  }

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error

      setCategories(data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar categorias', {
        description: err.message,
      })
    }
  }

  // Aplicar filtros
  const applyFilters = (data: FinanceTransaction[], filterState: FilterState) => {
    let filtered = [...data]

    // Busca por texto
    if (filterState.search) {
      const search = filterState.search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search) ||
          (t.notes && t.notes.toLowerCase().includes(search))
      )
    }

    // Filtro por tipo
    if (filterState.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filterState.type)
    }

    // Filtro por categoria
    if (filterState.category !== 'all') {
      filtered = filtered.filter((t) => t.category === filterState.category)
    }

    // Filtro por status
    if (filterState.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filterState.status)
    }

    // Filtro por método de pagamento
    if (filterState.paymentMethod !== 'all') {
      filtered = filtered.filter((t) => t.payment_method === filterState.paymentMethod)
    }

    setTransactions(filtered)
  }

  // Atualizar filtros
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    applyFilters(allTransactions, newFilters)
  }

  // Handler de adicionar elemento
  const handleAddElement = async (elementType: string) => {
    setShowSidebar(false) // Fecha sidebar ao adicionar
    
    // Casos especiais (modals/drawers)
    if (elementType === 'charts') {
      setShowCharts(true)
      return
    }

    // Adicionar bloco usando o hook (persiste no banco)
    await addBlock(elementType as any)
  }

  // Exportar
  const handleExport = (type: 'transactions' | 'summary', format: 'csv' | 'pdf' = 'csv') => {
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`
    
    if (format === 'pdf') {
      if (type === 'transactions') {
        exportToPDF(transactions, filename, title)
        toast.success(t('finance.export.successPDF'))
      } else {
        exportSummaryToPDF(transactions, filename, title)
        toast.success(t('finance.export.successPDF'))
      }
    } else {
      if (type === 'transactions') {
        exportToCSV(transactions, filename)
        toast.success(t('finance.export.success'))
      } else {
        exportSummaryToCSV(transactions, filename)
        toast.success(t('finance.export.success'))
      }
    }
  }

  const saveDocument = async () => {
    if (!docId || !financeDoc) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('finance_documents')
        .update({
          name: title,
          description: description || null,
          icon: iconEmoji,
          cover_image: coverImg,
          reference_month: referenceMonth,
          reference_year: referenceYear,
        })
        .eq('id', docId)

      if (error) throw error

      // Atualizar estado local
      setFinanceDoc({
        ...financeDoc,
        name: title,
        description: description || null,
        icon: iconEmoji,
        cover_image: coverImg,
        reference_month: referenceMonth,
        reference_year: referenceYear,
      })

      // Notificar mudança de capa se callback fornecido
      if (onCoverChange) {
        onCoverChange(coverImg)
      }
    } catch (err: any) {
      console.error('Error saving document:', err)
      toast.error('Erro ao salvar', {
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  // Sincronizar capa externa
  useEffect(() => {
    if (externalCurrentCover !== undefined) {
      setCoverImg(externalCurrentCover)
    }
  }, [externalCurrentCover])

  // Fetch inicial
  useEffect(() => {
    if (docId) {
    fetchDocument()
    fetchTransactions()
    fetchCategories()
    }
  }, [docId])

  // Supabase Realtime DESABILITADO - usando atualização otimista local
  // O TransactionTable agora gerencia seu próprio estado local
  // para evitar recarregamentos desnecessários

  // Auto-save ao alterar
  useEffect(() => {
    if (!financeDoc || !docId) return
    const timeout = setTimeout(() => {
      saveDocument()
    }, 1000)
    return () => clearTimeout(timeout)
  }, [title, description, iconEmoji, coverImg, referenceMonth, referenceYear, financeDoc, docId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-20 w-32 rounded-lg" />
            <Skeleton className="h-20 w-32 rounded-lg" />
            <Skeleton className="h-20 w-32 rounded-lg" />
          </div>
        </div>
        
        {/* Toolbar skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        
        {/* Table skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        {/* Blocks skeleton */}
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Documento não encontrado</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full min-h-full bg-background">
            {/* Conteúdo principal */}
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 max-w-5xl mx-auto">

          {/* Capa (se existir) */}
          {coverImg && (
            <div className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 -mt-4 sm:-mt-6 md:-mt-8 lg:-mt-12 mb-6 h-32 sm:h-48 md:h-56 overflow-hidden group">
              {coverImg.startsWith('linear-gradient') || coverImg.startsWith('radial-gradient') ? (
                <div 
                  className="w-full h-full"
                  style={{ background: coverImg }}
                />
              ) : coverImg.startsWith('#') ? (
                <div 
                  className="w-full h-full"
                  style={{ backgroundColor: coverImg }}
                />
              ) : (
                <img src={coverImg} alt={t('finance.viewer.coverAlt')} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (onCoverChange) {
                      onCoverChange(null)
                    }
                    setCoverImg(null)
                    await saveDocument()
                  }}
                >
                  {t('finance.viewer.removeCover')}
                </Button>
              </div>
            </div>
          )}

          {/* Ícone emoji - clicável para editar */}
          <div className="mb-4 sm:mb-5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-5xl sm:text-6xl md:text-8xl leading-none cursor-pointer select-none hover:scale-105 transition-transform focus:outline-none">
                  {iconEmoji || '📄'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="grid grid-cols-6 gap-2">
                  {['📊', '💰', '💵', '📈', '🏦', '💳', '🎯', '📋', '💼', '📁', '🧾', '💎', '📄', '💹', '🏠', '🚗', '✈️', '🍔'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={async () => {
                        setIconEmoji(emoji)
                        await supabase
                          .from('finance_documents')
                          .update({ icon: emoji })
                          .eq('id', docId)
                      }}
                      className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Título editável - estilo Notion */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('finance.viewer.titlePlaceholder')}
            className="text-3xl sm:text-4xl md:text-5xl font-bold border-none px-0 mb-1 sm:mb-2 h-auto py-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/20 tracking-tight"
          />

          {/* Período de referência - estilo Notion (sem borders) */}
          <div className="flex items-center gap-1 mb-4 text-muted-foreground/60 hover:text-muted-foreground transition-colors group">
            <Calendar className="h-4 w-4" />
            <Select
              value={referenceMonth?.toString() || ''}
              onValueChange={async (value) => {
                const month = value ? parseInt(value) : null
                setReferenceMonth(month)
                await supabase
                  .from('finance_documents')
                  .update({ reference_month: month })
                  .eq('id', docId)
              }}
            >
              <SelectTrigger className="w-auto h-auto p-0 border-0 shadow-none bg-transparent text-sm font-light focus:ring-0 [&>svg]:hidden">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2024, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>/</span>
            <Select
              value={referenceYear?.toString() || ''}
              onValueChange={async (value) => {
                const year = value ? parseInt(value) : null
                setReferenceYear(year)
                await supabase
                  .from('finance_documents')
                  .update({ reference_year: year })
                  .eq('id', docId)
              }}
            >
              <SelectTrigger className="w-auto h-auto p-0 border-0 shadow-none bg-transparent text-sm font-light focus:ring-0 [&>svg]:hidden">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[2023,2024,2025,2026,2027,2028].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição editável - estilo Notion */}
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('finance.viewer.descriptionPlaceholder')}
            className="mb-5 sm:mb-6 border-none px-0 text-base sm:text-lg h-auto py-0 focus-visible:ring-0 bg-transparent text-muted-foreground/80 placeholder:text-muted-foreground/30 font-light"
          />

          {/* Card de resumo financeiro - clean e compacto */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-lg bg-card border border-border/50 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{t('finance.charts.income')}</p>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-green-600">
                {formatCurrency(Number(financeDoc?.total_income || 0))}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-card border border-border/50 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{t('finance.charts.expenses')}</p>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-red-600">
                {formatCurrency(Number(financeDoc?.total_expenses || 0))}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-card border border-border/50 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-foreground" />
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{t('finance.charts.balance')}</p>
              </div>
              <p
                className={cn(
                  'text-sm sm:text-lg md:text-xl font-bold',
                  Number(financeDoc?.balance || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                )}
              >
                {formatCurrency(Number(financeDoc?.balance || 0))}
              </p>
            </div>
          </div>

          {/* Barra de ferramentas - compacta */}
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 md:hidden">
              {/* Input de busca - Mobile apenas */}
              <TransactionFilters
                categories={categories}
                onFilterChange={handleFilterChange}
                open={showFiltersDialog}
                onOpenChange={setShowFiltersDialog}
                hideButton={true}
              />
            </div>
            
            <div className="flex gap-2 flex-shrink-0 md:hidden">
              {/* Nova Transação - Mobile apenas */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTransaction(true)}
                className="h-8 px-3"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">{t('finance.dock.new')}</span>
              </Button>

              {/* Gráficos - Mobile apenas */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCharts(true)}
                className="h-8 px-3"
              >
                <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">{t('finance.dock.charts')}</span>
              </Button>

              {/* Exportar - Mobile apenas */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline text-xs">{t('finance.dock.export')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem className="gap-2" onClick={async () => {
                    try {
                      await exportToCSV(allTransactions, `transactions-${docId}`)
                      toast.success(t('finance.export.success'))
                    } catch (error) { toast.error(t('finance.export.error')) }
                  }}>
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="text-xs">CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={async () => {
                    try {
                      await exportToPDF(allTransactions, `transactions-${docId}`, title)
                      toast.success(t('finance.export.successPDF'))
                    } catch (error) { toast.error(t('finance.export.error')) }
                  }}>
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-xs">PDF</span>
                  </DropdownMenuItem>
                  {isGoogleConnected && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2"
                        disabled={savingToDrive}
                        onClick={async () => {
                          setSavingToDrive(true)
                          try {
                            const csvContent = allTransactions.map(t => 
                              `${t.transaction_date},${t.description},${t.category},${t.type === 'income' ? t.amount : -t.amount}`
                            ).join('\n')
                            const header = 'Data,Descrição,Categoria,Valor\n'
                            const blob = new Blob([header + csvContent], { type: 'text/csv' })
                            const file = new File([blob], `${title}_transacoes.csv`, { type: 'text/csv' })
                            const result = await DriveService.uploadFile(file)
                            toast.success(t('finance.export.driveSuccess'), {
                              action: { label: t('common.open'), onClick: () => window.open(result.webViewLink, '_blank') }
                            })
                          } catch (error: any) {
                            toast.error(t('finance.export.driveError'), { description: error.message })
                          } finally { setSavingToDrive(false) }
                        }}
                      >
                        {savingToDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        <span className="text-xs">Google Drive</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Renderizar blocos dinamicamente com drag & drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
              {!blocksLoading && blocks.map((block) => {
                // Budget Tracker
                if (block.block_type === 'budget-tracker') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="budget-tracker"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <BudgetTracker
                          documentId={docId}
                          month={new Date().getMonth() + 1}
                          year={new Date().getFullYear()}
                          categories={categories}
                          onRefresh={() => {
                            fetchTransactions()
                            fetchDocument()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Quick Expense Block
                if (block.block_type === 'quick-expense') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="quick-expense"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <QuickExpenseBlock
                          documentId={docId}
                          categories={categories.map(c => c.name)}
                          onRefresh={() => {
                            fetchTransactions()
                            fetchDocument()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Category Summary Block
                if (block.block_type === 'category-summary') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="category-summary"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <CategorySummaryBlock
                          documentId={docId}
                          transactions={allTransactions}
                          onRefresh={() => {
                            fetchTransactions()
                            fetchDocument()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Transaction Table
                if (block.block_type === 'transaction-table') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="transaction-table"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <TransactionTable
                          documentId={docId}
                          transactions={transactions}
                          categories={categories.map(c => c.name)}
                          onRefresh={() => {
                            fetchTransactions()
                            fetchDocument()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Recurring Bills Block
                if (block.block_type === 'recurring-bills') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="recurring-bills"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <RecurringBillsBlock
                          documentId={docId}
                          categories={categories.map(c => c.name)}
                          onRefresh={() => {
                            fetchTransactions()
                            fetchDocument()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Calendar Block
                if (block.block_type === 'calendar') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="calendar"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <CalendarBlock
                          documentId={docId}
                          transactions={allTransactions}
                          onRefresh={() => {
                            fetchTransactions()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                // Receipts Block
                if (block.block_type === 'receipts') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="receipts"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <ReceiptsBlock
                          documentId={docId}
                          onRefresh={() => {
                            fetchTransactions()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                if (block.block_type === 'goals') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="goals"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <GoalsBlock
                          documentId={docId}
                          categories={categories.map(c => c.name)}
                          transactions={transactions}
                          onRefresh={() => {
                            fetchTransactions()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                if (block.block_type === 'monthly-report') {
                  return (
                    <SortableBlock key={block.id} id={block.id}>
                      <FinanceBlockWrapper
                        type="monthly-report"
                        blockId={block.id}
                        onRemove={() => removeBlock(block.id)}
                        className="mb-6"
                      >
                        <MonthlyReportBlock
                          documentId={docId}
                          transactions={transactions}
                          onRefresh={() => {
                            fetchTransactions()
                          }}
                        />
                      </FinanceBlockWrapper>
                    </SortableBlock>
                  )
                }

                return null
              })}
            </SortableContext>
          </DndContext>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar de elementos - overlay mobile, inline desktop */}
      {showSidebar && (
        <>
          {/* Backdrop mobile - só aparece no mobile quando sidebar está aberta */}
          <div 
            className="fixed inset-0 bg-black/50 z-[45] md:hidden transition-opacity duration-200"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <div className={cn(
            "bg-background flex flex-col border-l z-50 transition-all duration-300 ease-in-out",
            // Mobile: fixed, full width
            "fixed top-0 right-0 bottom-0 w-full",
            // Desktop: relative, fixed width
            "md:relative md:w-[320px]"
          )}>
            {/* Header da sidebar - compacto */}
            <div className="px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
              <h3 className="text-xs font-semibold">{t('finance.sidebar.elements')}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="h-6 w-6 md:invisible"
                title={t('finance.viewer.close')}
              >
                <Layers className="h-3 w-3" />
              </Button>
            </div>

          {/* Conteúdo da sidebar com scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-4">
              {/* Renderizar blocos por categoria */}
              {['data', 'analysis', 'planning', 'tools'].map((category) => {
                const blocks = getBlocksByCategory(category)
                if (blocks.length === 0) return null

                const categoryNames: Record<string, string> = {
                  data: t('finance.sidebar.data'),
                  analysis: t('finance.sidebar.analysis'),
                  planning: t('finance.sidebar.planning'),
                  tools: t('finance.sidebar.tools'),
                }

                return (
                  <div key={category} className="space-y-1.5">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      {categoryNames[category]}
                    </h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {blocks.map((block) => {
                        const Icon = block.icon
                        return (
                          <button
                            key={block.type}
                            onClick={() => handleAddElement(block.type)}
                            disabled={!block.implemented}
                            className="group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div
                              className="p-1.5 rounded-md bg-muted group-hover:bg-background transition-colors"
                              style={{ backgroundColor: `${block.color}20` }}
                            >
                              <Icon
                                className="h-3.5 w-3.5"
                                style={{ color: block.color }}
                              />
                            </div>
                            <div className="w-full">
                              <p className="text-[10px] font-medium group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                {block.name}
                                {!block.implemented && (
                                  <span className="block text-[9px] text-muted-foreground">{t('finance.sidebar.comingSoon')}</span>
                                )}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          </div>
        </>
      )}

      {/* Modal de Gráficos */}
      <FinanceCharts
        open={showCharts}
        onOpenChange={setShowCharts}
        transactions={allTransactions}
        categories={categories}
      />

      {/* Drawer de Nova Transação */}
      <AddTransactionDrawer
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        documentId={docId}
        categories={categories.map(c => c.name)}
        onSuccess={() => {
          fetchTransactions()
          fetchDocument()
        }}
      />

      {/* Dialog de Busca - Desktop com animação */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="p-4 gap-0 sm:max-w-[500px] [&>button]:hidden">
          <DialogTitle className="sr-only">{t('finance.search.title')}</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
            <Input
              placeholder={t('finance.search.placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSearch(false)
                }
              }}
              className="pl-9 h-10 [&::-webkit-search-cancel-button]:hidden transition-all focus:ring-2 focus:ring-primary"
              autoFocus
              type="search"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportar - Desktop */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="p-4 gap-3 sm:max-w-[400px] [&>button]:hidden">
          <DialogTitle className="text-sm font-semibold">{t('finance.export.title')}</DialogTitle>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-10 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true)
                try {
                  await exportToCSV(allTransactions, `transactions-${docId}`)
                  toast.success(t('finance.export.success'))
                  setShowExportDialog(false)
                } catch (error) {
                  toast.error(t('finance.export.error'))
                } finally {
                  setIsExporting(false)
                }
              }}
            >
              <Download className={cn("h-4 w-4 mr-2 transition-transform", isExporting && "animate-bounce")} />
              {isExporting ? t('finance.export.exporting') : t('finance.export.transactions')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-10 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true)
                try {
                  await exportSummaryToCSV(allTransactions, `finance-${docId}`)
                  toast.success(t('finance.export.success'))
                  setShowExportDialog(false)
                } catch (error) {
                  toast.error(t('finance.export.error'))
                } finally {
                  setIsExporting(false)
                }
              }}
            >
              <Download className={cn("h-4 w-4 mr-2 transition-transform", isExporting && "animate-bounce")} />
              {isExporting ? t('finance.export.exporting') : t('finance.export.summary')}
            </Button>
            
            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('finance.export.pdf')}</span>
              </div>
            </div>
            
            {/* Botões PDF */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-10 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true)
                try {
                  await exportToPDF(allTransactions, `transactions-${docId}`, title)
                  toast.success(t('finance.export.successPDF'))
                  setShowExportDialog(false)
                } catch (error) {
                  toast.error(t('finance.export.error'))
                } finally {
                  setIsExporting(false)
                }
              }}
            >
              <Download className={cn("h-4 w-4 mr-2 transition-transform", isExporting && "animate-bounce")} />
              {isExporting ? t('finance.export.exporting') : t('finance.export.transactionsPDF')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-10 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true)
                try {
                  await exportSummaryToPDF(allTransactions, `finance-${docId}`, title)
                  toast.success(t('finance.export.successPDF'))
                  setShowExportDialog(false)
                } catch (error) {
                  toast.error(t('finance.export.error'))
                } finally {
                  setIsExporting(false)
                }
              }}
            >
              <Download className={cn("h-4 w-4 mr-2 transition-transform", isExporting && "animate-bounce")} />
              {isExporting ? t('finance.export.exporting') : t('finance.export.summaryPDF')}
            </Button>

            {/* Separador Google Drive */}
            {isGoogleConnected && (
              <>
                <div className="relative mt-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      Google Drive
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-10 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98] text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                  disabled={savingToDrive}
                  onClick={async () => {
                    setSavingToDrive(true)
                    try {
                      // Criar CSV e fazer upload
                      const csvContent = allTransactions.map(t => 
                        `${t.transaction_date},${t.description},${t.category},${t.type === 'income' ? t.amount : -t.amount}`
                      ).join('\n')
                      const header = 'Data,Descrição,Categoria,Valor\n'
                      const blob = new Blob([header + csvContent], { type: 'text/csv' })
                      const file = new File([blob], `${title}_transacoes.csv`, { type: 'text/csv' })
                      
                      const result = await DriveService.uploadFile(file)
                      
                      toast.success('Salvo no Google Drive!', {
                        action: {
                          label: 'Abrir',
                          onClick: () => window.open(result.webViewLink, '_blank')
                        }
                      })
                      setShowExportDialog(false)
                    } catch (error: any) {
                      toast.error('Erro ao salvar no Drive', { description: error.message })
                    } finally {
                      setSavingToDrive(false)
                    }
                  }}
                >
                  {savingToDrive ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4 mr-2" />
                  )}
                  {savingToDrive ? 'Salvando...' : 'Salvar Transações no Drive'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Menu - Atalhos de Teclado */}
      <FinanceCommandMenu
        onAddTransaction={() => setShowAddTransaction(true)}
        onToggleSearch={() => setShowSearch(true)}
        onToggleFilters={() => setShowFiltersDialog(!showFiltersDialog)}
        onToggleCharts={() => setShowCharts(!showCharts)}
        onExport={() => setShowExportDialog(true)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onAddBlock={(blockType) => addBlock(blockType as any)}
      />

      {/* Indicador de Status Offline */}
      <OfflineIndicator />

      {/* Dock de Navegação Rápida */}
      <FinanceDock
        onAddTransaction={() => setShowAddTransaction(true)}
        onToggleSearch={() => setShowSearch(true)}
        onToggleFilters={() => setShowFiltersDialog(!showFiltersDialog)}
        onToggleCharts={() => setShowCharts(!showCharts)}
        onExportCSV={() => setShowExportDialog(true)}
        onExportSummary={() => setShowExportDialog(true)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showCharts={showCharts}
        showFilters={showFiltersDialog}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
    </div>
  )
}
