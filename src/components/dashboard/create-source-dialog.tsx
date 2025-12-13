import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface CreateSourceDialogProps {
  projectDomain: string
  onSourceCreated?: (source: any) => void
  trigger?: React.ReactNode
}

const UTM_SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Indicação' },
  { value: 'direct', label: 'Direto' },
  { value: 'other', label: 'Outro' },
]

const UTM_MEDIUMS = [
  { value: 'cpc', label: 'CPC (Pago)' },
  { value: 'organic', label: 'Orgânico' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referência' },
  { value: 'display', label: 'Display' },
  { value: 'affiliate', label: 'Afiliado' },
]

export function CreateSourceDialog({ projectDomain, onSourceCreated, trigger }: CreateSourceDialogProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
  })

  const generatedUrl = () => {
    const params = new URLSearchParams()
    if (formData.utm_source) params.set('utm_source', formData.utm_source)
    if (formData.utm_medium) params.set('utm_medium', formData.utm_medium)
    if (formData.utm_campaign) params.set('utm_campaign', formData.utm_campaign)
    if (formData.utm_content) params.set('utm_content', formData.utm_content)
    
    const queryString = params.toString()
    return queryString ? `https://${projectDomain}?${queryString}` : `https://${projectDomain}`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedUrl())
    setCopied(true)
    toast.success(t('sources.urlCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreate = () => {
    if (!formData.name) {
      toast.error(t('sources.nameRequired'))
      return
    }
    
    onSourceCreated?.({
      ...formData,
      url: generatedUrl(),
    })
    
    toast.success(t('sources.created'))
    setOpen(false)
    setFormData({
      name: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Link2 className="mr-2 h-4 w-4" />
            {t('sources.newSource')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('sources.createSource')}</DialogTitle>
          <DialogDescription>
            {t('sources.createSourceDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('sources.sourceName')} *</Label>
            <Input
              id="name"
              placeholder={t('sources.sourceNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('sources.utmSource')}</Label>
              <Select
                value={formData.utm_source}
                onValueChange={(value) => setFormData({ ...formData, utm_source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {UTM_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('sources.utmMedium')}</Label>
              <Select
                value={formData.utm_medium}
                onValueChange={(value) => setFormData({ ...formData, utm_medium: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {UTM_MEDIUMS.map((medium) => (
                    <SelectItem key={medium.value} value={medium.value}>
                      {medium.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign">{t('sources.utmCampaign')}</Label>
            <Input
              id="campaign"
              placeholder={t('sources.utmCampaignPlaceholder')}
              value={formData.utm_campaign}
              onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('sources.utmContent')}</Label>
            <Input
              id="content"
              placeholder={t('sources.utmContentPlaceholder')}
              value={formData.utm_content}
              onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('sources.generatedUrl')}</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={generatedUrl()}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate}>
            {t('sources.createSource')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
