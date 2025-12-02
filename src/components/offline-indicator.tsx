import { useOfflineSync } from '@/hooks/use-offline-sync'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

export const OfflineIndicator = () => {
  const { t } = useI18n()
  const { isOnline, isSyncing, pendingActions, syncNow } = useOfflineSync()

  if (isOnline && pendingActions === 0) {
    return null // Não mostrar nada quando está online e sem ações pendentes
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-20">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm transition-all",
        isOnline 
          ? "bg-background/80 border-border" 
          : "bg-destructive/10 border-destructive/20"
      )}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {isOnline ? t('finance.offline.online') : t('finance.offline.title')}
          </span>
          
          {pendingActions > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {pendingActions} {pendingActions > 1 ? t('finance.offline.pendingPlural') : t('finance.offline.pending')}
              </Badge>
              
              {isOnline && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="h-5 px-2 text-[10px]"
                >
                  <RefreshCw className={cn(
                    "h-3 w-3 mr-1",
                    isSyncing && "animate-spin"
                  )} />
                  {t('finance.offline.sync')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
