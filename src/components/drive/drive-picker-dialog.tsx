import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DriveService } from '@/services/google/drive.service'
import type { DriveFile } from '@/types/drive'
import { 
  FileText, 
  Image, 
  Video, 
  File, 
  Folder,
  Search,
  Loader2,
  Home,
  ChevronRight,
  ArrowLeft,
  FolderOpen,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface DrivePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (files: DriveFile[]) => void
  multiple?: boolean
  accept?: string[]
}

export function DrivePickerDialog({
  open,
  onClose,
  onSelect,
  multiple = false,
  accept
}: DrivePickerDialogProps) {
  const [selected, setSelected] = useState<DriveFile[]>([])
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<DriveFile[]>([])
  
  // 📁 Estado de navegação em pastas
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Meu Drive' }
  ])

  // Carregar arquivos da pasta atual
  const loadFiles = useCallback(async (folderId: string | null, searchQuery?: string) => {
    setLoading(true)
    try {
      const response = await DriveService.listFiles({
        folderId: folderId || undefined,
        query: searchQuery,
        pageSize: 50
      })
      
      // Ordenar: pastas primeiro, depois arquivos
      const sorted = response.files.sort((a, b) => {
        const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder'
        const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder'
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        return a.name.localeCompare(b.name)
      })
      
      setFiles(sorted)
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
      toast.error('Erro ao carregar arquivos do Drive')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar ao abrir ou mudar de pasta
  useEffect(() => {
    if (open) {
      loadFiles(currentFolderId, search || undefined)
    }
  }, [open, currentFolderId, loadFiles])

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setSelected([])
      setSearch('')
      setCurrentFolderId(null)
      setBreadcrumb([{ id: null, name: 'Meu Drive' }])
    }
  }, [open])

  // Filtrar por tipo se necessário
  const filteredFiles = accept
    ? files.filter(file => {
        // Sempre mostrar pastas para navegação
        if (file.mimeType === 'application/vnd.google-apps.folder') return true
        return accept.some(type => file.mimeType?.startsWith(type))
      })
    : files

  // Navegar para pasta
  const navigateToFolder = useCallback((folder: DriveFile) => {
    setCurrentFolderId(folder.id)
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    setSelected([]) // Limpar seleção ao navegar
    setSearch('') // Limpar busca
  }, [])

  // Navegar para item do breadcrumb
  const navigateToBreadcrumb = useCallback((index: number) => {
    const item = breadcrumb[index]
    setCurrentFolderId(item.id)
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setSelected([])
    setSearch('')
  }, [breadcrumb])

  // Voltar uma pasta
  const goBack = useCallback(() => {
    if (breadcrumb.length > 1) {
      navigateToBreadcrumb(breadcrumb.length - 2)
    }
  }, [breadcrumb, navigateToBreadcrumb])

  // Selecionar arquivo
  const handleSelect = useCallback((file: DriveFile) => {
    // Se for pasta, navegar
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      navigateToFolder(file)
      return
    }

    // Selecionar arquivo
    setSelected(prev => {
      if (multiple) {
        const isSelected = prev.find(f => f.id === file.id)
        return isSelected
          ? prev.filter(f => f.id !== file.id)
          : [...prev, file]
      } else {
        return [file]
      }
    })
  }, [multiple, navigateToFolder])

  // Confirmar seleção
  const handleConfirm = async () => {
    setConfirming(true)
    try {
      onSelect(selected)
      setSelected([])
      onClose()
    } finally {
      setConfirming(false)
    }
  }

  // Buscar
  const handleSearch = useCallback(async (query: string) => {
    setSearch(query)
    // Debounce a busca
    const timer = setTimeout(() => {
      loadFiles(currentFolderId, query || undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [currentFolderId, loadFiles])

  // Ícone por tipo de arquivo
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('folder')) {
      return <Folder className="h-5 w-5 text-yellow-500" />
    }
    if (mimeType?.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />
    }
    if (mimeType?.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />
    }
    if (mimeType?.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-600" />
    }
    if (mimeType?.includes('presentation')) {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
    if (mimeType?.includes('document') || mimeType?.includes('text')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    }
    if (mimeType?.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-muted-foreground" />
  }

  // Formatar tamanho
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    if (kb >= 1) return `${kb.toFixed(0)} KB`
    return `${bytes} B`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:max-w-4xl h-[85vh] md:h-[650px] p-0 flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              Selecionar do Google Drive
            </DialogTitle>
          </DialogHeader>
          
          {/* Busca */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>

          {/* Breadcrumb com navegação */}
          <div className="flex items-center gap-1 mt-3 text-sm overflow-x-auto">
            {breadcrumb.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {breadcrumb.map((item, index) => (
              <div key={item.id || 'root'} className="flex items-center shrink-0">
                {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={cn(
                    "px-2 py-1 rounded hover:bg-muted transition-colors",
                    index === breadcrumb.length - 1 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{item.name}</span>
                    </span>
                  ) : (
                    <span className="max-w-[120px] truncate">{item.name}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de arquivos */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">Carregando arquivos...</p>
              </motion.div>
            ) : filteredFiles.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'Nenhum arquivo encontrado' : 'Pasta vazia'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="files"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                {filteredFiles.map((file, index) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
                  const isSelected = selected.find(f => f.id === file.id)
                  
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ x: 4 }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors group",
                        isFolder 
                          ? "hover:bg-yellow-50 dark:hover:bg-yellow-950/30" 
                          : "hover:bg-muted/50",
                        isSelected && "bg-primary/10 ring-1 ring-primary/30"
                      )}
                      onClick={() => handleSelect(file)}
                      onDoubleClick={() => isFolder && navigateToFolder(file)}
                    >
                      {/* Checkbox para arquivos */}
                      {!isFolder && multiple && (
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground/30 group-hover:border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                      
                      {/* Ícone */}
                      {getFileIcon(file.mimeType)}
                      
                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">
                          {file.name}
                        </p>
                        {file.modifiedTime && (
                          <p className="text-xs text-muted-foreground">
                            Modificado: {new Date(file.modifiedTime).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      
                      {/* Tamanho / Indicador de pasta */}
                      {isFolder ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : file.size ? (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      ) : null}
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 md:p-6 pt-3 border-t shrink-0 bg-muted/30">
          <span className="text-sm text-muted-foreground">
            {selected.length > 0 ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {selected.length} arquivo{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
              </span>
            ) : (
              'Clique para selecionar ou duplo clique para abrir pastas'
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={confirming}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selected.length === 0 || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Selecionando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Selecionar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
