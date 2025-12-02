import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { X } from 'lucide-react'
import { GmailImportList } from './gmail-import-list'

interface GmailImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GmailImportModal({ open, onOpenChange }: GmailImportModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Importar do Gmail</DialogTitle>
            <DialogDescription>
              Encontre boletos e faturas nos seus emails e importe para o Finance
            </DialogDescription>
          </DialogHeader>
          
          {/* Botão X padrão do Dialog */}
          <button
            onClick={() => onOpenChange(false)}
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
          
          <div className="mt-4">
            <GmailImportList />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl">Importar do Gmail</DrawerTitle>
          <DrawerDescription>
            Encontre boletos e faturas nos seus emails e importe para o Finance
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 pb-4">
          <GmailImportList />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
