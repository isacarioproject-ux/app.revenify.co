import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// Ícones
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
  Mail,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

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

interface AnalyticsContentProps {
  embedded?: boolean
}

export function AnalyticsContent({ embedded = false }: AnalyticsContentProps) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)

      // Refresh stats
      try {
        await supabase.rpc('refresh_google_sync_stats')
      } catch {
        console.log('Stats view vazia')
      }

      // Buscar logs
      const { data: logsData } = await supabase
        .from('google_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      setLogs(logsData || [])

      // Buscar estatísticas
      const { data: statsData } = await supabase
        .from('google_sync_stats')
        .select('*')

      setStats(statsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      if (!embedded) {
        toast.error('Erro ao carregar analytics')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast.success('Dados atualizados')
  }

  const totalOps = stats.reduce((acc, s) => acc + s.total_operations, 0)
  const totalSuccess = stats.reduce((acc, s) => acc + s.success_count, 0)
  const totalErrors = stats.reduce((acc, s) => acc + s.error_count, 0)
  const successRate = totalOps > 0 ? ((totalSuccess / totalOps) * 100).toFixed(1) : '0'
  const avgDuration = stats.length > 0 
    ? (stats.reduce((acc, s) => acc + s.avg_duration_ms, 0) / stats.length).toFixed(0)
    : '0'

  // Dados para gráficos
  const pieData = stats.map(s => ({
    name: s.service,
    value: s.total_operations,
  }))

  const barData = stats.map(s => ({
    name: s.service,
    Sucesso: s.success_count,
    Erro: s.error_count,
  }))

  // Preparar dados para gráfico de linha (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const lineData = last7Days.map(day => {
    const dayLogs = logs.filter(log => log.created_at.startsWith(day))
    return {
      date: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: dayLogs.length,
      sucesso: dayLogs.filter(l => l.status === 'success').length,
      erro: dayLogs.filter(l => l.status === 'error').length,
    }
  })

  const COLORS = {
    gmail: '#EA4335',
    calendar: '#4285F4',
    sheets: '#34A853',
    drive: '#FBBC04',
  }

  const serviceIcons = {
    gmail: Mail,
    calendar: Calendar,
    sheets: FileSpreadsheet,
    drive: FolderOpen,
  }

  const getServiceIcon = (service: string) => {
    const Icon = serviceIcons[service as keyof typeof serviceIcons] || BarChart3
    return <Icon className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-orange-500" />
    }
  }

  return (
    <div className={embedded ? "space-y-3 p-3" : "container mx-auto p-6 px-4 md:px-16 space-y-6"}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Google Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas e logs de sincronização do Google
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      )}

      {/* Cards de Métricas */}
      {loading ? (
        <div className={`grid grid-cols-1 md:grid-cols-4 ${embedded ? 'gap-2' : 'gap-4'}`}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={embedded ? "h-20" : "h-32"} />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-4 ${embedded ? 'gap-2' : 'gap-4'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className={`${embedded ? 'p-2' : 'p-3'} rounded-lg bg-blue-100 dark:bg-blue-900/20`}>
                  <BarChart3 className={`${embedded ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 dark:text-blue-400`} />
                </div>
                <div>
                  <p className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Operações</p>
                  <p className={`${embedded ? 'text-lg' : 'text-2xl'} font-bold`}>{totalOps}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className={`${embedded ? 'p-2' : 'p-3'} rounded-lg bg-green-100 dark:bg-green-900/20`}>
                  <CheckCircle2 className={`${embedded ? 'h-4 w-4' : 'h-6 w-6'} text-green-600 dark:text-green-400`} />
                </div>
                <div>
                  <p className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Taxa de Sucesso</p>
                  <p className={`${embedded ? 'text-lg' : 'text-2xl'} font-bold`}>{successRate}%</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className={`${embedded ? 'p-2' : 'p-3'} rounded-lg bg-red-100 dark:bg-red-900/20`}>
                  <XCircle className={`${embedded ? 'h-4 w-4' : 'h-6 w-6'} text-red-600 dark:text-red-400`} />
                </div>
                <div>
                  <p className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Erros</p>
                  <p className={`${embedded ? 'text-lg' : 'text-2xl'} font-bold`}>{totalErrors}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className={`${embedded ? 'p-2' : 'p-3'} rounded-lg bg-purple-100 dark:bg-purple-900/20`}>
                  <Clock className={`${embedded ? 'h-4 w-4' : 'h-6 w-6'} text-purple-600 dark:text-purple-400`} />
                </div>
                <div>
                  <p className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Tempo Médio</p>
                  <p className={`${embedded ? 'text-lg' : 'text-2xl'} font-bold`}>{avgDuration}ms</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className={embedded ? "space-y-2" : "space-y-4"}>
        {loading ? (
          <Skeleton className="h-10 w-80" />
        ) : (
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
          </TabsList>
        )}

        {/* Visão Geral */}
        <TabsContent value="overview" className={embedded ? "space-y-6" : "space-y-6"}>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${embedded ? 'gap-3' : 'gap-4'}`}>
            {/* Gráfico de Linha - Histórico */}
            <div>
              {loading ? (
                <Skeleton className="h-6 w-48 mb-2" />
              ) : (
                <h3 className={`${embedded ? 'text-sm mb-2' : 'text-base mb-3'} font-semibold`}>Sincronizações (Últimos 7 dias)</h3>
              )}
              {loading ? (
                <Skeleton className={embedded ? "h-40" : "h-64"} />
              ) : (
                <ResponsiveContainer width="100%" height={embedded ? 280 : 300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sucesso" stroke="#22c55e" strokeWidth={2} name="Sucesso" />
                    <Line type="monotone" dataKey="erro" stroke="#ef4444" strokeWidth={2} name="Erro" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico de Pizza - Distribuição */}
            <div>
              {loading ? (
                <Skeleton className="h-6 w-48 mb-2" />
              ) : (
                <h3 className={`${embedded ? 'text-sm mb-2' : 'text-base mb-3'} font-semibold`}>Distribuição por Serviço</h3>
              )}
              {loading ? (
                <Skeleton className={embedded ? "h-40" : "h-64"} />
              ) : (
                <ResponsiveContainer width="100%" height={embedded ? 300 : 300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="55%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value})`}
                      outerRadius={embedded ? 90 : 100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#999'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico de Barras - Taxa de Sucesso */}
          <div>
            {loading ? (
              <Skeleton className="h-6 w-64 mb-2" />
            ) : (
              <h3 className={`${embedded ? 'text-sm mb-2' : 'text-base mb-3'} font-semibold`}>Taxa de Sucesso por Serviço</h3>
            )}
            {loading ? (
              <Skeleton className={embedded ? "h-48" : "h-64"} />
            ) : (
              <ResponsiveContainer width="100%" height={embedded ? 300 : 320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sucesso" fill="#22c55e" />
                  <Bar dataKey="Erro" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className={embedded ? "space-y-2" : "space-y-4"}>
          {loading ? (
            <Skeleton className="h-6 w-48 mb-3" />
          ) : (
            <h3 className={`${embedded ? 'text-sm mb-2' : 'text-base mb-3'} font-semibold`}>Histórico de Sincronizações</h3>
          )}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma sincronização registrada ainda</p>
            </div>
          ) : (
            <div className={`${embedded ? 'space-y-1' : 'space-y-2'} ${embedded ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto`}>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center ${embedded ? 'gap-2 py-2' : 'gap-3 py-3'} hover:bg-accent/30 transition-colors rounded`}
                >
                  <div className={`flex items-center gap-2 ${embedded ? 'min-w-[100px]' : 'min-w-[120px]'}`}>
                    {getServiceIcon(log.service)}
                    <span className={`font-medium ${embedded ? 'text-xs' : 'text-sm'} capitalize`}>{log.service}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${embedded ? 'text-xs' : 'text-sm'} truncate`}>
                      <Badge variant="outline" className="text-xs mr-2 h-4">{log.operation}</Badge>
                      {log.error_message || 'Sincronizado com sucesso'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                      {log.duration_ms && ` • ${log.duration_ms}ms`}
                    </p>
                  </div>
                  {getStatusIcon(log.status)}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Serviços */}
        <TabsContent value="services" className={embedded ? "space-y-2" : "space-y-4"}>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${embedded ? 'gap-2' : 'gap-4'}`}>
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </>
            ) : stats.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma estatística disponível</p>
              </div>
            ) : (
              stats.map((stat, index) => (
                <motion.div
                  key={`${stat.service}-${stat.operation}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="rounded-lg border bg-card">
                    <div className={`${embedded ? 'p-3' : 'p-4'} border-b flex items-center gap-2`}>
                      {getServiceIcon(stat.service)}
                      <h3 className={`${embedded ? 'text-sm' : 'text-base'} font-semibold capitalize`}>
                        {stat.service} - {stat.operation}
                      </h3>
                    </div>
                    <div className={`${embedded ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total de Operações</span>
                        <Badge variant="secondary" className={embedded ? "text-xs h-5" : ""}>{stat.total_operations}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Sucessos</span>
                        <Badge className={`bg-green-500 ${embedded ? "text-xs h-5" : ""}`}>{stat.success_count}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Erros</span>
                        <Badge variant="destructive" className={embedded ? "text-xs h-5" : ""}>{stat.error_count}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${embedded ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Tempo Médio</span>
                        <Badge variant="outline" className={embedded ? "text-xs h-5" : ""}>{stat.avg_duration_ms}ms</Badge>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Última sincronização:{' '}
                          {new Date(stat.last_sync_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
