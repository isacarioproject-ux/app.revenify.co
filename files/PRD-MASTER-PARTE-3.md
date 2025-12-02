# PRD MASTER - PARTE 3
## Dias 5-6: Telas Completas + Features
### Código Completo | Copy-Paste Ready | Zero Ambiguidade

---

# CONTINUAÇÃO DIA 4: UI COMPONENTS (3h restantes)

## 4.4 SOURCES TABLE (1h)

### Arquivo: `src/components/dashboard/sources-table.tsx`

```typescript
import { ArrowRight, Copy, Globe } from 'lucide-react'
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
import { toast } from 'sonner'
import { useRouter } from 'react-router-dom'

interface Source {
  id: string
  name: string
  icon: string
  color: string
  utm_campaign: string
  tracking_url: string
  total_visits: number
  total_conversions: number
  total_revenue: number
}

interface SourcesTableProps {
  sources: Source[]
  limit?: number
}

const iconMap: Record<string, string> = {
  facebook: '📘',
  reddit: '🔴',
  twitter: '🐦',
  linkedin: '💼',
  email: '✉️',
  globe: '🌐',
}

export function SourcesTable({ sources, limit }: SourcesTableProps) {
  const router = useRouter()
  const displaySources = limit ? sources.slice(0, limit) : sources

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Tracking URL copied!')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (displaySources.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No sources yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first source to start tracking traffic
        </p>
        <Button onClick={() => router.push('/sources/new')}>
          Create Source
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Visitors</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displaySources.map((source) => (
            <TableRow key={source.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: source.color + '20' }}
                  >
                    {iconMap[source.icon] || iconMap.globe}
                  </div>
                  <div>
                    <div className="font-medium">{source.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1 py-0.5">
                        {source.utm_campaign}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleCopyUrl(source.tracking_url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNumber(source.total_visits)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(source.total_conversions)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(source.total_revenue)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/sources/${source.id}`)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {limit && sources.length > limit && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/sources')}
          >
            View All Sources
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

## 4.5 CONVERSION FUNNEL (45min)

### Arquivo: `src/components/dashboard/conversion-funnel.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FunnelData {
  visitors: number
  leads: number
  customers: number
  lead_conversion_rate: number
  customer_conversion_rate: number
}

interface ConversionFunnelProps {
  data: FunnelData
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const stages = [
    {
      label: 'Visitors',
      value: data.visitors,
      percentage: 100,
      color: 'bg-blue-500',
    },
    {
      label: 'Leads',
      value: data.leads,
      percentage: data.lead_conversion_rate,
      color: 'bg-green-500',
    },
    {
      label: 'Customers',
      value: data.customers,
      percentage: data.customer_conversion_rate,
      color: 'bg-purple-500',
    },
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', stage.color)}>
                    <span className="text-white font-bold text-lg">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{stage.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(stage.value)} users
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stage.percentage.toFixed(1)}%</div>
                  {index > 0 && (
                    <div className="text-xs text-muted-foreground">conversion</div>
                  )}
                </div>
              </div>

              {/* Visual bar */}
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all', stage.color)}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>

              {index < stages.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 4.6 CREATE SOURCE DIALOG (1h)

### Arquivo: `src/components/sources/create-source-dialog.tsx`

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Facebook, Globe, Linkedin, Mail, Twitter } from 'lucide-react'
import { createSource } from '@/lib/supabase/queries'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  utm_campaign: z
    .string()
    .min(2, 'Campaign must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  icon: z.string(),
  color: z.string(),
})

const icons = [
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877f2' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: '#1da1f2' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
  { value: 'reddit', label: 'Reddit', icon: (props) => <div {...props}>🔴</div>, color: '#ff4500' },
  { value: 'email', label: 'Email', icon: Mail, color: '#ea4335' },
  { value: 'globe', label: 'Other', icon: Globe, color: '#6366f1' },
]

