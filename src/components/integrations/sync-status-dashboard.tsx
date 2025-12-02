import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

/**
 * 📊 Sync Status Dashboard
 * Dashboard de métricas e histórico de sincronizações
 * 
 * Features:
 * - Estatísticas gerais (últimos 7 dias)
 * - Histórico de sincronizações
 * - Taxa de sucesso/erro
 * - Última sincronização
 */

interface SyncLog {
  id: string
  service: string
  operation: string
  status: 'success' | 'error' | 'partial'
  metadata: any
  error_message?: string
  duration_ms?: number
  created_at: string
}

interface Stats {
  service: string
  operation: string
  total_operations: number
  success_count: number
  error_count: number
  avg_duration_ms: number
  last_sync_at: string
}

export function SyncStatusDashboard() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Atualizar stats antes de buscar
      try {
        await supabase.rpc('refresh_google_sync_stats')
      } catch {
        console.log('Stats view vazia ou ainda não populada')
      }

      // Buscar logs recentes
      const { data: logsData, error: logsError } = await supabase
        .from('google_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (logsError) {
        console.error('Erro ao buscar logs:', logsError)
      }
      setLogs(logsData || [])

      // Buscar estatísticas da view materializada
      const { data: statsData, error: statsError } = await supabase
        .from('google_sync_stats')
        .select('*')

      if (statsError) {
        console.error('Erro ao buscar stats:', statsError)
      }
      setStats(statsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalOps = stats.reduce((acc, s) => acc + s.total_operations, 0)
  const totalSuccess = stats.reduce((acc, s) => acc + s.success_count, 0)
  const totalErrors = stats.reduce((acc, s) => acc + s.error_count, 0)
  const successRate = totalOps > 0 ? ((totalSuccess / totalOps) * 100).toFixed(1) : '0'

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'gmail':
        return '📧'
      case 'calendar':
        return '📅'
      case 'sheets':
        return '📊'
      default:
        return '🔗'
    }
  }

  const getOperationLabel = (operation: string) => {
    const labels: Record<string, string> = {
      auto_import: 'Importação Automática',
      manual_import: 'Importação Manual',
      sync: 'Sincronização',
      export: 'Exportação',
      webhook: 'Webhook',
    }
    return labels[operation] || operation
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>Carregando métricas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Status de Sincronização
        </CardTitle>
        <CardDescription>
          Métricas e histórico dos últimos 7 dias
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalOps}</div>
            <div className="text-xs text-muted-foreground">Total Ops</div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{totalSuccess}</div>
            <div className="text-xs text-muted-foreground">Sucesso</div>
          </div>

          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
          </div>

          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
            <div className="text-xs text-muted-foreground">Taxa Sucesso</div>
          </div>
        </div>

        {/* Estatísticas por Serviço */}
        {stats.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-medium mb-3">Por Serviço</h3>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getServiceIcon(stat.service)}</span>
                  <div>
                    <div className="font-medium capitalize">{stat.service}</div>
                    <div className="text-xs text-muted-foreground">
                      {getOperationLabel(stat.operation)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {stat.success_count}/{stat.total_operations}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.avg_duration_ms}ms avg
                    </div>
                  </div>

                  <Badge
                    variant={
                      stat.error_count === 0 ? 'default' : 'destructive'
                    }
                  >
                    {((stat.success_count / stat.total_operations) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Histórico de Sincronizações */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium mb-3">Histórico Recente</h3>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma sincronização registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 border rounded-lg ${
                    log.status === 'error'
                      ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xl mt-0.5">
                        {getServiceIcon(log.service)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {log.service}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {getOperationLabel(log.operation)}
                          </span>
                        </div>

                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            ❌ {log.error_message}
                          </p>
                        )}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {log.metadata.total_processed && (
                              <span>
                                📊 {log.metadata.total_processed} processados
                              </span>
                            )}
                            {log.metadata.total_imported && (
                              <span className="ml-2">
                                ✅ {log.metadata.total_imported} importados
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                          {log.duration_ms && (
                            <span className="ml-2">• {log.duration_ms}ms</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        log.status === 'success'
                          ? 'default'
                          : log.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : log.status === 'error' ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
