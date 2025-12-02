import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Download,
  Pencil,
  Share2,
  Trash2,
  FileText,
  Table,
  Presentation,
  Image,
  File,
  Users2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    PDF: FileText,
    Word: FileText,
    Excel: Table,
    PowerPoint: Presentation,
    Image: Image,
    Other: File,
  }
  const Icon = icons[category] || icons.Other
  return <Icon className="h-5 w-5" />
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    PDF: 'bg-red-500/10 text-red-500',
    Word: 'bg-blue-500/10 text-blue-500',
    Excel: 'bg-green-500/10 text-green-500',
    PowerPoint: 'bg-orange-500/10 text-orange-500',
    Image: 'bg-purple-500/10 text-purple-500',
    Other: 'bg-muted-foreground/10 text-muted-foreground',
  }
  return colors[category] || colors.Other
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

interface DocumentCardProps {
  document: any
  onDownload: () => void
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
}

export const DocumentCard = ({
  document,
  onDownload,
  onEdit,
  onShare,
  onDelete,
}: DocumentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="group cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <motion.div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              getCategoryColor(document.category)
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {getCategoryIcon(document.category)}
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1 text-sm">
                {document.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {document.category}
              </Badge>
              <span>•</span>
              <span>{formatFileSize(document.file_size)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      {(document.tags?.length > 0 || document.is_shared) && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-2">
            {document.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 2).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-2xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 2 && (
                  <Badge variant="outline" className="text-2xs px-1.5 py-0">
                    +{document.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
            {document.is_shared && (
              <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      )}
    </Card>
    </motion.div>
  )
}
