import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Link2,
  Copy,
  QrCode,
  BarChart3,
  Trash2,
  Check,
  ExternalLink,
  MousePointerClick,
  Download,
} from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { useShortLinks, ShortLink } from '@/hooks/use-short-links'
import { CreateShortLinkDialog } from '@/components/create-short-link-dialog'
import { QRCodeDialog } from '@/components/qrcode-dialog'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
import { TOOLTIPS } from '@/lib/tooltips'
import { getShortLinkUrl, getShortLinkDisplayUrl, DOMAIN_CONFIGURED, DEFAULT_SHORT_DOMAIN } from '@/lib/config'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { HeaderSkeleton, SelectSkeleton, ButtonSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/page-skeleton'
import { useI18n } from '@/hooks/use-i18n'

export default function ShortLinksPage() {
  const { t } = useI18n()
  const { projects, selectedProject, setSelectedProject, loading: projectsLoading } = useProjects()
  const { shortLinks, isLoading, stats, createShortLink, deleteShortLink } = useShortLinks()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)
  
  // Marcar como carregado após primeira carga
  if (!isLoading && !projectsLoading && selectedProject && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true
  }
  
  // Só mostrar skeleton na primeira carga
  const showInitialSkeleton = !hasLoadedOnce.current && (isLoading || projectsLoading)

  const copyToClipboard = async (link: ShortLink) => {
    const url = getShortLinkUrl(link.short_code)
    await navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    toast.success(t('shortLinks.linkCopied'))
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openQRCode = (link: ShortLink) => {
    setSelectedLink(link)
    setQrDialogOpen(true)
  }

  const exportToCSV = () => {
    if (shortLinks.length === 0) {
      toast.error(t('shortLinks.noLinksToExport'))
      return
    }

    const headers = ['Short Code', 'Short URL', 'Destination URL', 'Title', 'Clicks', 'Created At', 'UTM Source', 'UTM Medium', 'UTM Campaign']
    const rows = shortLinks.map(link => [
      link.short_code,
      getShortLinkUrl(link.short_code),
      link.destination_url,
      link.title || '',
      link.clicks_count.toString(),
      format(new Date(link.created_at), 'yyyy-MM-dd HH:mm'),
      link.utm_source || '',
      link.utm_medium || '',
      link.utm_campaign || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `short-links-${selectedProject?.name || 'export'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(t('shortLinks.exportSuccess'))
  }

  // Loading State - só na primeira carga
  if (showInitialSkeleton) {
    return (
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <HeaderSkeleton />
            <div className="flex items-center gap-3">
              <SelectSkeleton />
              <ButtonSkeleton />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <div className="rounded-lg bg-muted/10 p-4">
            <TableSkeleton rows={5} cols={6} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Empty State - só depois de carregar
  if (shortLinks.length === 0 && selectedProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            {/* Icon Circle */}
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
              <Link2 className="h-12 w-12 text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">
              {t('shortLinks.noLinks')}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('shortLinks.noLinksDesc')}
            </p>

            {/* CTA */}
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('shortLinks.createFirst')}
            </Button>

            {/* Feature list */}
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Links curtos branded (rvnfy.co/abc123)</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Analytics de cliques em tempo real</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>QR Codes automáticos para campanhas offline</span>
              </div>
            </div>
          </div>

          <CreateShortLinkDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onCreate={createShortLink}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('shortLinks.title')}</h1>
            <p className="text-muted-foreground">
              {t('shortLinks.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedProject?.id || ''}
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value)
                if (project) setSelectedProject(project)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('dashboard.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} disabled={shortLinks.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('shortLinks.exportCsv')}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('shortLinks.createLink')}
            </Button>
          </div>
        </div>

        {/* Banner: Domínio não configurado */}
        {!DOMAIN_CONFIGURED && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <strong>Domínio em configuração:</strong> Os links serão exibidos como <code className="px-1 py-0.5 bg-muted rounded text-xs">{DEFAULT_SHORT_DOMAIN}/codigo</code>, 
              mas usam uma URL temporária até o domínio estar ativo. O rastreamento já funciona normalmente.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('shortLinks.totalLinks')}</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLinks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('shortLinks.activeLinks')}</CardTitle>
              <Link2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLinks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">{t('shortLinks.totalClicks')}</CardTitle>
                <InfoTooltipRich
                  title={TOOLTIPS.clicks.title}
                  description={TOOLTIPS.clicks.description}
                  icon="info"
                />
              </div>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('shortLinks.avgCtr')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalLinks > 0 
                  ? `${((stats.totalClicks / stats.totalLinks) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      {t('shortLinks.shortLink')}
                      <InfoTooltipRich
                        title={TOOLTIPS.shortLink.title}
                        description={TOOLTIPS.shortLink.description}
                        icon="info"
                      />
                    </div>
                  </TableHead>
                  <TableHead>{t('shortLinks.destination')}</TableHead>
                  <TableHead>{t('shortLinks.clicks')}</TableHead>
                  <TableHead>{t('shortLinks.created')}</TableHead>
                  <TableHead>{t('shortLinks.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-sm cursor-help hover:text-primary transition-colors">
                                {getShortLinkDisplayUrl(link.short_code)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="space-y-1">
                                <p className="text-xs font-medium">{t('shortLinks.previewTitle')}</p>
                                <p className="text-xs font-mono break-all text-muted-foreground">
                                  {getShortLinkUrl(link.short_code)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  → {link.destination_url.length > 50 ? link.destination_url.slice(0, 50) + '...' : link.destination_url}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(link)}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline truncate"
                      >
                        <span className="truncate">{link.destination_url}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {link.clicks_count.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(link.created_at), "d 'de' MMM", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {link.is_active ? (
                        <Badge variant="default" className="bg-green-500">{t('projects.active')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('projects.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openQRCode(link)}
                          title={t('shortLinks.generateQr')}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteShortLink(link.id)}
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateShortLinkDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreate={createShortLink}
        />

        {selectedLink && (
          <QRCodeDialog
            open={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            shortLink={selectedLink}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
