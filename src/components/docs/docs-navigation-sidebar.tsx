import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  ChevronsLeft,
  File,
  Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface Document {
  id: string
  name: string
  parent_id: string | null
  icon: string | null
  file_type: string
}

interface DocumentWithChildren extends Document {
  children?: DocumentWithChildren[]
  level?: number
}

interface DocsNavigationSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDocId?: string
  onNavigate: (docId: string) => void
  onCreatePage?: () => void
  projectId?: string
}

export const DocsNavigationSidebar = ({
  open,
  onOpenChange,
  currentDocId,
  onNavigate,
  onCreatePage,
  projectId,
}: DocsNavigationSidebarProps) => {
  const { t } = useI18n()
  const [documents, setDocuments] = useState<DocumentWithChildren[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) fetchDocuments()
  }, [open, projectId])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select('id, name, parent_id, icon, file_type')
        .eq('file_type', 'page') // Apenas páginas
        .order('created_at', { ascending: true })

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else {
        query = query.is('project_id', null)
      }

      const { data } = await query

      if (data) {
        // Construir hierarquia
        const docsMap = new Map<string, DocumentWithChildren>()
        const rootDocs: DocumentWithChildren[] = []

        data.forEach((doc: Document) => {
          docsMap.set(doc.id, { ...doc, children: [], level: 0 })
        })

        docsMap.forEach((doc) => {
          if (doc.parent_id && docsMap.has(doc.parent_id)) {
            const parent = docsMap.get(doc.parent_id)!
            doc.level = (parent.level || 0) + 1
            parent.children!.push(doc)
          } else {
            rootDocs.push(doc)
          }
        })

        setDocuments(rootDocs)
      }
    } catch (err) {
      console.error('Error fetching docs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = (docs: DocumentWithChildren[]): DocumentWithChildren[] => {
    if (!searchQuery) return docs

    const query = searchQuery.toLowerCase()
    return docs.filter((doc) => {
      const matches = doc.name.toLowerCase().includes(query)
      const childrenMatch = doc.children && filterDocuments(doc.children).length > 0
      return matches || childrenMatch
    })
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-2 sm:p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold">{currentDocId ? t('pages.navigation') : t('pages.title')}</h3>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={() => onOpenChange(false)}
            title={t('pages.closeNavigation')}
          >
            <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="p-2 sm:p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder={t('pages.searchPages')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 sm:h-9 pl-7 sm:pl-8 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Botão Adicionar Página */}
      {onCreatePage && (
        <div className="p-2 sm:p-3 border-b border-border">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm"
            onClick={onCreatePage}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {t('pages.addPage')}
          </Button>
        </div>
      )}

      {/* Lista de documentos */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              {t('pages.loading')}
            </div>
          ) : filterDocuments(documents).length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t('pages.noPagesFound')}</p>
            </div>
          ) : (
            <DocumentTree
              docs={filterDocuments(documents)}
              currentDocId={currentDocId}
              onNavigate={(id: string) => {
                onNavigate(id)
                onOpenChange(false)
              }}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Componente recursivo para árvore
const DocumentTree = ({ docs, currentDocId, onNavigate, level = 0 }: any) => {
  return (
    <>
      {docs.map((doc: DocumentWithChildren) => (
        <DocumentTreeItem
          key={doc.id}
          doc={doc}
          currentDocId={currentDocId}
          onNavigate={onNavigate}
          level={level}
        />
      ))}
    </>
  )
}

const DocumentTreeItem = ({ doc, currentDocId, onNavigate, level }: any) => {
  const [collapsed, setCollapsed] = useState(false)
  const hasChildren = doc.children && doc.children.length > 0
  const isActive = doc.id === currentDocId

  return (
    <div>
      <button
        onClick={() => onNavigate(doc.id)}
        className={cn(
          'w-full flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1 sm:py-1.5 rounded-sm text-xs sm:text-sm hover:bg-accent transition-colors',
          isActive && 'bg-accent font-medium'
        )}
        style={{ paddingLeft: `${level * 8 + 4}px` }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(!collapsed)
            }}
            className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center hover:bg-muted rounded"
          >
            {collapsed ? (
              <ChevronRight className="h-2 w-2 sm:h-3 sm:w-3" />
            ) : (
              <ChevronDown className="h-2 w-2 sm:h-3 sm:w-3" />
            )}
          </button>
        ) : (
          <div className="h-3 w-3 sm:h-4 sm:w-4" />
        )}

        {/* Ícone */}
        <span className="text-xs sm:text-sm flex-shrink-0">
          {doc.icon || <File className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />}
        </span>

        {/* Nome */}
        <span className="truncate flex-1 text-left">{doc.name}</span>
      </button>

      {/* Filhos */}
      {hasChildren && !collapsed && (
        <DocumentTree
          docs={doc.children}
          currentDocId={currentDocId}
          onNavigate={onNavigate}
          level={level + 1}
        />
      )}
    </div>
  )
}
