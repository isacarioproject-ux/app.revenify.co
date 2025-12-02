import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  GripVertical,
  Maximize2,
  Minimize2,
  X,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { AnalyticsContent } from './analytics-content'

interface AnalyticsCardProps {
  workspaceId?: string
  dragHandleProps?: any
}

interface SyncLog {
  id: string
  service: string
  status: 'success' | 'error' | 'partial'
  created_at: string
}

interface Stats {
  service: string
  total_operations: number
  success_count: number
  error_count: number
}

export function AnalyticsCard({ workspaceId, dragHandleProps }: AnalyticsCardProps) {
  const { currentWorkspace } = useWorkspace()
  const finalWorkspaceId = workspaceId || currentWorkspace?.id

  const cardName = 'Analytics'
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [stats, setStats] = useState<Stats[]>([])
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Refresh stats
      try {
        await supabase.rpc('refresh_google_sync_stats')
      } catch {
        console.log('Stats view vazia')
      }

      // Buscar estatísticas
      const { data: statsData } = await supabase
        .from('google_sync_stats')
        .select('*')

      setStats(statsData || [])

      // Buscar logs recentes
      const { data: logsData } = await supabase
        .from('google_sync_logs')
        .select('id, service, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentLogs(logsData || [])
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])


  const totalOps = stats.reduce((acc, s) => acc + s.total_operations, 0)
  const totalSuccess = stats.reduce((acc, s) => acc + s.success_count, 0)
  const successRate = totalOps > 0 ? ((totalSuccess / totalOps) * 100).toFixed(1) : '0'

  // Dados para gráfico de pizza
  const chartData = stats.map(s => ({
    name: s.service,
    value: s.total_operations,
  }))

  const COLORS = {
    gmail: '#EA4335',
    calendar: '#4285F4',
    sheets: '#34A853',
    drive: '#FBBC04',
  }

  const serviceIcons = {
    gmail: '📧',
    calendar: '📅',
    sheets: '📊',
    drive: '📁',
  }

  const serviceLabels = {
    gmail: 'Gmail',
    calendar: 'Calendar',
    sheets: 'Sheets',
    drive: 'Drive',
  }

  return (
    <>
        <Card className="h-full flex flex-col group">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between gap-2 px-0.5 py-0.5">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* Drag Handle - sempre visível no mobile, hover no desktop */}
              <div 
                {...dragHandleProps} 
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/70 rounded transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 relative z-10 touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </div>

              {/* Nome Fixo */}
              <h3 className="font-semibold text-sm truncate">
                {cardName}
              </h3>
            </div>

            {/* Botões de Ação - Sempre visíveis */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Expandir */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-accent/60"
                  onClick={() => setIsExpanded(true)}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ) : totalOps === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center py-16 px-6"
            >
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium mb-2">Nenhuma sincronização ainda</p>
              <p className="text-xs text-muted-foreground">
                Use Calendar Sync ou Sheets Export para ver analytics
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Gráfico de Pizza */}
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#999'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Estatísticas Resumidas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de operações</span>
                  <Badge variant="secondary">{totalOps}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de sucesso</span>
                  <Badge variant="default" className="bg-green-500">{successRate}%</Badge>
                </div>
              </div>

              {/* Logs Recentes */}
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Atividade Recente</h4>
                {recentLogs.slice(0, 3).map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/30"
                  >
                    <span className="text-base">{serviceIcons[log.service as keyof typeof serviceIcons]}</span>
                    <span className="flex-1 truncate">{serviceLabels[log.service as keyof typeof serviceLabels]}</span>
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    {/* Dialog Expandido */}
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogContent 
        showClose={false}
        className={`!w-screen !max-w-5xl md:!rounded-lg !rounded-none !p-0 [&>*]:!m-0 !gap-0 !space-y-0 [&>button]:hidden overflow-hidden flex flex-col ${
          isFullscreen ? '!h-screen !max-w-full !rounded-none' : '!h-[85vh] md:!w-[90vw]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold truncate">{cardName}</h2>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnalyticsContent embedded />
        </div>
        
        <DialogTitle className="sr-only">Analytics</DialogTitle>
        <DialogDescription className="sr-only">Visualização expandida de analytics</DialogDescription>
      </DialogContent>
    </Dialog>
    </>
  )
}
