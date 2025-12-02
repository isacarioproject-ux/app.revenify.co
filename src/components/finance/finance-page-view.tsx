import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Plus, 
  MoreVertical, 
  Copy, 
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Sparkles,
  FileSpreadsheet,
  Tag,
  Target,
  ArrowLeft,
  Layers,
  Settings,
  Mail,
} from 'lucide-react'
import { FinanceCoverSelector } from './finance-cover-selector'
import { useWorkspace } from '@/contexts/workspace-context'
import { useFinanceCard } from '@/hooks/use-finance-card'
import { toast } from 'sonner'
import { FinanceTemplateSelector } from './finance-template-selector'
import { FinanceViewer } from './finance-viewer'
import { GmailInvoiceScanner } from '@/components/integrations/gmail-invoice-scanner'
import { FinanceSettingsModal } from './finance-settings-modal'
import { CategoriesManager } from './categories-manager'
import { supabase } from '@/lib/supabase'
import { createDefaultBlocksForDocument } from '@/lib/finance-blocks-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Helper function para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Helper function para ícone do documento
const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'budget':
      return '💰'
    case 'expenses':
      return '📊'
    case 'income':
      return '💵'
    case 'report':
      return '📈'
    case 'accounts':
      return '🏦'
    default:
      return '📄'
  }
}