interface CreateSourceDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateSourceDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CreateSourceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      utm_campaign: '',
      icon: 'globe',
      color: '#6366f1',
    },
  })

  const selectedIcon = icons.find((i) => i.value === form.watch('icon'))

  // Update tracking URL preview
  const watchedValues = form.watch()
  const generateTrackingUrl = () => {
    if (!watchedValues.utm_campaign) return ''
    
    const params = new URLSearchParams({
      utm_source: watchedValues.utm_source || watchedValues.icon || 'unknown',
      utm_campaign: watchedValues.utm_campaign,
    })
    if (watchedValues.utm_medium) {
      params.set('utm_medium', watchedValues.utm_medium)
    }
    
    return `yourdomain.com?${params.toString()}`
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      
      await createSource({
        projectId,
        name: values.name,
        utmCampaign: values.utm_campaign,
        utmSource: values.utm_source,
        utmMedium: values.utm_medium,
        color: values.color,
        icon: values.icon,
      })

      toast.success('Source created successfully!')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create source')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Source</DialogTitle>
          <DialogDescription>
            Track a new traffic source or campaign
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Facebook Launch Campaign" {...field} />
                  </FormControl>
                  <FormDescription>
                    Internal name for your reference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="utm_campaign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    UTM Campaign{' '}
                    <Badge variant="secondary" className="ml-2">
                      Identifier
                    </Badge>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="fb-launch-2024"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                        field.onChange(value)
                        setTrackingUrl(generateTrackingUrl())
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Must be unique. Lowercase, numbers, and hyphens only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        const icon = icons.find((i) => i.value === value)
                        form.setValue('color', icon?.color || '#6366f1')
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {icons.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              <icon.icon className="h-4 w-4" />
                              {icon.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" {...field} className="h-10 w-20" />
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="#6366f1"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Tracking URL Preview */}
            {watchedValues.utm_campaign && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  {selectedIcon && <selectedIcon.icon className="h-5 w-5" />}
                  <span className="font-semibold">Tracking URL Preview</span>
                </div>
                <code className="block break-all rounded bg-background p-3 text-sm">
                  {generateTrackingUrl()}
                </code>
                <p className="mt-2 text-xs text-muted-foreground">
                  💡 Copy this URL and use it in your posts/campaigns
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Source
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 4.7 UPGRADE MODAL (30min)

### Arquivo: `src/components/sources/upgrade-modal.tsx`

```typescript
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'react-router-dom'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: string
  reason: string
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  reason,
}: UpgradeModalProps) {
  const router = useRouter()

  const features = {
    free: {
      sources: 1,
      events: '1K',
    },
    starter: {
      sources: 'Unlimited',
      events: '10K',
      price: 9,
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🔒 Upgrade Required</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">Current</Badge>
              <span className="font-semibold capitalize">{currentPlan} Plan</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {features.free.sources} source
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {features.free.events} events/month
              </li>
            </ul>
          </div>

          {/* Recommended Plan */}
          <div className="rounded-lg border-2 border-primary p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge>Recommended</Badge>
                <span className="font-semibold">Starter Plan</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${features.starter.price}</div>
                <div className="text-xs text-muted-foreground">/month</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <strong>{features.starter.sources}</strong> sources
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <strong>{features.starter.events}</strong> events/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Revenue tracking
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                90 days data retention
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false)
                router.push('/settings/billing')
              }}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

# DIA 5: TELAS PRINCIPAIS (6h)

## ✅ Checklist Dia 5:
- [ ] Dashboard page completa
- [ ] Sources list page
- [ ] Create source page
- [ ] Source detail page
- [ ] Settings page (tabs)
- [ ] Onboarding wizard

---

## 5.1 DASHBOARD PAGE (1.5h)

### Arquivo: `src/app/dashboard/page.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Users, UserCheck, Target, DollarSign } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { VisitorsChart } from '@/components/dashboard/visitors-chart'
import { LiveEventsFeed } from '@/components/dashboard/live-events-feed'
import { SourcesTable } from '@/components/dashboard/sources-table'
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel'
import { Button } from '@/components/ui/button'
import {
  getDashboardMetrics,
  getVisitorsChartData,
  getTopSources,
  getConversionFunnel,
} from '@/lib/supabase/queries'
import { useProject } from '@/hooks/use-project'
import { useDateRange } from '@/hooks/use-date-range'

export default function DashboardPage() {
  const { project } = useProject()
  const { dateRange } = useDateRange()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [chartData, setChartData] = useState([])
  const [sources, setSources] = useState([])
  const [funnelData, setFunnelData] = useState(null)

  useEffect(() => {
    if (!project) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [metricsData, chartDataRes, sourcesData, funnelDataRes] =
          await Promise.all([
            getDashboardMetrics(
              project.id,
              dateRange.startDate,
              dateRange.endDate
            ),
            getVisitorsChartData(
              project.id,
              dateRange.startDate,
              dateRange.endDate
            ),
            getTopSources(project.id, 5),
            getConversionFunnel(project.id),
          ])

        setMetrics(metricsData)
        setChartData(chartDataRes)
        setSources(sourcesData)
        setFunnelData(funnelDataRes)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [project, dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your attribution analytics in real-time
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Visitors"
          value={formatNumber(metrics?.totalVisitors || 0)}
          icon={Users}
          trend={{
            value: metrics?.visitorsTrend || 0,
            label: 'vs last period',
          }}
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="Leads"
          value={formatNumber(metrics?.totalLeads || 0)}
          icon={UserCheck}
          trend={{
            value: metrics?.leadsTrend || 0,
            label: 'vs last period',
          }}
          color="green"
          loading={loading}
        />
        <MetricCard
          title="Customers"
          value={formatNumber(metrics?.totalCustomers || 0)}
          icon={Target}
          trend={{
            value: metrics?.customersTrend || 0,
            label: 'vs last period',
          }}
          color="purple"
          loading={loading}
        />
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          icon={DollarSign}
          trend={{
            value: metrics?.revenueTrend || 0,
            label: 'vs last period',
          }}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Chart + Live Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisitorsChart data={chartData} loading={loading} />
        </div>
        <div>
          <LiveEventsFeed projectId={project?.id} />
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnelData && <ConversionFunnel data={funnelData} />}

      {/* Top Sources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top Sources</h2>
          <Button variant="ghost" onClick={() => router.push('/sources')}>
            View All
          </Button>
        </div>
        <SourcesTable sources={sources} limit={5} />
      </div>
    </div>
  )
}
```

---

## 5.2 SOURCES LIST PAGE (1h)

### Arquivo: `src/app/sources/page.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SourcesTable } from '@/components/dashboard/sources-table'
import { CreateSourceDialog } from '@/components/sources/create-source-dialog'
import { UpgradeModal } from '@/components/sources/upgrade-modal'
import { getSources } from '@/lib/supabase/queries'
import { useProject } from '@/hooks/use-project'
import { useSubscription } from '@/hooks/use-subscription'

export default function SourcesPage() {
  const { project } = useProject()
  const { subscription } = useSubscription()
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  useEffect(() => {
    loadSources()
  }, [project])

  const loadSources = async () => {
    if (!project) return
    try {
      setLoading(true)
      const data = await getSources(project.id)
      setSources(data)
    } catch (error) {
      console.error('Error loading sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    // Check limite
    if (subscription.max_sources !== -1 && sources.length >= subscription.max_sources) {
      setUpgradeModalOpen(true)
      return
    }
    setCreateDialogOpen(true)
  }

  const isLimitReached = subscription.max_sources !== -1 && 
    sources.length >= subscription.max_sources

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sources</h1>
          <p className="text-muted-foreground">
            Manage your traffic sources and campaigns
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Source
        </Button>
      </div>

      {/* Limit Warning */}
      {isLimitReached && (
        <Alert variant="warning">
          <AlertTitle>Upgrade to track more sources</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {subscription.plan === 'free' && (
                <>
                  Free plan: {sources.length}/{subscription.max_sources} sources used.
                  Upgrade to Starter for unlimited sources ($9/mo).
                </>
              )}
            </span>
            <Button
              size="sm"
              onClick={() => router.push('/settings/billing')}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sources Table */}
      <SourcesTable sources={sources} />

      {/* Dialogs */}
      <CreateSourceDialog
        projectId={project?.id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadSources}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan={subscription.plan}
        reason={`${subscription.plan} plan is limited to ${subscription.max_sources} source${
          subscription.max_sources === 1 ? '' : 's'
        }. Upgrade to create more.`}
      />
    </div>
  )
}
```

---

*[CONTINUA...]*

**Status Parte 3:** ✅ DIA 4 Completo, DIA 5 30% completo
**Próximo:** Completar DIA 5-6 + PARTE 4 + PARTE 5
