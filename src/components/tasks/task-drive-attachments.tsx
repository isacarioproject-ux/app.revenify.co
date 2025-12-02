import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTaskDriveAttachments } from '@/hooks/use-task-drive-attachments'
import { DrivePickerDialog } from '@/components/drive/drive-picker-dialog'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import {
  Paperclip,
  FileText,
  Image,
  Video,
  File,
  ExternalLink,
  X,
  Loader2
} from 'lucide-react'

interface TaskDriveAttachmentsProps {
  taskId: string
}

export function TaskDriveAttachments({ taskId }: TaskDriveAttachmentsProps) {
  const { t } = useI18n()
  const [showPicker, setShowPicker] = useState(false)
  const { attachments, loading, attaching, attachFiles, removeAttachment, openInDrive } = useTaskDriveAttachments({ taskId })

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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header com botão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <h4 className="text-xs sm:text-sm font-semibold">{t('tasks.attachments.driveAttachments')}</h4>
          {attachments.length > 0 && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] sm:text-xs text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted"
            >
              {attachments.length}
            </motion.span>
          )}
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
            disabled={attaching}
            className="h-7 sm:h-8 text-[10px] sm:text-xs w-full sm:w-auto"
          >
            {attaching ? (
              <>
                <Loader2 className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                {t('tasks.attachments.attaching')}
              </>
            ) : (
              <>
                <Paperclip className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {t('tasks.attachments.attachFile')}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Lista de anexos */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-6 sm:py-8"
          >
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
          </motion.div>
        ) : attachments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 sm:py-8 rounded-lg border border-dashed border-border/50"
          >
            <Paperclip className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('tasks.attachments.noAttachments')}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-0.5 rounded-lg border border-border/50"
          >
            {attachments.map((attachment, index) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 transition-colors group",
                  index !== attachments.length - 1 && "border-b border-border/30"
                )}
              >
                {/* Ícone */}
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.drive_file_type)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                    {attachment.drive_file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {attachment.drive_file_size && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatFileSize(attachment.drive_file_size)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações - sempre visíveis em mobile, hover em desktop */}
                <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openInDrive(attachment.drive_file_id)}
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      title={t('tasks.attachments.openInDrive')}
                    >
                      <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(attachment.id)}
                      className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title={t('tasks.attachments.remove')}
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Picker Dialog */}
      <DrivePickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={attachFiles}
        multiple={true}
      />
    </div>
  )
}