export const FinancePageView = () => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const [pageName] = useState(() => {
    const saved = localStorage.getItem('finance-page-name')
    return saved || t('finance.card.finances')
  })
  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    // Ler query param 'doc' da URL
    const params = new URLSearchParams(window.location.search)
    return params.get('doc')
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [currentCover, setCurrentCover] = useState<string | null>(null)
  const [showGmailImport, setShowGmailImport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { documents, loading, refetch } = useFinanceCard(currentWorkspace?.id)

  // Carregar projetos
  useEffect(() => {
    const loadProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')
      if (data) setProjects(data)
    }
    loadProjects()
  }, [])

  // Carregar capa quando documento é selecionado
  useEffect(() => {
    if (selectedDocId) {
      const loadCover = async () => {
        const { data } = await supabase
          .from('finance_documents')
          .select('cover_image')
          .eq('id', selectedDocId)
          .single()
        
        if (data) {
          setCurrentCover(data.cover_image)
        }
      }
      loadCover()
    } else {
      setCurrentCover(null)
    }
  }, [selectedDocId])

  // Calcular totais
  const totalBalance = documents.reduce((sum, doc) => sum + Number(doc.balance || 0), 0)
  const totalIncome = documents.reduce((sum, doc) => sum + Number(doc.total_income || 0), 0)
  const totalExpenses = documents.reduce((sum, doc) => sum + Number(doc.total_expenses || 0), 0)


  const handleDeleteDocument = async (id: string, name: string) => {
    const confirmed = window.confirm(`${t('finance.card.deleteDocConfirm')} "${name}"?`)
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('finance_documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(`"${name}" ${t('finance.card.deleted')}`)
      refetch()
    } catch (err: any) {
      toast.error(t('finance.card.errorDelete'), {
        description: err.message,
      })
    }
  }

  const handleDuplicateDocument = async (id: string, name: string) => {
    try {
      // Buscar documento original
      const { data: originalDoc, error: fetchError } = await supabase
        .from('finance_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Criar cópia
      const { data: newDoc, error: createError } = await supabase
        .from('finance_documents')
        .insert({
          user_id: originalDoc.user_id,
          workspace_id: originalDoc.workspace_id,
          name: `${name} ${t('finance.card.copy')}`,
          template_type: originalDoc.template_type,
          icon: originalDoc.icon,
          cover_image: originalDoc.cover_image,
          description: originalDoc.description,
          reference_month: originalDoc.reference_month,
          reference_year: originalDoc.reference_year,
          template_config: originalDoc.template_config,
          total_income: originalDoc.total_income,
          total_expenses: originalDoc.total_expenses,
          balance: originalDoc.balance,
        })
        .select()
        .single()

      if (createError) throw createError

      // Copiar transações
      const { data: transactions, error: transError } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('finance_document_id', id)

      if (!transError && transactions && transactions.length > 0) {
        const newTransactions = transactions.map((t: any) => ({
          finance_document_id: newDoc.id,
          user_id: t.user_id,
          type: t.type,
          category: t.category,
          amount: t.amount,
          description: t.description,
          transaction_date: t.transaction_date,
          payment_method: t.payment_method,
          status: t.status,
          notes: t.notes,
        }))

        await supabase.from('finance_transactions').insert(newTransactions)
      }

      toast.success(`"${name}" ${t('finance.card.duplicated')}`)
      refetch()
    } catch (err: any) {
      toast.error(t('finance.card.errorDuplicate'), {
        description: err.message,
      })
    }
  }

  const handleSelectTemplate = async (template: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Definir mês/ano atual
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const { data: newDoc, error } = await supabase
        .from('finance_documents')
        .insert({
          user_id: user.id,
          workspace_id: currentWorkspace?.id || null,
          name: template.name,
          template_type: template.template_type,
          icon: template.icon,
          reference_month: template.config.default_period === 'monthly' ? month : null,
          reference_year: year,
          template_config: template.config,
          project_id: selectedProjectId || null,
        })
        .select()
        .single()

      if (error) throw error

      if (newDoc) {
        setSelectedDocId(newDoc.id)
        refetch()
        
        // Criar blocos padrão automaticamente para o novo documento
        await createDefaultBlocksForDocument(newDoc.id)
        
        toast.success(`${template.name} ${t('finance.card.created')}`)
      }
    } catch (err: any) {
      toast.error(t('finance.card.errorCreate'), {
        description: err.message,
      })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      {/* Header compacto padrão */}
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between gap-2 px-4 md:px-6 py-2 border-b border-border"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </motion.div>
      ) : (
      <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-2 border-b border-border">
        {/* Ícone + Nome + Badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedDocId ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => {
                setSelectedDocId(null)
                setShowSidebar(false)
                setCurrentCover(null)
                refetch()
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
          <h1 className="text-sm font-semibold truncate">{pageName || t('finance.card.finances')}</h1>
          {/* Badge do Workspace */}
          {currentWorkspace && (
            <Badge variant="secondary" className="text-xs h-5 hidden sm:inline-flex truncate max-w-[120px]">
              {currentWorkspace.name}
            </Badge>
          )}
        </div>

        {/* Botões de Ação */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Dropdown Estatísticas - aparece quando não há documento selecionado */}
            {!selectedDocId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('finance.card.income')}</span>
                      <span className="text-sm font-mono font-semibold text-green-600">
                        {formatCurrency(totalIncome)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('finance.card.expenses')}</span>
                      <span className="text-sm font-mono font-semibold text-red-600">
                        {formatCurrency(totalExpenses)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">{t('finance.card.balance')}</span>
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        totalBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(totalBalance)}
                      </span>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Botão Gerenciar Categorias */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setShowCategoriesManager(true)}
                >
                  <Tag className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('finance.card.manageCategories')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Toggle Sidebar - Mobile apenas, some quando sidebar aberta, só quando documento aberto */}
            {selectedDocId && !showSidebar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 md:hidden"
                    onClick={() => setShowSidebar(true)}
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('finance.card.elements')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Botão de Capa - aparece quando há documento selecionado */}
            {selectedDocId && (
              <FinanceCoverSelector
                currentCover={currentCover}
                onSelectCover={async (coverUrl) => {
                  if (!selectedDocId) return
                  
                  try {
                    const { error } = await supabase
                      .from('finance_documents')
                      .update({ cover_image: coverUrl })
                      .eq('id', selectedDocId)

                    if (error) throw error

                    setCurrentCover(coverUrl)
                    refetch()
                    toast.success(t('finance.cover.addCover'))
                  } catch (err: any) {
                    toast.error('Erro ao atualizar capa', {
                      description: err.message,
                    })
                  }
                }}
                onRemoveCover={async () => {
                  if (!selectedDocId) return
                  
                  try {
                    const { error } = await supabase
                      .from('finance_documents')
                      .update({ cover_image: null })
                      .eq('id', selectedDocId)

                    if (error) throw error

                    setCurrentCover(null)
                    refetch()
                    toast.success(t('finance.cover.remove'))
                  } catch (err: any) {
                    toast.error('Erro ao remover capa', {
                      description: err.message,
                    })
                  }
                }}
              />
            )}

            {/* Botão Adicionar com Dropdown - Popover de Templates */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowTemplateSelector(true)}>
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                  {t('finance.card.createTemplate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return

                  const { data: newDoc, error } = await supabase
                    .from('finance_documents')
                    .insert({
                      user_id: user.id,
                      workspace_id: currentWorkspace?.id || null,
                      name: t('finance.card.untitled'),
                      template_type: 'expenses',
                      total_income: 0,
                      total_expenses: 0,
                      balance: 0,
                    })
                    .select()
                    .single()

                  if (error) {
                    toast.error(t('finance.card.errorCreate'), { description: error.message })
                    return
                  }

                  if (newDoc) {
                    setSelectedDocId(newDoc.id)
                    refetch()
                    toast.success(t('finance.card.documentCreated'))
                  }
                }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('finance.card.blankDocument')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão Importar Gmail */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowGmailImport(true)}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar do Gmail</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão Configurações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-auto">
        {selectedDocId ? (
          <FinanceViewer
            key={selectedDocId}
            docId={selectedDocId}
            onBack={() => {
              setSelectedDocId(null)
              setShowSidebar(false)
              setCurrentCover(null)
              // Limpar query param da URL
              navigate('/minha-financa', { replace: true })
              refetch()
            }}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            currentCover={currentCover}
            onCoverChange={(coverUrl) => {
              setCurrentCover(coverUrl)
            }}
          />
        ) : loading ? (
          <div className="space-y-2 px-2 py-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
              >
                {/* Ícone */}
                <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                
                {/* Nome do Documento */}
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full max-w-[200px]" />
                  {index % 3 === 0 && (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  )}
                </div>

                {/* Valores - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-20" />
                </div>

                {/* Menu */}
                <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Wallet className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium mb-2">{t('finance.card.noDocumentsYet')}</p>
            <p className="text-xs text-muted-foreground">
              {t('finance.card.useAddButton')}
            </p>
          </div>
        ) : (
          <div className="px-16 py-6">
            <Table className="[&_tr]:border-0">
              {/* Header - APENAS DESKTOP */}
              <TableHeader className="hidden md:table-header-group">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{t('finance.table.name')}</TableHead>
                  <TableHead className="w-[120px]">{t('finance.table.type')}</TableHead>
                  <TableHead className="w-[100px]">{t('finance.table.period')}</TableHead>
                  <TableHead className="text-right w-[110px]">{t('finance.table.income')}</TableHead>
                  <TableHead className="text-right w-[110px]">{t('finance.table.expenses')}</TableHead>
                  <TableHead className="text-right w-[110px]">{t('finance.table.balance')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {documents.map((doc) => {
                  const total = (doc.total_income || 0) - (doc.total_expenses || 0)
                  
                  return (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-none"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (doc.id) {
                          setSelectedDocId(doc.id)
                        }
                      }}
                    >
                      {/* MOBILE: Layout limpo (ícone + nome + menu) */}
                      <TableCell className="md:hidden font-medium border-none" colSpan={3}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl flex-shrink-0">
                            {doc.icon || getDocumentIcon(doc.template_type)}
                          </span>
                          <span className="text-sm truncate flex-1">
                            {doc.name}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicateDocument(doc.id, doc.name)
                              }}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('finance.card.duplicate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                toast.info(t('finance.card.comingSoon'))
                              }}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('finance.export')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDocument(doc.id, doc.name)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('finance.table.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>

                      {/* DESKTOP: Layout completo (todas as colunas) */}
                      <TableCell className="hidden md:table-cell">
                        <span className="text-2xl">{doc.icon || getDocumentIcon(doc.template_type)}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-medium text-sm truncate max-w-[200px] block">
                          {doc.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {doc.template_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.reference_month && doc.reference_year ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {`${String(doc.reference_month).padStart(2, '0')}/${doc.reference_year}`}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <span className="font-mono text-xs font-medium text-green-600">
                          {formatCurrency(Number(doc.total_income || 0))}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
                        <span className="font-mono text-xs font-medium text-red-600">
                          {formatCurrency(Number(doc.total_expenses || 0))}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'hidden md:table-cell text-right font-mono text-xs font-semibold',
                          Number(doc.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {formatCurrency(Number(doc.balance || 0))}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateDocument(doc.id, doc.name)
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              {t('finance.card.duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toast.info(t('finance.card.comingSoon'))
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              {t('finance.export')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDocument(doc.id, doc.name)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('finance.table.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Template Selector */}
      <FinanceTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={handleSelectTemplate}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      {/* Categories Manager */}
      <CategoriesManager
        open={showCategoriesManager}
        onOpenChange={setShowCategoriesManager}
        onUpdate={() => {
          refetch()
        }}
      />

      {/* Modal/Drawer de Importação do Gmail */}
      {showGmailImport && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-background rounded-lg shadow-lg border">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8"
              onClick={() => setShowGmailImport(false)}
            >
              <span className="sr-only">Fechar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
            <GmailInvoiceScanner />
          </div>
        </div>
      )}

      {/* Modal/Drawer de Configurações */}
      <FinanceSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  )
}

