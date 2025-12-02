import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface FinanceSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FinanceSettings {
  // Visualização
  compactView: boolean
  showTotals: boolean
  groupByCategory: boolean
  
  // Filtros padrão
  defaultPeriod: 'all' | 'month' | 'quarter' | 'year'
  defaultView: 'list' | 'grid' | 'table'
  
  // Notificações
  notifyNewTransaction: boolean
  notifyBudgetLimit: boolean
  
  // Exportação
  defaultExportFormat: 'csv' | 'excel' | 'pdf'
  includeChartsInExport: boolean
  
  // Avançado
  autoSave: boolean
  autoRefresh: boolean
  refreshInterval: number // em segundos
}

const defaultSettings: FinanceSettings = {
  compactView: false,
  showTotals: true,
  groupByCategory: true,
  defaultPeriod: 'month',
  defaultView: 'list',
  notifyNewTransaction: true,
  notifyBudgetLimit: true,
  defaultExportFormat: 'excel',
  includeChartsInExport: true,
  autoSave: true,
  autoRefresh: false,
  refreshInterval: 30,
}

export function FinanceSettingsModal({ open, onOpenChange }: FinanceSettingsModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [settings, setSettings] = useState<FinanceSettings>(defaultSettings)

  // Carregar configurações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finance-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
  }, [])

  // Salvar configurações automaticamente
  useEffect(() => {
    localStorage.setItem('finance-settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = <K extends keyof FinanceSettings>(
    key: K,
    value: FinanceSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast.success('Configuração salva')
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('finance-settings')
    toast.success('Configurações restauradas para o padrão')
  }

  const SettingsContent = () => (
    <div className="space-y-6">
      {/* Visualização */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Visualização</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact">Visualização compacta</Label>
                <p className="text-xs text-muted-foreground">
                  Reduz o espaçamento entre elementos
                </p>
              </div>
              <Switch
                id="compact"
                checked={settings.compactView}
                onCheckedChange={(checked) => updateSetting('compactView', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="totals">Mostrar totais</Label>
                <p className="text-xs text-muted-foreground">
                  Exibe cards com totais no topo
                </p>
              </div>
              <Switch
                id="totals"
                checked={settings.showTotals}
                onCheckedChange={(checked) => updateSetting('showTotals', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="group">Agrupar por categoria</Label>
                <p className="text-xs text-muted-foreground">
                  Organiza transações por categoria
                </p>
              </div>
              <Switch
                id="group"
                checked={settings.groupByCategory}
                onCheckedChange={(checked) => updateSetting('groupByCategory', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Filtros Padrão */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Filtros Padrão</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="period">Período padrão</Label>
              <Select
                value={settings.defaultPeriod}
                onValueChange={(value: any) => updateSetting('defaultPeriod', value)}
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view">Visualização padrão</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(value: any) => updateSetting('defaultView', value)}
              >
                <SelectTrigger id="view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="grid">Grade</SelectItem>
                  <SelectItem value="table">Tabela</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notificações */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Notificações</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-transaction">Nova transação</Label>
                <p className="text-xs text-muted-foreground">
                  Notificar ao adicionar transação
                </p>
              </div>
              <Switch
                id="notify-transaction"
                checked={settings.notifyNewTransaction}
                onCheckedChange={(checked) => updateSetting('notifyNewTransaction', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-budget">Limite de orçamento</Label>
                <p className="text-xs text-muted-foreground">
                  Alertar ao atingir 80% do orçamento
                </p>
              </div>
              <Switch
                id="notify-budget"
                checked={settings.notifyBudgetLimit}
                onCheckedChange={(checked) => updateSetting('notifyBudgetLimit', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Exportação */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Exportação</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="export-format">Formato padrão</Label>
              <Select
                value={settings.defaultExportFormat}
                onValueChange={(value: any) => updateSetting('defaultExportFormat', value)}
              >
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-charts">Incluir gráficos</Label>
                <p className="text-xs text-muted-foreground">
                  Adiciona gráficos na exportação
                </p>
              </div>
              <Switch
                id="include-charts"
                checked={settings.includeChartsInExport}
                onCheckedChange={(checked) => updateSetting('includeChartsInExport', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Avançado */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Avançado</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Salvamento automático</Label>
                <p className="text-xs text-muted-foreground">
                  Salva alterações automaticamente
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-refresh">Atualização automática</Label>
                <p className="text-xs text-muted-foreground">
                  Recarrega dados periodicamente
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>

            {settings.autoRefresh && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="refresh-interval">Intervalo (segundos)</Label>
                <Select
                  value={settings.refreshInterval.toString()}
                  onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                >
                  <SelectTrigger id="refresh-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Botão Restaurar */}
      <div className="flex justify-end">
        <button
          onClick={resetSettings}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Restaurar configurações padrão
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Configurações salvas automaticamente
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Configurações</DialogTitle>
            <DialogDescription>
              Personalize a experiência da página de finanças
            </DialogDescription>
          </DialogHeader>

          {/* Botão X */}
          <button
            onClick={() => onOpenChange(false)}
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>

          <div className="mt-4">
            <SettingsContent />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl">Configurações</DrawerTitle>
          <DrawerDescription>
            Personalize a experiência da página de finanças
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          <SettingsContent />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// Hook para usar as configurações em outros componentes
export function useFinanceSettings() {
  const [settings, setSettings] = useState<FinanceSettings>(defaultSettings)

  useEffect(() => {
    const saved = localStorage.getItem('finance-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
  }, [])

  return settings
}
