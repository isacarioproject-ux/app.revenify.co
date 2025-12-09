import { useState } from 'react'
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
import { TOOLTIPS } from '@/lib/tooltips'
import { Link2, Globe, Megaphone, Tag, Calendar } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
  }) => Promise<any>
}

export function CreateShortLinkDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateShortLinkDialogProps) {
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
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await onCreate(formData)
      if (result) {
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Criar Link Curto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Destination URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="destination_url">URL de Destino *</Label>
              <InfoTooltipRich
                title="URL de Destino"
                description="A URL completa para onde o link curto vai redirecionar."
                icon="info"
              />
            </div>
            <Input
              id="destination_url"
              type="url"
              placeholder="https://seusite.com/pagina"
              value={formData.destination_url}
              onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
              required
            />
            {formData.destination_url && !isValidUrl(formData.destination_url) && (
              <p className="text-xs text-destructive">URL inválida</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              placeholder="Ex: Campanha Black Friday"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Notas sobre este link..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* UTM Parameters - Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="utm">
              <AccordionTrigger className="text-sm font-medium">
                Parâmetros UTM (opcional)
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

            <AccordionItem value="advanced">
              <AccordionTrigger className="text-sm font-medium">
                Configurações Avançadas
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Expiration */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="expires_at">Data de Expiração</Label>
                    <InfoTooltipRich
                      title="Expiração"
                      description="Após esta data, o link não funcionará mais."
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.destination_url || !isValidUrl(formData.destination_url)}
            >
              {isLoading ? 'Criando...' : 'Criar Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
