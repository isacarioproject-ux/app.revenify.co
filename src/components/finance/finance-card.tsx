import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'
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
  Maximize2, 
  Minimize2,
  Plus, 
  MoreVertical,
  Copy,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  GripVertical,
  Tag,
  Layers,
  X,
  Calendar,
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { useWorkspace } from '@/contexts/workspace-context'
import { useFinanceCard } from '@/hooks/use-finance-card'
import { toast } from 'sonner'
import { FinanceViewer } from './finance-viewer'
import { CategoriesManager } from './categories-manager'
import { supabase } from '@/lib/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FinanceCardProps {
  workspaceId?: string
  dragHandleProps?: any
}

// Helper function para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Ícones removidos da tabela para visual mais limpo
// O período de referência agora mostra mês/ano do banco

export function FinanceCard({ workspaceId, dragHandleProps }: FinanceCardProps) {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const cardName = t('finance.card.title')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const { documents, loading, refetch } = useFinanceCard(workspaceId)


  // Buscar contagem de membros do workspace
  useEffect(() => {
    const fetchMemberCount = async () => {
      if (!currentWorkspace?.id) {
        setMemberCount(0)
        return
      }

      try {
        const { count } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'active')

        setMemberCount(count || 0)
      } catch (error) {
        console.error('Error fetching member count:', error)
        setMemberCount(0)
      }
    }

    fetchMemberCount()
  }, [currentWorkspace?.id])

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

  return (
    <>
    <Card className="border border-border bg-card rounded-lg overflow-hidden h-full flex flex-col group">
      {/* MENUBAR SUPERIOR */}
      <CardHeader className="p-0">
        <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
          {/* Drag Handle + Input na MESMA LINHA */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Drag Handle - sempre visível no mobile, hover no desktop */}
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
            
            {/* Nome Fixo */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {cardName}
              </h3>
            {/* Badge do Workspace */}
            {currentWorkspace && (
              <Badge variant="secondary" className="text-xs h-5 hidden sm:inline-flex truncate max-w-[120px]">
                {currentWorkspace.name}
              </Badge>
            )}
            
            {/* Badge Ao vivo - Apenas workspaces com 2+ membros */}
            {currentWorkspace && memberCount > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden sm:flex"
              >
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 border-green-500/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-green-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.8, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {t('realtime.live')} ({memberCount})
                </Badge>
              </motion.div>
            )}
            </div>
          </div>

          {/* Botões de Ação - Sempre visíveis */}
          <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Botão Expandir */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setIsExpanded(true)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('finance.card.expand')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão Adicionar - Cria documento direto */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={async () => {
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
                        setIsExpanded(true)
                        refetch()
                        toast.success(t('finance.card.documentCreated'))
                      }
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('finance.card.newDocument')}</p>
              </TooltipContent>
            </Tooltip>

          </div>
          </TooltipProvider>
        </div>
      </CardHeader>

      {/* CONTEÚDO DO CARD */}
      <CardContent className="flex-1 overflow-auto p-0 flex flex-col">
          {loading ? (
            <div className="space-y-2 px-2 py-1.5">
              {Array.from({ length: 3 }).map((_, index) => (
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
                  <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                  
                  {/* Nome do Documento */}
                  <Skeleton className="h-3.5 flex-1 max-w-[120px]" />
                  
                  {/* Valor */}
                  <Skeleton className="h-3.5 w-20 ml-auto" />
                  
                  {/* Data */}
                  <Skeleton className="h-3 w-16" />
                  
                  {/* Menu */}
                  <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="min-h-[200px] flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t('finance.card.noDocuments')}</p>
                <p className="text-xs mt-1">{t('finance.card.clickAdd')}</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto">
            <div className="space-y-1">
                {documents.map((doc) => {
                  const total = (doc.total_income || 0) - (doc.total_expenses || 0)
                  return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors group"
                    onClick={() => {
                      setSelectedDocId(doc.id)
                      setIsExpanded(true)
                    }}
                  >
                    {/* Nome */}
                    <span className="text-sm font-medium truncate flex-1">
                      {doc.name}
                    </span>

                    {/* Valor Total */}
                    <span className={cn(
                      "text-sm font-medium tabular-nums",
                      total > 0 ? "text-green-600 dark:text-green-400" : total < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"
                    )}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(total)}
                    </span>

                    {/* Período */}
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {doc.reference_month && doc.reference_year 
                        ? `${String(doc.reference_month).padStart(2, '0')}/${doc.reference_year}`
                        : '-'}
                    </span>

                    {/* Ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  )
                })}
            </div>
            </div>
          )}
      </CardContent>
    </Card>

    {/* Dialog Fullscreen */}
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
            "border border-border bg-background shadow-lg duration-200",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "sm:rounded-lg flex flex-col !max-w-none",
            isFullscreen 
              ? "!w-[100vw] !h-[100vh] rounded-none" 
              : "w-[95vw] md:!w-[85vw] lg:!w-[75vw] xl:!w-[60vw] h-[90vh] md:!h-[85vh] lg:!h-[80vh]"
          )}
        >
          {/* Header igual ao menubar do card - v2 */}
          <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
            <DialogTitle className="sr-only">{cardName}</DialogTitle>
            
            {/* Botão Voltar + Input Nome - sem gap */}
            <div className="flex items-center flex-shrink-0">
              {selectedDocId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setSelectedDocId(null)}
                  title={t('finance.card.back')}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Nome do Card - fixo */}
              <h3 className="text-sm font-semibold px-2">
                {cardName}
              </h3>
            </div>

            {/* Botões de Ação */}
            <TooltipProvider>
            <div className="flex items-center gap-0.5 sm:gap-1">
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

              {/* Botão Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? t('finance.card.exitFullscreen') : t('finance.card.fullscreen')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Botão Adicionar - Cria documento direto */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={async () => {
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
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('finance.card.newDocument')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Fechar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsExpanded(false)
                      setSelectedDocId(null)
                    }}
                    className="h-7 w-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('finance.card.close')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>
          </div>

          {/* Conteúdo do Dialog */}
          <div className="flex-1 overflow-auto">
            {selectedDocId ? (
              <FinanceViewer
                key={selectedDocId}
                docId={selectedDocId}
                onBack={() => {
                  setSelectedDocId(null)
                  refetch()
                }}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
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
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium mb-2">{t('finance.card.noDocumentsYet')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('finance.card.useAddButton')}
                </p>
              </div>
            ) : (
              <div className="p-6">
                <Table>
                  {/* Header - APENAS DESKTOP */}
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow className="hover:bg-transparent ">
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
                    {documents.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-none"
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        {/* MOBILE: Layout limpo */}
                        <TableCell className="md:hidden font-medium border-none" colSpan={3}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl flex-shrink-0">
                              {doc.icon || '📄'}
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

                        {/* DESKTOP: Layout completo */}
                        <TableCell className="hidden md:table-cell">
                          <span className="text-2xl">{doc.icon || '📄'}</span>
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
                        <TableCell className="hidden md:table-cell ">
                          {doc.reference_month && doc.reference_year ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {`${String(doc.reference_month).padStart(2, '0')}/${doc.reference_year}`}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right ">
                          <span className="font-mono text-xs font-medium text-green-600">
                            {formatCurrency(Number(doc.total_income || 0))}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right ">
                          <span className="font-mono text-xs font-medium text-red-600">
                            {formatCurrency(Number(doc.total_expenses || 0))}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden md:table-cell text-right font-mono text-xs font-semibold ',
                            Number(doc.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {formatCurrency(Number(doc.balance || 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell ">
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>

    {/* Categories Manager */}
    <CategoriesManager
      open={showCategoriesManager}
      onOpenChange={setShowCategoriesManager}
      onUpdate={() => {
        // Atualizar quando categorias mudarem
        refetch()
      }}
    />

  </>
  )
}
