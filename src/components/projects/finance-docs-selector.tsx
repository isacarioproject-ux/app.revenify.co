import { useState, useEffect } from 'react'
import { ChevronRight, FileText, X, Link2, ExternalLink, Eye, Cloud, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFinanceDocuments } from '@/hooks/use-finance-documents'
import { cn } from '@/lib/utils'
import { DrivePickerDialog } from '@/components/drive/drive-picker-dialog'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { useDocsDriverImport } from '@/hooks/use-docs-drive-import'

interface FinanceDocsSelectorProps {
  projectId: string
  projectDocumentId: string
  currentCount: number
  onUpdate: () => void
  onViewDocument: (docId: string) => void
}

export function FinanceDocsSelector({ projectId, projectDocumentId, currentCount, onUpdate, onViewDocument }: FinanceDocsSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableDocs, setAvailableDocs] = useState<any[]>([])
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const { isConnected: isGoogleConnected } = useGoogleIntegration()
  const { importing, importGoogleDocs } = useDocsDriverImport()
  const { 
    documents: linkedDocs, 
    loading,
    linkToProjectDocument, 
    unlinkFromProjectDocument,
    searchAvailable 
  } = useFinanceDocuments(projectDocumentId)

  // Buscar documentos disponíveis quando abrir
  useEffect(() => {
    if (open) {
      searchAvailableDocs(searchQuery)
    }
  }, [open, searchQuery])

  const searchAvailableDocs = async (query: string) => {
    const results = await searchAvailable(query)
    setAvailableDocs(results)
  }

  const handleLink = async (docId: string) => {
    await linkToProjectDocument(docId, projectDocumentId, projectId)
    onUpdate()
    setSearchQuery('')
  }

  const handleUnlink = async (docId: string) => {
    await unlinkFromProjectDocument(docId)
    onUpdate()
  }

  const handleView = (docId: string) => {
    setOpen(false)
    onViewDocument(docId)
  }

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded text-xs transition-colors">
          <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs">{currentCount} docs</span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[320px]">
        {/* Campo de busca */}
        <div className="p-2">
          <div className="relative">
            <Input
              placeholder="Buscar ou vincular documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pr-8"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Documentos vinculados */}
        {linkedDocs.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Vinculados a este projeto ({linkedDocs.length})
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {linkedDocs.map((doc) => (
                <DropdownMenuItem
                  key={doc.id}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="text-xs truncate">{doc.name}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 flex-shrink-0">
                      {doc.template_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleView(doc.id)
                      }}
                      title="Visualizar documento"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnlink(doc.id)
                      }}
                      title="Desvincular documento"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Importar do Drive */}
        {isGoogleConnected && (
          <>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
              onClick={(e) => {
                e.preventDefault()
                setShowDrivePicker(true)
              }}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Cloud className="h-3 w-3" />
              )}
              <span className="text-xs">{importing ? 'Importando...' : 'Importar do Google Drive'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Documentos disponíveis para vincular */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Documentos disponíveis
        </div>

        {loading ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            Carregando...
          </div>
        ) : availableDocs.length > 0 ? (
          <div className="max-h-[200px] overflow-y-auto">
            {availableDocs.map((doc) => (
              <DropdownMenuItem
                key={doc.id}
                className="flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => handleLink(doc.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs truncate">{doc.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 flex-shrink-0">
                    {doc.template_type}
                  </Badge>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            {searchQuery ? 'Nenhum documento encontrado' : 'Nenhum documento disponível'}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Drive Picker Dialog */}
    <DrivePickerDialog
      open={showDrivePicker}
      onClose={() => setShowDrivePicker(false)}
      onSelect={async (driveFiles) => {
        await importGoogleDocs(driveFiles, projectId)
        onUpdate()
        setShowDrivePicker(false)
      }}
      multiple={true}
      accept={['application/vnd.google-apps.document', 'application/pdf']}
    />
    </>
  )
}
