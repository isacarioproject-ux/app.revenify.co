import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { DrivePickerDialog } from '@/components/drive/drive-picker-dialog'
import { useDocsDriverImport } from '@/hooks/use-docs-drive-import'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Maximize2, 
  Minimize2,
  Plus, 
  MoreVertical, 
  Copy, 
  Trash,
  X,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  ExternalLink,
  Link2,
  Download,
  Edit,
  Loader2,
  Upload,
  PanelRight,
  PanelRightClose,
  Sparkles,
  GripVertical,
  Cloud,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'
import { useDocsCard } from '@/hooks/use-docs-card'
import { useI18n } from '@/hooks/use-i18n'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'
import { UploadDocumentModal } from './upload-document-modal'
import { PageEditorSidebar } from './page-editor-sidebar'
import { PageViewer } from './page-viewer'
import { DocumentRow } from './document-row'
import { ExportMenu } from './export-menu'
import { TemplateSelectorDialog } from './template-selector-dialog'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface DocsCardProps {
  defaultName?: string
  projectId?: string
  onExpand?: () => void
  onAddDoc?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

// Helper functions
const getFileIcon = (fileType: string) => {
  if (fileType === 'page') return <FileText className="h-4 w-4 text-primary" />
  if (fileType?.includes('image')) return <FileImage className="h-4 w-4" />
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) 
    return <FileSpreadsheet className="h-4 w-4" />
  if (fileType?.includes('pdf')) return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const DocsCard = ({ defaultName = 'Docs', projectId, onExpand, onAddDoc, onDuplicate, onDelete }: DocsCardProps) => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const dateFnsLocale = useDateFnsLocale()
  const [cardName, setCardName] = useState(() => {
    const saved = localStorage.getItem('docs-card-name')
    return saved || defaultName
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showPageEditor, setShowPageEditor] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedDocData, setSelectedDocData] = useState<{ title: string; elements: any[] }>({
    title: '',
    elements: [],
  })
  const { documents, loading, refetch } = useDocsCard(projectId)
  const { importing, importGoogleDocs } = useDocsDriverImport()
  const [showDrivePicker, setShowDrivePicker] = useState(false)

  // Listener realtime para atualizar tabela quando documentos mudarem
  useEffect(() => {
    const channel = supabase
      .channel('docs-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
      }, () => {
        refetch()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'documents',
      }, () => {
        refetch()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'documents',
      }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [refetch])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setCardName(newName)
    // Salvar no localStorage por enquanto
    localStorage.setItem('docs-card-name', newName)
  }

  const handleDelete = () => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este card?')
    if (confirmed) {
      onDelete?.()
    }
  }

  const handleCreateSubpage = async (parentId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newDoc, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        parent_id: parentId, // ✅ Vincular ao pai
        name: 'Sem título',
        file_type: 'page',
        file_size: 0,
        category: 'Other',
        file_url: '',
        description: '[]',
      })
      .select()
      .single()

    if (!error && newDoc) {
      setSelectedDocId(newDoc.id)
      setShowPageEditor(true)
      refetch()
      toast.success('Subpágina criada')
    }
  }

  return (
    <>
    <Card className="border border-border bg-card rounded-lg overflow-hidden w-[400px] h-[400px] flex flex-col">
      {/* HEADER - 6 Elementos */}
      <CardHeader className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {/* 1. [::] Drag Handle - 6 pontinhos */}
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* 2. Input Nome - Editável */}
          <Input
            value={cardName}
            onChange={handleNameChange}
            placeholder={t('pages.title')}
            className="text-sm font-semibold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-ring h-7 px-2 flex-1 min-w-0"
          />

          {/* 3. Badge Workspace (condicional) */}
          {currentWorkspace && (
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium shrink-0">
              {currentWorkspace.name}
            </Badge>
          )}
          
          {/* Botões de Ação */}
          <TooltipProvider>
          <div className="flex items-center gap-0.5">
            {/* 4. [⤢] Expandir - Abre modal fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setIsExpanded(true)}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('pages.expand')}</p>
              </TooltipContent>
            </Tooltip>

            {/* 5. [+] Adicionar - Dropdown com 3 opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Criar de Template */}
                <DropdownMenuItem
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                  {t('pages.fromTemplate')}
                </DropdownMenuItem>

                {/* Criar Página em Branco */}
                <DropdownMenuItem
                  onClick={async () => {
                    console.log('🔵 Clicou em Criar Página')
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) {
                      console.log('❌ Usuário não autenticado')
                      return
                    }

                    console.log('👤 Usuário:', user.id)

                    const { data: newDoc, error } = await supabase
                      .from('documents')
                      .insert({
                        user_id: user.id,
                        project_id: projectId || null,
                        name: 'Sem título',
                        file_type: 'page',
                        file_size: 0,
                        category: 'Other',
                        file_url: '',
                      })
                      .select()
                      .single()

                    if (error) {
                      console.error('❌ Erro ao criar página:', error)
                      toast.error('Erro ao criar página', { description: error.message })
                      return
                    }

                    if (newDoc) {
                      console.log('✅ Página criada:', newDoc)
                      setSelectedDocId(newDoc.id)
                      setShowPageEditor(true)
                      refetch()
                      toast.success('Página criada!')
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('pages.blankPage')}
                </DropdownMenuItem>

                {/* Upload Arquivo */}
                <DropdownMenuItem
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('pages.uploadFile')}
                </DropdownMenuItem>

                {/* Importar do Google Drive */}
                <DropdownMenuItem
                  onClick={() => setShowDrivePicker(true)}
                  disabled={importing}
                >
                  <Cloud className="mr-2 h-4 w-4 text-blue-500" />
                  {importing ? 'Importando...' : 'Importar do Drive'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 6. [⋮] Menu 3 Pontos - Duplicar/Excluir card */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('pages.moreOptions')}</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('pages.duplicate')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {t('pages.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </TooltipProvider>
        </div>
      </CardHeader>

      {/* CONTEÚDO DO CARD - Ocupa espaço restante */}
      <CardContent className="p-0 flex-1 flex overflow-hidden">
        {/* Tabela de Documentos */}
        <div className={cn("flex-1 overflow-auto", showPageEditor && "border-r border-border")}>
          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center p-4 h-full">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t('pages.noPages')}</p>
                <p className="text-xs mt-1">{t('pages.createFirst')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
            <Table>
              <TableBody>
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onSelect={(id: string) => {
                      setSelectedDocId(id)
                      setShowPageEditor(true)
                    }}
                    onUpdate={refetch}
                    projectId={projectId || ''}
                  />
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Sidebar Editor (condicional) */}
        {showPageEditor && selectedDocId && (
          <PageEditorSidebar
            docId={selectedDocId}
          />
        )}
      </CardContent>
    </Card>

    {/* Modal de Upload */}
    <UploadDocumentModal
      open={showUploadModal}
      onOpenChange={setShowUploadModal}
      projectId={projectId || ''}
      onUploadComplete={refetch}
    />

    {/* Dialog de Seleção de Template */}
    <TemplateSelectorDialog
      open={showTemplateSelector}
      onOpenChange={setShowTemplateSelector}
      projectId={projectId || ''}
      onTemplateSelect={async (template: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Regenerar IDs dos elementos
        const elements = template.elements.map((el: any) => ({
          ...el,
          id: nanoid(),
        }))

        const { data: newDoc, error } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            project_id: projectId || null,
            name: template.name,
            file_type: 'page',
            file_size: 0,
            category: 'Other',
            file_url: '',
            description: JSON.stringify(elements),
            icon: template.icon,
            template_id: template.id, // ✅ Salvar ID do template
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao criar template:', error)
          toast.error('Erro ao criar documento', { description: error.message })
          return
        }

        if (newDoc) {
          console.log('✅ Template criado:', newDoc.id)
          refetch() // Atualizar lista
          setSelectedDocId(newDoc.id) // Abrir documento
          setShowPageEditor(false)
          toast.success(`✓ ${template.name} ${t('pages.created')}`)
        }
      }}
    />

    {/* Dialog Fullscreen */}
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
            "border border-border bg-background shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "sm:rounded-lg flex flex-col",
            isFullscreen ? "max-w-[100vw] h-[100vh] rounded-none" : "max-w-[95vw] h-[95vh]"
          )}
        >
          {/* Header igual ao menubar do card */}
          <div className="flex items-center justify-between gap-2 px-[5px] py-0.5 border-b border-border">
            <DialogTitle className="sr-only">{cardName}</DialogTitle>
            
            {/* Input Editável de Nome */}
            <Input
              value={cardName}
              onChange={handleNameChange}
              placeholder={t('pages.title')}
              className="text-sm font-semibold bg-transparent border-none focus:border-border focus:ring-1 focus:ring-ring h-7 px-2 w-40"
            />

            {/* Botões de Ação */}
            <TooltipProvider>
            <div className="flex items-center gap-1">
              {/* Botão Abrir Sidebar - aparece quando página selecionada E sidebar fechado */}
              {selectedDocId && !showPageEditor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setShowPageEditor(true)}
                    >
                      <PanelRight className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('pages.elements.openSidebar')}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Menu de Exportação - aparece quando página selecionada */}
              {selectedDocId && (
                <ExportMenu
                  docId={selectedDocId}
                />
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
                  <p>{isFullscreen ? t('whiteboard.exitFullscreen') : t('whiteboard.fullscreen')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Botão Adicionar com Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Criar de Template */}
                  <DropdownMenuItem
                    onClick={() => setShowTemplateSelector(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                    {t('pages.fromTemplate')}
                  </DropdownMenuItem>

                  {/* Página em Branco */}
                  <DropdownMenuItem
                    onClick={async () => {
                      console.log('🔵 Dialog: Clicou em Criar Página')
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) {
                        console.log('❌ Dialog: Usuário não autenticado')
                        return
                      }

                      console.log('👤 Dialog: Usuário:', user.id)

                      const { data: newDoc, error } = await supabase
                        .from('documents')
                        .insert({
                          user_id: user.id,
                          project_id: projectId || null,
                          name: t('pages.untitled'),
                          file_type: 'page',
                          file_size: 0,
                          category: 'Other',
                          file_url: '',
                          description: '[]',
                        })
                        .select()
                        .single()

                      if (error) {
                        console.error('❌ Dialog: Erro ao criar página:', error)
                        toast.error('Erro ao criar página', { description: error.message })
                        return
                      }

                      if (newDoc) {
                        console.log('✅ Dialog: Página criada:', newDoc)
                        setSelectedDocId(newDoc.id)
                        setShowPageEditor(false)
                        refetch()
                        toast.success('Página criada!')
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t('pages.blankPage')}
                  </DropdownMenuItem>

                  {/* Upload Arquivo */}
                  <DropdownMenuItem
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t('pages.uploadFile')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('pages.moreOptions')}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('pages.duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {t('pages.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão Fechar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsExpanded(false)
                      setSelectedDocId(null)
                      setShowPageEditor(false)
                    }}
                    className="h-7 w-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('common.close')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>
          </div>

          {/* Conteúdo do Dialog - Layout Flex com Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Área principal: Lista de docs OU Visualizador de página */}
            <div className={cn("flex-1 overflow-auto transition-all duration-200", showPageEditor && "border-r border-border")}>
              {selectedDocId ? (
                // Visualizador de página
                <PageViewer
                  key={selectedDocId}
                  docId={selectedDocId}
                  onBack={() => {
                    setSelectedDocId(null)
                    setShowPageEditor(false)
                    refetch()
                  }}
                />
              ) : loading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : documents.length === 0 ? (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium">Nenhum documento</p>
                    <p className="text-sm mt-2">Clique em "Adicionar Documento" para começar</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <Table>
                    <TableBody>
                      {documents.map((doc) => (
                        <DocumentRow
                          key={doc.id}
                          document={doc}
                          onSelect={(id: string) => {
                            setSelectedDocId(id)
                            setShowPageEditor(true)
                          }}
                          onUpdate={refetch}
                          projectId={projectId || ''}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Sidebar Editor (condicional) */}
            {showPageEditor && selectedDocId && (
              <PageEditorSidebar
                docId={selectedDocId}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>

    {/* Drive Picker Dialog */}
    <DrivePickerDialog
      open={showDrivePicker}
      onClose={() => setShowDrivePicker(false)}
      onSelect={async (driveFiles) => {
        if (projectId) {
          await importGoogleDocs(driveFiles, projectId)
          refetch()
        }
        setShowDrivePicker(false)
      }}
      multiple={true}
      accept={['application/vnd.google-apps.document']}
    />
  </>
  )
}
