import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  Plus,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'

export function PWAInstallButton() {
  const { t } = useI18n()
  const { isInstallable, isInstalled, isIOS, isMobile, installPWA } = usePWAInstall()
  const [showIOSDialog, setShowIOSDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Se já está instalado, não mostra o botão
  if (isInstalled) {
    return null
  }

  const handleInstall = async () => {
    const result = await installPWA()

    if (result.success) {
      toast.success(t('pwa.installSuccess'), {
        description: t('pwa.addedToHome'),
      })
    } else if (result.reason === 'ios') {
      setShowIOSDialog(true)
    } else if (result.reason === 'dismissed') {
      toast.info(t('pwa.installCanceled'), {
        description: t('pwa.installLater'),
      })
    }
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative h-7 gap-1.5 text-xs"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Download className="h-3.5 w-3.5" />
            </motion.div>
            <span className="hidden sm:inline">{t('pwa.installApp')}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('pwa.installIsacar')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Opção Mobile */}
          <DropdownMenuItem
            onClick={handleInstall}
            className="cursor-pointer gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{t('pwa.mobile')}</span>
              <span className="text-[10px] text-muted-foreground">
                {isIOS ? 'iPhone / iPad' : t('pwa.mobileDesc')}
              </span>
            </div>
          </DropdownMenuItem>

          {/* Opção Desktop */}
          <DropdownMenuItem
            onClick={handleInstall}
            className="cursor-pointer gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{t('pwa.desktop')}</span>
              <span className="text-[10px] text-muted-foreground">
                {t('pwa.desktopDesc')}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">
              {t('pwa.installInfo')}
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de instruções para iOS */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              {t('pwa.installIOS')}
            </DialogTitle>
            <DialogDescription>
              {t('pwa.iosInstructions')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Passo 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">{t('pwa.step1')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('pwa.step1Desc')}{' '}
                  <Share className="inline h-4 w-4" />
                </p>
              </div>
            </motion.div>

            {/* Passo 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">{t('pwa.step2')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('pwa.step2Desc')}{' '}
                  <Plus className="inline h-4 w-4" />
                </p>
              </div>
            </motion.div>

            {/* Passo 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">{t('pwa.step3')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('pwa.step3Desc')}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowIOSDialog(false)}>
              <Check className="mr-2 h-4 w-4" />
              {t('pwa.understood')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
