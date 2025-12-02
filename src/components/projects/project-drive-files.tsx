import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useProjectDriveFiles } from '@/hooks/use-project-drive-files'
import { DrivePickerDialog } from '@/components/drive/drive-picker-dialog'
import {
  Plus,
  FileText,
  Image,
  Video,
  File,
  ExternalLink,
  X,
  Loader2,
  FolderOpen,
  Search,
  Calendar,
  HardDrive,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectDriveFilesProps {
  projectId: string
  showPicker?: boolean
  onPickerClose?: () => void
}

export function ProjectDriveFiles({ projectId, showPicker = false, onPickerClose }: ProjectDriveFilesProps) {
  const [internalShowPicker, setInternalShowPicker] = useState(false)
  const { files, loading, adding, linkFiles, unlinkFile, openInDrive } = useProjectDriveFiles({ projectId })
  
  const pickerOpen = showPicker || internalShowPicker
  const handlePickerClose = () => {
    setInternalShowPicker(false)
    onPickerClose?.()
  }

  // Ícone por tipo de arquivo
  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-500" />
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-500" />
    }
    if (mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className="h-4 w-4 text-blue-500" />
    }
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  // Formatar tamanho
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    if (kb >= 1) return `${kb.toFixed(0)} KB`
    return `${bytes} B`
  }

  // Obter tipo de arquivo legível
  const getFileType = (mimeType: string | null) => {
    if (!mimeType) return 'Arquivo'
    
    if (mimeType.startsWith('image/')) return 'Imagem'
    if (mimeType.startsWith('video/')) return 'Vídeo'
    if (mimeType.includes('document')) return 'Documento'
    if (mimeType.includes('sheet')) return 'Planilha'
    if (mimeType.includes('presentation')) return 'Apresentação'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('text')) return 'Texto'
    
    return 'Arquivo'
  }

  return (
    <div className="flex-1 overflow-auto px-4 md:px-16 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum arquivo vinculado</h3>
            <p className="text-sm text-muted-foreground">
              Clique no botão Anexar acima para adicionar arquivos do Drive
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground w-[40%]">
                    <div className="flex items-center gap-2">
                      <File className="h-3.5 w-3.5" />
                      Arquivo
                    </div>
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground w-[15%]">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5" />
                      Tamanho
                    </div>
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground w-[20%]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Vinculado em
                    </div>
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground w-[15%]">
                    Tipo
                  </th>
                  <th className="w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {files.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-muted/30 group transition-colors"
                    >
                      {/* Arquivo */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.drive_file_type)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {file.drive_file_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tamanho */}
                      <td className="py-3 px-2">
                        <span className="text-sm text-muted-foreground">
                          {file.drive_file_size ? formatFileSize(file.drive_file_size) : '-'}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="py-3 px-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className="text-xs">
                          {getFileType(file.drive_file_type)}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openInDrive(file.drive_file_id)}
                            className="h-8 w-8"
                            title="Abrir no Drive"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => unlinkFile(file.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remover"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

      {/* Picker Dialog */}
      <DrivePickerDialog
        open={pickerOpen}
        onClose={handlePickerClose}
        onSelect={linkFiles}
        multiple={true}
      />
    </div>
  )
}
