import { useState, useRef } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
import { TOOLTIPS } from '@/lib/tooltips'
import { Link2, Globe, Megaphone, Tag, Calendar, Lock, GitBranch, MapPin, Plus, Trash2, Smartphone, Monitor, Tablet, Apple, Play, Eye, Image, Upload, X, ChevronDown, Settings2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import type { GeoTargetingRule, DeviceTargetingRule } from '@/hooks/use-short-links'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateShortLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: {
    destination_url: string
    title?: string
    description?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
    expires_at?: string
    password?: string
    ab_test_enabled?: boolean
    ab_test_url?: string
    ab_test_split?: number
    geo_targeting?: GeoTargetingRule[]
    device_targeting?: DeviceTargetingRule
    deep_link_ios?: string
    deep_link_android?: string
    deep_link_fallback?: string
    cloaking_enabled?: boolean
    cloaked_title?: string
    cloaked_description?: string
    cloaked_image?: string
  }) => Promise<any>
}

const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'IT', name: 'Itália' },
  { code: 'CA', name: 'Canadá' },
  { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'Índia' },
  { code: 'AU', name: 'Austrália' },
]

export function CreateShortLinkDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateShortLinkDialogProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    destination_url: '',
    title: '',
    description: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    expires_at: '',
    password: '',
    ab_test_enabled: false,
    ab_test_url: '',
    ab_test_split: 50,
    deep_link_ios: '',
    deep_link_android: '',
    deep_link_fallback: '',
    cloaking_enabled: false,
    cloaked_title: '',
    cloaked_description: '',
    cloaked_image: '',
  })
  const [geoRules, setGeoRules] = useState<GeoTargetingRule[]>([])
  const [deviceTargeting, setDeviceTargeting] = useState<DeviceTargetingRule>({})
  const [deviceTargetingEnabled, setDeviceTargetingEnabled] = useState(false)
  const [deepLinksEnabled, setDeepLinksEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload de imagem para Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo e tamanho (max 2MB)
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB')
      return
    }

    setIsUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `og-${Date.now()}.${fileExt}`
      const filePath = `cloaking/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath)

      setFormData({ ...formData, cloaked_image: publicUrl })
      toast.success('Imagem enviada!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, cloaked_image: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        geo_targeting: geoRules.length > 0 ? geoRules : undefined,
        device_targeting: deviceTargetingEnabled && Object.keys(deviceTargeting).length > 0 ? deviceTargeting : undefined,
        deep_link_ios: deepLinksEnabled && formData.deep_link_ios ? formData.deep_link_ios : undefined,
        deep_link_android: deepLinksEnabled && formData.deep_link_android ? formData.deep_link_android : undefined,
        deep_link_fallback: deepLinksEnabled && formData.deep_link_fallback ? formData.deep_link_fallback : undefined,
        cloaking_enabled: formData.cloaking_enabled || undefined,
        cloaked_title: formData.cloaking_enabled && formData.cloaked_title ? formData.cloaked_title : undefined,
        cloaked_description: formData.cloaking_enabled && formData.cloaked_description ? formData.cloaked_description : undefined,
        cloaked_image: formData.cloaking_enabled && formData.cloaked_image ? formData.cloaked_image : undefined,
      }
      const result = await onCreate(submitData)
      if (result) {
        setGeoRules([])
        setDeviceTargeting({})
        setDeviceTargetingEnabled(false)
        setDeepLinksEnabled(false)
        setFormData({
          destination_url: '',
          title: '',
          description: '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_term: '',
          utm_content: '',
          expires_at: '',
          password: '',
          ab_test_enabled: false,
          ab_test_url: '',
          ab_test_split: 50,
          deep_link_ios: '',
          deep_link_android: '',
          deep_link_fallback: '',
          cloaking_enabled: false,
          cloaked_title: '',
          cloaked_description: '',
          cloaked_image: '',
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to create short link:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t('shortLinks.createLink')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('shortLinks.createLink')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Destination URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="destination_url">{t('shortLinks.destinationUrl')} *</Label>
              <InfoTooltipRich
                title={t('shortLinks.destinationUrl')}
                description={t('shortLinks.destinationUrlDesc')}
                icon="info"
              />
            </div>
            <Input
              id="destination_url"
              type="url"
              placeholder={t('shortLinks.destinationUrlPlaceholder')}
              value={formData.destination_url}
              onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
              required
            />
            {formData.destination_url && !isValidUrl(formData.destination_url) && (
              <p className="text-xs text-destructive">{t('shortLinks.invalidUrl')}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('shortLinks.titleOptional')}</Label>
            <Input
              id="title"
              placeholder={t('shortLinks.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('shortLinks.descriptionOptional')}</Label>
            <Textarea
              id="description"
              placeholder={t('shortLinks.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* UTM e Advanced Settings - GRÁTIS (fora do collapsible) */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="utm" className="border-0">
              <AccordionTrigger className="text-sm font-medium">
                {t('shortLinks.utmParams')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* UTM Source */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="utm_source">Source</Label>
                    <InfoTooltipRich
                      title={TOOLTIPS.utmSource.title}
                      description={TOOLTIPS.utmSource.description}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="utm_source"
                    placeholder="google, facebook, newsletter"
                    value={formData.utm_source}
                    onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                  />
                </div>

                {/* UTM Medium */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="utm_medium">Medium</Label>
                    <InfoTooltipRich
                      title={TOOLTIPS.utmMedium.title}
                      description={TOOLTIPS.utmMedium.description}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="utm_medium"
                    placeholder="cpc, email, social"
                    value={formData.utm_medium}
                    onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                  />
                </div>

                {/* UTM Campaign */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="utm_campaign">Campaign</Label>
                    <InfoTooltipRich
                      title={TOOLTIPS.utmCampaign.title}
                      description={TOOLTIPS.utmCampaign.description}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="utm_campaign"
                    placeholder="black-friday-2025"
                    value={formData.utm_campaign}
                    onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                  />
                </div>

                {/* UTM Term */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="utm_term">Term</Label>
                    <InfoTooltipRich
                      title={TOOLTIPS.utmTerm.title}
                      description={TOOLTIPS.utmTerm.description}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="utm_term"
                    placeholder="palavras-chave"
                    value={formData.utm_term}
                    onChange={(e) => setFormData({ ...formData, utm_term: e.target.value })}
                  />
                </div>

                {/* UTM Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="utm_content">Content</Label>
                    <InfoTooltipRich
                      title={TOOLTIPS.utmContent.title}
                      description={TOOLTIPS.utmContent.description}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="utm_content"
                    placeholder="banner-topo, link-rodape"
                    value={formData.utm_content}
                    onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced" className="border-0">
              <AccordionTrigger className="text-sm font-medium">
                {t('shortLinks.advancedSettings')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Expiration */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="expires_at">{t('shortLinks.expirationDate')}</Label>
                    <InfoTooltipRich
                      title={t('shortLinks.expiration')}
                      description={t('shortLinks.expirationDesc')}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                {/* Password Protection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="password">{t('shortLinks.password')}</Label>
                    <InfoTooltipRich
                      title={t('shortLinks.password')}
                      description={t('shortLinks.passwordDesc')}
                      icon="help"
                    />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('shortLinks.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {formData.password && (
                    <p className="text-xs text-muted-foreground">
                      {t('shortLinks.passwordHint')}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Features Pro/Business - Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  {t('shortLinks.proFeatures')}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <Accordion type="single" collapsible className="w-full">
                {/* A/B Testing */}
                <AccordionItem value="ab-testing" className="border-0">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      {t('shortLinks.abTesting')}
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('shortLinks.enableAbTest')}</Label>
                        <p className="text-xs text-muted-foreground">{t('shortLinks.abTestDesc')}</p>
                      </div>
                      <Switch
                        checked={formData.ab_test_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, ab_test_enabled: checked })}
                      />
                    </div>

                    {formData.ab_test_enabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="ab_test_url">{t('shortLinks.abTestUrl')}</Label>
                          <Input
                            id="ab_test_url"
                            type="url"
                            placeholder="https://example.com/variant-b"
                            value={formData.ab_test_url}
                            onChange={(e) => setFormData({ ...formData, ab_test_url: e.target.value })}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>{t('shortLinks.trafficSplit')}</Label>
                            <span className="text-sm font-medium">{formData.ab_test_split}% / {100 - formData.ab_test_split}%</span>
                          </div>
                          <Slider
                            value={[formData.ab_test_split]}
                            onValueChange={([value]) => setFormData({ ...formData, ab_test_split: value })}
                            min={10}
                            max={90}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t('shortLinks.originalUrl')}</span>
                            <span>{t('shortLinks.variantUrl')}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Geo Targeting */}
                <AccordionItem value="geo-targeting" className="border-0">
                  <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('shortLinks.geoTargeting')}
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground">{t('shortLinks.geoTargetingDesc')}</p>

                    {geoRules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={rule.country}
                          onValueChange={(value) => {
                            const newRules = [...geoRules]
                            newRules[index].country = value
                            setGeoRules(newRules)
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder={t('shortLinks.selectCountry')} />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="https://example.com/br"
                          value={rule.url}
                          onChange={(e) => {
                            const newRules = [...geoRules]
                            newRules[index].url = e.target.value
                            setGeoRules(newRules)
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setGeoRules(geoRules.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGeoRules([...geoRules, { country: '', url: '' }])}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('shortLinks.addGeoRule')}
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Device Targeting */}
                <AccordionItem value="device-targeting" className="border-0">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {t('shortLinks.deviceTargeting')}
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('shortLinks.enableDeviceTargeting')}</Label>
                        <p className="text-xs text-muted-foreground">{t('shortLinks.deviceTargetingDesc')}</p>
                      </div>
                      <Switch
                        checked={deviceTargetingEnabled}
                        onCheckedChange={setDeviceTargetingEnabled}
                      />
                    </div>

                    {deviceTargetingEnabled && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.desktopUrl')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.desktopUrl')}
                              description={t('shortLinks.desktopUrlDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="https://example.com/desktop"
                            value={deviceTargeting.desktop_url || ''}
                            onChange={(e) => setDeviceTargeting({ ...deviceTargeting, desktop_url: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.mobileUrl')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.mobileUrl')}
                              description={t('shortLinks.mobileUrlDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="https://example.com/mobile"
                            value={deviceTargeting.mobile_url || ''}
                            onChange={(e) => setDeviceTargeting({ ...deviceTargeting, mobile_url: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Tablet className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.tabletUrl')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.tabletUrl')}
                              description={t('shortLinks.tabletUrlDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="https://example.com/tablet"
                            value={deviceTargeting.tablet_url || ''}
                            onChange={(e) => setDeviceTargeting({ ...deviceTargeting, tablet_url: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Deep Links */}
                <AccordionItem value="deep-links" className="border-0">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {t('shortLinks.deepLinks')}
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('shortLinks.enableDeepLinks')}</Label>
                        <p className="text-xs text-muted-foreground">{t('shortLinks.deepLinksDesc')}</p>
                      </div>
                      <Switch
                        checked={deepLinksEnabled}
                        onCheckedChange={setDeepLinksEnabled}
                      />
                    </div>

                    {deepLinksEnabled && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Apple className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.iosDeepLink')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.iosDeepLink')}
                              description={t('shortLinks.iosDeepLinkDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="myapp://path/to/content"
                            value={formData.deep_link_ios}
                            onChange={(e) => setFormData({ ...formData, deep_link_ios: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.androidDeepLink')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.androidDeepLink')}
                              description={t('shortLinks.androidDeepLinkDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="myapp://path/to/content"
                            value={formData.deep_link_android}
                            onChange={(e) => setFormData({ ...formData, deep_link_android: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.fallbackUrl')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.fallbackUrl')}
                              description={t('shortLinks.fallbackUrlDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="https://example.com/app-store"
                            value={formData.deep_link_fallback}
                            onChange={(e) => setFormData({ ...formData, deep_link_fallback: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Link Cloaking */}
                <AccordionItem value="link-cloaking" className="border-0">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t('shortLinks.linkCloaking')}
                      <Badge variant="secondary" className="text-xs">Business</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('shortLinks.enableCloaking')}</Label>
                        <p className="text-xs text-muted-foreground">{t('shortLinks.cloakingDesc')}</p>
                      </div>
                      <Switch
                        checked={formData.cloaking_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, cloaking_enabled: checked })}
                      />
                    </div>

                    {formData.cloaking_enabled && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.cloakedTitle')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.cloakedTitle')}
                              description={t('shortLinks.cloakedTitleDesc')}
                              icon="help"
                            />
                          </div>
                          <Input
                            placeholder="Título personalizado para preview"
                            value={formData.cloaked_title}
                            onChange={(e) => setFormData({ ...formData, cloaked_title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.cloakedDescription')}</Label>
                            <InfoTooltipRich
                              title={t('shortLinks.cloakedDescription')}
                              description={t('shortLinks.cloakedDescriptionDesc')}
                              icon="help"
                            />
                          </div>
                          <Textarea
                            placeholder="Descrição personalizada para preview"
                            value={formData.cloaked_description}
                            onChange={(e) => setFormData({ ...formData, cloaked_description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            <Label>{t('shortLinks.cloakedImage')}</Label>
                          </div>
                          {formData.cloaked_image ? (
                            <div className="flex items-center gap-2">
                              <div className="relative h-10 w-16 rounded border overflow-hidden bg-muted">
                                <img
                                  src={formData.cloaked_image}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="h-8 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="cloaked-image-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage}
                                className="h-8 text-xs"
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {isUploadingImage ? '...' : 'Upload'}
                              </Button>
                              <span className="text-xs text-muted-foreground">Max 2MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.destination_url || !isValidUrl(formData.destination_url)}
            >
              {isLoading ? t('common.creating') : t('shortLinks.createLink')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
