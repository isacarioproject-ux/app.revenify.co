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
import { Download, Copy, Check, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import type { ShortLink } from '@/hooks/use-short-links'
import { getShortLinkUrl } from '@/lib/config'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortLink: ShortLink
}

export function QRCodeDialog({
  open,
  onOpenChange,
  shortLink,
}: QRCodeDialogProps) {
  const [copied, setCopied] = useState(false)
  const [size, setSize] = useState(256)
  const [color, setColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')

  // Usa a URL funcional (Edge Function ou domínio customizado)
  const fullUrl = getShortLinkUrl(shortLink.short_code, shortLink.custom_domain)

  // Gerar QR Code usando API externa (qrserver.com)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(fullUrl)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('URL copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${shortLink.short_code}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('QR Code baixado!')
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Erro ao baixar QR Code')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Preview */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                width={size}
                height={size}
                className="max-w-full h-auto"
              />
            </div>
          </div>

          {/* URL Display */}
          <div className="space-y-2">
            <Label>Link Curto</Label>
            <div className="flex gap-2">
              <Input
                value={fullUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Tamanho</Label>
              <select
                id="size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value={128}>128px</option>
                <option value={256}>256px</option>
                <option value={512}>512px</option>
                <option value={1024}>1024px</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                  title="Cor de fundo"
                />
              </div>
            </div>
          </div>

          {/* Title if exists */}
          {shortLink.title && (
            <div className="text-center">
              <p className="text-sm font-medium">{shortLink.title}</p>
              {shortLink.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {shortLink.description}
                </p>
              )}
            </div>
          )}

          {/* Download Button */}
          <Button
            className="w-full"
            onClick={downloadQRCode}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
