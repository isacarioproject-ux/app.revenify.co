import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltipRich } from '@/components/ui/info-tooltip'
import { Globe, Megaphone, Tag, Search, FileText } from 'lucide-react'
import { TOOLTIPS } from '@/lib/tooltips'

interface TemplateData {
  id?: string
  name: string
  description: string | null
  utm_source: string
  utm_medium: string
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
}

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: TemplateData) => Promise<void>
  onUpdate?: (id: string, data: TemplateData) => Promise<void>
  editingTemplate?: TemplateData | null
}

const emptyFormData: TemplateData = {
  name: '',
  description: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  editingTemplate,
}: CreateTemplateDialogProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState<TemplateData>(emptyFormData)
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!editingTemplate?.id

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        id: editingTemplate.id,
        name: editingTemplate.name || '',
        description: editingTemplate.description || '',
        utm_source: editingTemplate.utm_source || '',
        utm_medium: editingTemplate.utm_medium || '',
        utm_campaign: editingTemplate.utm_campaign || '',
        utm_term: editingTemplate.utm_term || '',
        utm_content: editingTemplate.utm_content || '',
      })
    } else {
      setFormData(emptyFormData)
    }
  }, [editingTemplate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (isEditing && onUpdate && formData.id) {
        await onUpdate(formData.id, formData)
      } else {
        await onCreate(formData)
      }
      setFormData(emptyFormData)
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('templates.editTemplate') : t('templates.createTemplate')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name">{t('templates.templateName')}</Label>
              <InfoTooltipRich
                title={TOOLTIPS.templateName.title}
                description={TOOLTIPS.templateName.description}
                icon="info"
              />
            </div>
            <Input
              id="name"
              placeholder={t('templates.templateNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('templates.descriptionOptional')}</Label>
            <Textarea
              id="description"
              placeholder={t('templates.descriptionPlaceholder')}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Parameters Header */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">{t('templates.utmParameters')}</h3>
          </div>

          {/* UTM Source */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_source">Source *</Label>
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
              required
            />
          </div>

          {/* UTM Medium */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="utm_medium">Medium *</Label>
              <InfoTooltipRich
                title={TOOLTIPS.utmMedium.title}
                description={TOOLTIPS.utmMedium.description}
                icon="help"
              />
            </div>
            <Input
              id="utm_medium"
              placeholder="cpc, email, social, referral"
              value={formData.utm_medium}
              onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
              required
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
              value={formData.utm_campaign || ''}
              onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
            />
          </div>

          {/* UTM Term */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
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
              value={formData.utm_term || ''}
              onChange={(e) => setFormData({ ...formData, utm_term: e.target.value })}
            />
          </div>

          {/* UTM Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              value={formData.utm_content || ''}
              onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
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
              disabled={isLoading || !formData.name || !formData.utm_source || !formData.utm_medium}
            >
              {isLoading ? (isEditing ? t('common.saving') : t('common.creating')) : (isEditing ? t('common.save') : t('templates.createTemplate'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
