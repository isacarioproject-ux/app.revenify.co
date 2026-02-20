import { useState, useRef } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Download, Copy, Check, QrCode, Upload, X, Palette, ImageIcon } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullUrl = getShortLinkUrl(shortLink.short_code, shortLink.custom_domain)

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(fullUrl)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=png`
  const qrCodeSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(fullUrl)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}&format=svg`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('URL copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

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

  const generateQRWithLogo = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas not supported')

        canvas.width = size
        canvas.height = size

        const qrImg = new window.Image()
        qrImg.crossOrigin = 'anonymous'

        await new Promise<void>((res, rej) => {
          qrImg.onload = () => res()
          qrImg.onerror = () => rej(new Error('Failed to load QR'))
          qrImg.src = qrCodeUrl
        })

        ctx.drawImage(qrImg, 0, 0, size, size)

        if (logoUrl) {
          const logoImg = new window.Image()
          await new Promise<void>((res, rej) => {
            logoImg.onload = () => res()
            logoImg.onerror = () => rej(new Error('Failed to load logo'))
            logoImg.src = logoUrl
          })

          const logoSize = size * 0.2
          const logoX = (size - logoSize) / 2
          const logoY = (size - logoSize) / 2

          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.roundRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8)
          ctx.fill()
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        }

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
        const response = await fetch(qrCodeSvgUrl)
        blob = await response.blob()
        filename += '.svg'
      } else {
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

  const presetColors = [
    { qr: '#000000', bg: '#ffffff' },
    { qr: '#1a1a2e', bg: '#eaeaea' },
    { qr: '#0066cc', bg: '#ffffff' },
    { qr: '#059669', bg: '#ffffff' },
    { qr: '#7c3aed', bg: '#ffffff' },
    { qr: '#dc2626', bg: '#ffffff' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-full max-h-full h-full w-full rounded-none border-0 sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:rounded-xl sm:border sm:!max-w-[700px] sm:h-auto sm:max-h-[90vh] lg:!max-w-[750px] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('qrCode.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('qrCode.title')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 sm:py-4 px-0 sm:px-1">
          {/* Layout: QR left, Form right on desktop — stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            {/* Left Column - QR Code Preview */}
            <div className="md:w-[240px] shrink-0 flex flex-col gap-3 md:gap-4">
              {/* QR preview — fixed height */}
              <div className="flex justify-center items-center h-[170px]">
                <div className="p-3 bg-white rounded-xl shadow-sm border relative">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={Math.min(size, 132)}
                    height={Math.min(size, 132)}
                    className="max-w-[132px] max-h-[132px] object-contain"
                  />
                  {logoUrl && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ padding: '12px' }}
                    >
                      <div className="bg-white p-1 rounded-lg shadow-sm" style={{ width: '20%', height: '20%' }}>
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* URL Display */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('qrCode.shortLink')}</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={fullUrl}
                    readOnly
                    className="font-mono text-xs h-8"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    onClick={copyUrl}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Download Button — desktop only */}
              <div className="hidden md:block">
                <Button
                  className="w-full h-9 text-sm"
                  onClick={downloadQRCode}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" />
                      <span>{t('qrCode.generating')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      <span>{t('qrCode.download')} ({downloadFormat.toUpperCase()})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column - Tabs Form */}
            <div className="flex-1 min-w-0">
              <Tabs defaultValue="style" className="w-full">
                {/* Underline tabs — standard app pattern */}
                <TabsList className="h-auto p-0 bg-transparent rounded-none inline-flex gap-4 border-b mb-3 w-full">
                  <TabsTrigger
                    value="style"
                    className="rounded-none border-0 border-b-2 border-transparent
                               data-[state=active]:border-b-black dark:data-[state=active]:border-b-white
                               data-[state=active]:!bg-transparent
                               !bg-transparent px-0 pb-2 pt-0
                               text-muted-foreground
                               data-[state=active]:text-foreground
                               hover:text-foreground transition-colors
                               gap-1.5 text-sm"
                  >
                    <Palette className="h-3.5 w-3.5" />
                    {t('qrCode.style')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="logo"
                    className="rounded-none border-0 border-b-2 border-transparent
                               data-[state=active]:border-b-black dark:data-[state=active]:border-b-white
                               data-[state=active]:!bg-transparent
                               !bg-transparent px-0 pb-2 pt-0
                               text-muted-foreground
                               data-[state=active]:text-foreground
                               hover:text-foreground transition-colors
                               gap-1.5 text-sm"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {t('qrCode.logo')}
                  </TabsTrigger>
                </TabsList>

                {/* Fixed-height container — prevents dialog from resizing on tab switch */}
                <div className="min-h-[260px]">
                  <TabsContent value="style" className="space-y-3 mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Size */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('qrCode.size')}</Label>
                        <select
                          value={size}
                          onChange={(e) => setSize(Number(e.target.value))}
                          className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value={128}>{t('qrCode.sizeSmall')}</option>
                          <option value={256}>{t('qrCode.sizeMedium')}</option>
                          <option value={512}>{t('qrCode.sizeLarge')}</option>
                          <option value={1024}>{t('qrCode.sizeHD')}</option>
                        </select>
                      </div>

                      {/* Colors side by side */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('qrCode.colors')}</Label>
                        <div className="flex gap-1.5">
                          <div className="flex-1">
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="w-full h-8 p-0.5 cursor-pointer"
                              title={t('qrCode.qrColor')}
                            />
                            <p className="text-[9px] text-muted-foreground text-center mt-0.5">{t('qrCode.qrColor')}</p>
                          </div>
                          <div className="flex-1">
                            <Input
                              type="color"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-full h-8 p-0.5 cursor-pointer"
                              title={t('qrCode.bgColor')}
                            />
                            <p className="text-[9px] text-muted-foreground text-center mt-0.5">{t('qrCode.bgColor')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Colors */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('qrCode.quickColors')}</Label>
                      <div className="flex gap-1.5">
                        {presetColors.map((preset, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setColor(preset.qr)
                              setBgColor(preset.bg)
                            }}
                            className={cn(
                              'w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center',
                              color === preset.qr && bgColor === preset.bg
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                : 'border-2 border-border hover:scale-105'
                            )}
                            style={{ backgroundColor: preset.qr }}
                            title={`QR: ${preset.qr} / BG: ${preset.bg}`}
                          >
                            {color === preset.qr && bgColor === preset.bg && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Download Format — compact */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('qrCode.downloadFormat')}</Label>
                      <div className="flex gap-1.5">
                        {[
                          { value: 'png' as const, label: 'PNG' },
                          { value: 'jpg' as const, label: 'JPG' },
                          { value: 'svg' as const, label: 'SVG', disabled: !!logoUrl },
                        ].map((fmt) => (
                          <button
                            key={fmt.value}
                            onClick={() => !fmt.disabled && setDownloadFormat(fmt.value)}
                            disabled={fmt.disabled}
                            className={cn(
                              'flex-1 h-7 rounded-md border text-[11px] font-medium transition-colors',
                              downloadFormat === fmt.value
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border hover:bg-muted',
                              fmt.disabled && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="logo" className="space-y-3 mt-0">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('qrCode.logoOptional')}</Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('qrCode.logoDesc')}
                      </p>
                    </div>

                    {logoUrl ? (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-muted/30">
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="w-10 h-10 object-contain rounded border bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{logoFile?.name || 'Logo'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={removeLogo} className="h-7 w-7 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                        <p className="text-xs font-medium">{t('qrCode.clickToUpload')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t('qrCode.fileTypes')}</p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {/* Download Format — compact (same in both tabs for consistency) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('qrCode.downloadFormat')}</Label>
                      <div className="flex gap-1.5">
                        {[
                          { value: 'png' as const, label: 'PNG' },
                          { value: 'jpg' as const, label: 'JPG' },
                          { value: 'svg' as const, label: 'SVG', disabled: !!logoUrl },
                        ].map((fmt) => (
                          <button
                            key={fmt.value}
                            onClick={() => !fmt.disabled && setDownloadFormat(fmt.value)}
                            disabled={fmt.disabled}
                            className={cn(
                              'flex-1 h-7 rounded-md border text-[11px] font-medium transition-colors',
                              downloadFormat === fmt.value
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border hover:bg-muted',
                              fmt.disabled && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* Title if exists */}
              {shortLink.title && (
                <div className="text-center p-2.5 rounded-lg bg-muted/30 mt-3">
                  <p className="text-xs font-medium">{shortLink.title}</p>
                  {shortLink.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {shortLink.description}
                    </p>
                  )}
                </div>
              )}

              {/* Download Button — mobile only */}
              <div className="md:hidden mt-3">
                <Button
                  className="w-full h-9 text-sm"
                  onClick={downloadQRCode}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" />
                      <span>{t('qrCode.generating')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      <span>{t('qrCode.download')} ({downloadFormat.toUpperCase()})</span>
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
