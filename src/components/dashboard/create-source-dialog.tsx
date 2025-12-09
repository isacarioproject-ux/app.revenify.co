import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
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
    toast.success('URL copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Digite um nome para a fonte')
      return
    }
    
    onSourceCreated?.({
      ...formData,
      url: generatedUrl(),
    })
    
    toast.success('Fonte criada com sucesso!')
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
            Nova Fonte
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Fonte</DialogTitle>
          <DialogDescription>
            Crie uma URL rastreável para suas campanhas de marketing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Fonte *</Label>
            <Input
              id="name"
              placeholder="Ex: Campanha Black Friday"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem (utm_source)</Label>
              <Select
                value={formData.utm_source}
                onValueChange={(value) => setFormData({ ...formData, utm_source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
              <Label>Mídia (utm_medium)</Label>
              <Select
                value={formData.utm_medium}
                onValueChange={(value) => setFormData({ ...formData, utm_medium: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <Label htmlFor="campaign">Campanha (utm_campaign)</Label>
            <Input
              id="campaign"
              placeholder="Ex: black-friday-2024"
              value={formData.utm_campaign}
              onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo (utm_content)</Label>
            <Input
              id="content"
              placeholder="Ex: banner-hero"
              value={formData.utm_content}
              onChange={(e) => setFormData({ ...formData, utm_content: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>URL Gerada</Label>
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
            Cancelar
          </Button>
          <Button onClick={handleCreate}>
            Criar Fonte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
