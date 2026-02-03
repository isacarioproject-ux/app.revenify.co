import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { User, UserCheck, DollarSign, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface LiveEvent {
  id: string
  event_type: string
  created_at: string
  utm_source?: string
  country_code?: string
  page_url?: string
}

interface LiveEventsFeedProps {
  projectId: string
  initialEvents?: LiveEvent[]
}

export function LiveEventsFeed({ projectId, initialEvents = [] }: LiveEventsFeedProps) {
  const { t } = useI18n()
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <Eye className="h-4 w-4" />
      case 'signup':
        return <UserCheck className="h-4 w-4" />
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'page_view':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'signup':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'payment':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'page_view':
        return t('events.pageView')
      case 'signup':
        return t('events.signup')
      case 'payment':
        return t('events.payment')
      case 'session_start':
        return t('events.sessionStart')
      default:
        return type
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    
    if (diffSec < 60) return t('events.now')
    if (diffMin < 60) return `${diffMin}m ${t('events.ago')}`
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {t('events.realTimeEvents')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('events.noEvents')}
              </p>
            ) : (
              events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={cn('p-2 rounded-full', getEventColor(event.event_type))}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getEventLabel(event.event_type)}
                      </Badge>
                      {event.utm_source && (
                        <span className="text-xs text-muted-foreground">
                          via {event.utm_source}
                        </span>
                      )}
                    </div>
                    {event.page_url && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {(() => {
                          try {
                            return new URL(event.page_url).pathname
                          } catch {
                            return event.page_url
                          }
                        })()}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(event.created_at)}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
