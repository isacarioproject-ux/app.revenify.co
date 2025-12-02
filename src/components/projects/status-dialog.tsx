import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ChevronLeft, X, Circle, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface StatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: 'pending' | 'active' | 'completed' | 'archived'
  onStatusChange: (status: 'pending' | 'active' | 'completed' | 'archived') => void
}

const STATUS_OPTIONS = [
  {
    value: 'pending' as const,
    label: 'PENDENTE',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    icon: Clock,
    group: 'Not started'
  },
  {
    value: 'active' as const,
    label: 'EM PROGRESSO',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    icon: Loader2,
    group: 'Active'
  },
  {
    value: 'completed' as const,
    label: 'CONCLUÍDO',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    icon: CheckCircle2,
    group: 'Closed'
  },
]

export function StatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onStatusChange,
}: StatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const isMobile = useIsMobile()

  const handleApply = () => {
    onStatusChange(selectedStatus)
    onOpenChange(false)
  }

  const StatusContent = ({ showHeader = true }: { showHeader?: boolean }) => (
    <>
      {/* Header - Só no Dialog (Desktop) */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold">Status</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className={cn("p-4", !showHeader && "pt-2")}>
        <div className="space-y-4">
          {/* Não iniciado */}
          {STATUS_OPTIONS.some(s => s.group === 'Not started') && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Não iniciado
              </h3>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.filter(s => s.group === 'Not started').map((status) => {
                  const Icon = status.icon
                  const isSelected = selectedStatus === status.value
                  
                  return (
                    <motion.button
                      key={status.value}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedStatus(status.value)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all",
                        isSelected
                          ? "border-border bg-accent"
                          : "border-border/40 hover:border-border hover:bg-accent/50"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", status.bgColor)}>
                        <Icon className={cn("h-3 w-3", status.color)} />
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{status.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ativo */}
          {STATUS_OPTIONS.some(s => s.group === 'Active') && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Ativo
              </h3>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.filter(s => s.group === 'Active').map((status) => {
                  const Icon = status.icon
                  const isSelected = selectedStatus === status.value
                  
                  return (
                    <motion.button
                      key={status.value}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedStatus(status.value)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all",
                        isSelected
                          ? "border-border bg-accent"
                          : "border-border/40 hover:border-border hover:bg-accent/50"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", status.bgColor)}>
                        <Icon className={cn("h-3 w-3", status.color)} />
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{status.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fechado */}
          {STATUS_OPTIONS.some(s => s.group === 'Closed') && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Fechado
              </h3>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.filter(s => s.group === 'Closed').map((status) => {
                  const Icon = status.icon
                  const isSelected = selectedStatus === status.value
                  
                  return (
                    <motion.button
                      key={status.value}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedStatus(status.value)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all",
                        isSelected
                          ? "border-border bg-accent"
                          : "border-border/40 hover:border-border hover:bg-accent/50"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", status.bgColor)}>
                        <Icon className={cn("h-3 w-3", status.color)} />
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{status.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-4 py-3 border-t">
        <Button onClick={handleApply} className="w-full sm:w-auto">
          Aplicar alterações
        </Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerTitle className="sr-only">Status</DrawerTitle>
          <DrawerDescription className="sr-only">
            Selecione o status do projeto
          </DrawerDescription>
          {/* Handle visual para arrastar */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2 mt-2" />
          <StatusContent showHeader={false} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="sm:max-w-[420px] p-0 gap-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Status</DialogTitle>
        <DialogDescription className="sr-only">
          Selecione o status do projeto
        </DialogDescription>
        <StatusContent showHeader={true} />
      </DialogContent>
    </Dialog>
  )
}
