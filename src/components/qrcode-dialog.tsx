import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Copy, Check, QrCode, Image, FileImage, Upload, X, Palette, ImageIcon, FileCode } from 'lucide-react'
import { toast } from 'sonner'
import type { ShortLink } from '@/hooks/use-short-links'
import { getShortLinkUrl } from '@/lib/config'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

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
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [size, setSize] = useState(256)
  const [color, setColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpg'>('png')
  const [downloading, setDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Usa a URL funcional (Edge Function ou domínio customizado)
  const fullUrl = getShortLinkUrl(shortLink.short_code, shortLink.custom_domain)

  // Gerar QR Code usando API externa (qrserver.com)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(fullUrl)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=png`
  const qrCodeSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(fullUrl)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=svg`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('URL copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo deve ter no máximo 2MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoUrl(null)
    setLogoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Generate QR with logo using canvas
  const generateQRWithLogo = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas not supported')

        canvas.width = size
        canvas.height = size

        // Load QR code image
        const qrImg = new window.Image()
        qrImg.crossOrigin = 'anonymous'
        
        await new Promise<void>((res, rej) => {
          qrImg.onload = () => res()
          qrImg.onerror = () => rej(new Error('Failed to load QR'))
          qrImg.src = qrCodeUrl
        })

        // Draw QR code
        ctx.drawImage(qrImg, 0, 0, size, size)

        // Draw logo if exists
        if (logoUrl) {
          const logoImg = new window.Image()
          await new Promise<void>((res, rej) => {
            logoImg.onload = () => res()
            logoImg.onerror = () => rej(new Error('Failed to load logo'))
            logoImg.src = logoUrl
          })

          // Logo size (20% of QR code)
          const logoSize = size * 0.2
          const logoX = (size - logoSize) / 2
          const logoY = (size - logoSize) / 2

          // Draw white background for logo
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.roundRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8)
          ctx.fill()

          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        }

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png', 0.95)
      } catch (error) {
        reject(error)
      }
    })
  }

  const downloadQRCode = async () => {
    setDownloading(true)
    try {
      let blob: Blob
      let filename = `qrcode-${shortLink.short_code}`

      if (downloadFormat === 'svg' && !logoUrl) {
        // Download SVG directly (no logo support)
        const response = await fetch(qrCodeSvgUrl)
        blob = await response.blob()
        filename += '.svg'
      } else {
        // Generate with canvas (supports logo)
        blob = await generateQRWithLogo()
        filename += downloadFormat === 'jpg' ? '.jpg' : '.png'
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('QR Code baixado!')
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Erro ao baixar QR Code')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[750px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('qrCode.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Layout: QR à esquerda, Formulário à direita em desktop/tablet */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Coluna Esquerda - QR Code Preview */}
            <div className="md:w-[260px] shrink-0 flex flex-col gap-6">
              {/* Container fixo para o QR - altura fixa para não mover o botão */}
              <div className="flex justify-center items-center h-[180px]">
                <div className="p-3 bg-white rounded-lg shadow-sm border relative">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={Math.min(size, 140)}
                    height={Math.min(size, 140)}
                    className="max-w-[140px] max-h-[140px] object-contain"
                  />
                  {logoUrl && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ padding: '16px' }}
                    >
                      <div className="bg-white p-1 rounded-lg shadow-sm" style={{ width: '20%', height: '20%' }}>
                        <img 
                          src={logoUrl} 
                          alt="Logo" 
                          className="w-full h-full object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* URL Display */}
              <div className="space-y-2">
                <Label>{t('qrCode.shortLink')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={fullUrl}
                    readOnly
                    className="font-mono text-xs"
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

              {/* Download Button - abaixo da URL em desktop */}
              <div className="hidden md:block mt-6">
                <Button
                  className="w-full"
                  onClick={downloadQRCode}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('qrCode.generating')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('qrCode.download')} ({downloadFormat.toUpperCase()})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Coluna Direita - Formulário */}
            <div className="flex-1 space-y-5">
              <Tabs defaultValue="style" className="w-full">
                <TabsList className="h-auto p-0 bg-transparent rounded-none inline-flex gap-4 border-b mb-6">
                  <TabsTrigger
                    value="style"
                    className="rounded-none border-0 border-b-[3px] border-transparent
                               data-[state=active]:border-b-primary
                               data-[state=active]:!bg-transparent
                               !bg-transparent px-0 pb-2 pt-0
                               text-muted-foreground
                               data-[state=active]:text-foreground
                               hover:text-foreground transition-colors
                               gap-2 text-sm font-medium"
                  >
                    <Palette className="h-4 w-4" />
                    {t('qrCode.style')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="logo"
                    className="rounded-none border-0 border-b-[3px] border-transparent
                               data-[state=active]:border-b-primary
                               data-[state=active]:!bg-transparent
                               !bg-transparent px-0 pb-2 pt-0
                               text-muted-foreground
                               data-[state=active]:text-foreground
                               hover:text-foreground transition-colors
                               gap-2 text-sm font-medium"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {t('qrCode.logo')}
                  </TabsTrigger>
                </TabsList>

            <TabsContent value="style" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">{t('qrCode.size')}</Label>
                  <select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value={128}>{t('qrCode.sizeSmall')}</option>
                    <option value={256}>{t('qrCode.sizeMedium')}</option>
                    <option value={512}>{t('qrCode.sizeLarge')}</option>
                    <option value={1024}>{t('qrCode.sizeHD')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('qrCode.colors')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full h-12 p-1 cursor-pointer border-2 rounded-lg hover:border-primary/50 transition-colors"
                          title={t('qrCode.qrColor')}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center font-medium">
                        {t('qrCode.qrColor')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-full h-12 p-1 cursor-pointer border-2 rounded-lg hover:border-primary/50 transition-colors"
                          title={t('qrCode.bgColor')}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center font-medium">
                        {t('qrCode.bgColor')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('qrCode.quickColors')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { qr: '#000000', bg: '#ffffff', name: t('qrCode.classic') },
                    { qr: '#1a1a2e', bg: '#eaeaea', name: t('qrCode.dark') },
                    { qr: '#0066cc', bg: '#ffffff', name: t('qrCode.blue') },
                    { qr: '#059669', bg: '#ffffff', name: t('qrCode.green') },
                    { qr: '#7c3aed', bg: '#ffffff', name: t('qrCode.purple') },
                    { qr: '#dc2626', bg: '#ffffff', name: t('qrCode.red') },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setColor(preset.qr)
                        setBgColor(preset.bg)
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                        'hover:border-primary/50 hover:bg-muted/50',
                        color === preset.qr && bgColor === preset.bg && 'border-primary bg-primary/5 shadow-sm'
                      )}
                      title={preset.name}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                        style={{ backgroundColor: preset.qr }}
                      />
                      <span className="text-xs font-medium truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>{t('qrCode.logoOptional')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('qrCode.logoDesc')}
                </p>
              </div>

              {logoUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="w-12 h-12 object-contain rounded border bg-white"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{logoFile?.name || 'Logo'}</p>
                    <p className="text-xs text-muted-foreground">
                      {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={removeLogo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{t('qrCode.clickToUpload')}</p>
                  <p className="text-xs text-muted-foreground">{t('qrCode.fileTypes')}</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              </TabsContent>
            </Tabs>

            {/* Title if exists */}
            {shortLink.title && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">{shortLink.title}</p>
                {shortLink.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {shortLink.description}
                  </p>
                )}
              </div>
            )}

            {/* Download Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('qrCode.downloadFormat')}</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: 'png' as const,
                    label: 'PNG',
                    icon: Image,
                    desc: t('qrCode.bestQuality'),
                    gradient: 'from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-200 dark:border-blue-800'
                  },
                  {
                    value: 'jpg' as const,
                    label: 'JPG',
                    icon: FileImage,
                    desc: t('qrCode.smallerSize'),
                    gradient: 'from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border-green-200 dark:border-green-800'
                  },
                  {
                    value: 'svg' as const,
                    label: 'SVG',
                    icon: FileCode,
                    desc: t('qrCode.vector'),
                    disabled: !!logoUrl,
                    gradient: 'from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-200 dark:border-purple-800'
                  },
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => !format.disabled && setDownloadFormat(format.value)}
                    disabled={format.disabled}
                    className={cn(
                      'group relative p-4 rounded-xl border-2 transition-all duration-200',
                      'flex flex-col items-center justify-center gap-2',
                      downloadFormat === format.value
                        ? `bg-gradient-to-br ${format.gradient} ring-2 ring-primary/20 shadow-md`
                        : `bg-gradient-to-br ${format.gradient} hover:shadow-md`,
                      format.disabled && 'opacity-40 cursor-not-allowed hover:shadow-none'
                    )}
                    title={format.disabled ? t('qrCode.svgNoLogo') : format.desc}
                  >
                    {/* Icon Container */}
                    <div className={cn(
                      'p-2 rounded-lg transition-colors',
                      downloadFormat === format.value ? 'bg-primary/10' : 'bg-background/50'
                    )}>
                      <format.icon className={cn(
                        'h-5 w-5 transition-colors',
                        downloadFormat === format.value ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <p className={cn(
                        'text-sm font-semibold transition-colors',
                        downloadFormat === format.value ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {format.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {format.desc}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {downloadFormat === format.value && (
                      <div className="absolute top-2 right-2">
                        <div className="h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button - visível apenas no mobile */}
            <div className="md:hidden">
              <Button
                className="w-full"
                onClick={downloadQRCode}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('qrCode.generating')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('qrCode.download')} ({downloadFormat.toUpperCase()})
                  </>
                )}
              </Button>
            </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
