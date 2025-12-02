import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, FileSpreadsheet, ExternalLink, Download } from 'lucide-react'
import { SheetsService } from '@/services/google/sheets.service'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { motion } from 'framer-motion'
import { useI18n } from '@/hooks/use-i18n'

/**
 * 📊 Sheets Export Dialog
 * Exportar dados para Google Sheets
 * 
 * Funcionalidades:
 * - Exportar relatório financeiro mensal
 * - Exportar lista de tasks
 * - Abrir planilha criada automaticamente
 */

export function SheetsExportDialog() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'finance' | 'tasks' | null>(null)
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null)

  const handleExportFinance = async () => {
    try {
      setExporting(true)
      setExportType('finance')
      toast.info(`📊 ${t('sheets.creatingFinance')}`)

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      const url = await SheetsService.exportFinanceReport(
        month,
        year,
        currentWorkspace?.id
      )

      if (url) {
        setLastExportUrl(url)
        toast.success(`✅ ${t('sheets.spreadsheetCreated')}`)
        
        // Abrir em nova aba
        window.open(url, '_blank')
      } else {
        toast.error(t('sheets.errorCreate'))
      }
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      
      // Se for erro 403, avisar sobre permissões
      if (error.message?.includes('403') || error.message?.includes('Erro ao criar planilha')) {
        toast.error(`❌ ${t('sheets.noPermission')}`, {
          duration: 8000,
          description: t('sheets.noPermissionDesc')
        })
      } else {
        toast.error(`${t('sheets.errorCreate')}: ${error.message}`)
      }
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  const handleExportTasks = async () => {
    try {
      setExporting(true)
      setExportType('tasks')
      toast.info(`📋 ${t('sheets.creatingTasks')}`)

      const url = await SheetsService.exportTasks(
        currentWorkspace?.id
      )

      if (url) {
        setLastExportUrl(url)
        toast.success(`✅ ${t('sheets.spreadsheetCreated')}`)
        
        // Abrir em nova aba
        window.open(url, '_blank')
      } else {
        toast.error(t('sheets.errorCreate'))
      }
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      
      // Se for erro 403, avisar sobre permissões
      if (error.message?.includes('403') || error.message?.includes('Erro ao criar planilha')) {
        toast.error(`❌ ${t('sheets.noPermission')}`, {
          duration: 8000,
          description: t('sheets.noPermissionDesc')
        })
      } else {
        toast.error(`${t('sheets.errorCreate')}: ${error.message}`)
      }
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t('sheets.title')}
        </CardTitle>
        <CardDescription>
          {t('sheets.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Exportar Finance */}
          <Dialog>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('sheets.financeReport')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('sheets.financeReportDesc')}
                        </p>
                      </div>
                      <Button className="w-full" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        {t('sheets.export')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('sheets.exportFinanceTitle')}</DialogTitle>
                <DialogDescription>
                  {t('sheets.exportFinanceDesc')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{t('sheets.whatIncluded')}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ {t('sheets.allIncome')}</li>
                    <li>✅ {t('sheets.allExpenses')}</li>
                    <li>✅ {t('sheets.categoriesPayment')}</li>
                    <li>✅ {t('sheets.statusDates')}</li>
                    <li>✅ {t('sheets.formattedValues')}</li>
                  </ul>
                </div>

                <Button
                  onClick={handleExportFinance}
                  disabled={exporting && exportType === 'finance'}
                  className="w-full"
                >
                  {exporting && exportType === 'finance' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('sheets.creatingSpreadsheet')}
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {t('sheets.createSpreadsheet')}
                    </>
                  )}
                </Button>

                {lastExportUrl && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      ✅ {t('sheets.spreadsheetCreated')}
                    </p>
                    <Button
                      onClick={() => window.open(lastExportUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t('sheets.openSpreadsheet')}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Exportar Tasks */}
          <Dialog>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('sheets.tasksList')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('sheets.tasksListDesc')}
                        </p>
                      </div>
                      <Button className="w-full" size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        {t('sheets.export')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('sheets.exportTasksTitle')}</DialogTitle>
                <DialogDescription>
                  {t('sheets.exportTasksDesc')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">{t('sheets.whatIncluded')}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ {t('sheets.titleDescription')}</li>
                    <li>✅ {t('sheets.statusPriority')}</li>
                    <li>✅ {t('sheets.startEndDates')}</li>
                    <li>✅ {t('sheets.assignees')}</li>
                    <li>✅ {t('sheets.tagsCategories')}</li>
                  </ul>
                </div>

                <Button
                  onClick={handleExportTasks}
                  disabled={exporting && exportType === 'tasks'}
                  className="w-full"
                >
                  {exporting && exportType === 'tasks' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('sheets.creatingSpreadsheet')}
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      {t('sheets.createSpreadsheet')}
                    </>
                  )}
                </Button>

                {lastExportUrl && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      ✅ {t('sheets.spreadsheetCreated')}
                    </p>
                    <Button
                      onClick={() => window.open(lastExportUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t('sheets.openSpreadsheet')}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>💡 {t('sheets.tip')}</strong> {t('sheets.tipDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
