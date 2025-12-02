import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell, TrendingUp, TrendingDown, AlertTriangle, X, Loader2 } from 'lucide-react'
import { useGmailAutoSync } from '@/hooks/use-gmail-auto-sync'
import { useGoogleIntegration } from '@/hooks/use-google-integration'
import { cn } from '@/lib/utils'

interface FinanceNotificationsBadgeProps {
  onOpenScanner?: () => void
}

export function FinanceNotificationsBadge({ onOpenScanner }: FinanceNotificationsBadgeProps) {
  const { isConnected } = useGoogleIntegration()
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('gmail-auto-sync') === 'true'
  })
  
  const { 
    notifications, 
    newCount, 
    checking, 
    checkNewEmails,
    clearNewCount 
  } = useGmailAutoSync({ 
    enabled: autoSyncEnabled && isConnected,
    intervalMinutes: 5,
    onNewEmails: (emails) => {
      // Notificação sonora opcional
      if ('Notification' in window && Notification.permission === 'granted') {
        const incomeCount = emails.filter(e => e.type === 'income').length
        const expenseCount = emails.length - incomeCount
        
        new Notification('ISACAR Finance', {
          body: `${emails.length} novos emails: ${incomeCount} receitas, ${expenseCount} despesas`,
          icon: '/favicon.ico'
        })
      }
    }
  })

  // Pedir permissão de notificação
  useEffect(() => {
    if (autoSyncEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [autoSyncEnabled])

  // Salvar preferência
  useEffect(() => {
    localStorage.setItem('gmail-auto-sync', autoSyncEnabled.toString())
  }, [autoSyncEnabled])

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Não mostrar se não estiver conectado
  if (!isConnected) return null

  return (
    <Popover onOpenChange={(open) => { if (open) clearNewCount() }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className={cn("h-4 w-4", checking && "animate-pulse")} />
          <AnimatePresence>
            {newCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-5 px-1.5 text-[10px] font-bold flex items-center justify-center"
                >
                  {newCount > 9 ? '9+' : newCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Notificações Financeiras</h4>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={checkNewEmails}
                disabled={checking}
                className="h-7 px-2"
              >
                {checking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Atualizar'
                )}
              </Button>
            </div>
          </div>

          {/* Toggle auto-sync */}
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-xs">Auto-sync Gmail</span>
            <Button
              variant={autoSyncEnabled ? 'primary' : 'outline'}
              size="sm"
              className="h-6 text-xs"
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            >
              {autoSyncEnabled ? 'Ligado' : 'Desligado'}
            </Button>
          </div>

          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma notificação</p>
              <p className="text-xs">Emails financeiros aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {notifications.slice(0, 5).map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg border text-xs",
                      notif.isNew && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded",
                      notif.type === 'income' ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                    )}>
                      {notif.type === 'income' ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{notif.subject}</p>
                      <p className="text-muted-foreground truncate">{notif.from}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={cn(
                          "font-semibold",
                          notif.type === 'income' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {notif.type === 'income' ? '+' : '-'}{formatCurrency(notif.amount)}
                        </span>
                        {notif.isNew && (
                          <Badge variant="secondary" className="h-4 text-[9px]">Novo</Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Ver todos */}
          {notifications.length > 0 && onOpenScanner && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-xs"
              onClick={onOpenScanner}
            >
              Importar do Gmail
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
