import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ImagePlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceCoverSelectorProps {
  currentCover?: string | null
  onSelectCover: (coverUrl: string) => void
  onRemoveCover?: () => void
}

// Capas prepopuladas bonitas e originais (sem autor - usando gradientes e padrões)
const PREPOPULATED_COVERS = [
  // Gradientes modernos
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  
  // Padrões geométricos
  'radial-gradient(circle at 20% 50%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 80%, #764ba2 0%, transparent 50%), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'radial-gradient(circle at 40% 40%, #f093fb 0%, transparent 50%), linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'radial-gradient(circle at 60% 60%, #4facfe 0%, transparent 50%), linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  
  // Padrões de ondas
  'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
  'linear-gradient(45deg, #f093fb 0%, #f5576c 50%, #f093fb 100%)',
  'linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #4facfe 100%)',
  
  // Cores sólidas modernas
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#00f2fe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
]

export const FinanceCoverSelector = ({
  currentCover,
  onSelectCover,
  onRemoveCover,
}: FinanceCoverSelectorProps) => {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelectCover = async (cover: string) => {
    setLoading(true)
    try {
      // Se for um gradiente, precisamos criar uma imagem ou salvar como string
      // Por enquanto, vamos salvar a string do gradiente diretamente
      onSelectCover(cover)
      setOpen(false)
    } catch (error) {
      console.error('Error selecting cover:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title={t('finance.cover.addCover')}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4" 
        align="start"
        side="bottom"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('finance.cover.selectCover')}</h4>
            {currentCover && onRemoveCover && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onRemoveCover()
                  setOpen(false)
                }}
              >
                {t('finance.cover.remove')}
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
              {PREPOPULATED_COVERS.map((cover, index) => {
                const isSelected = currentCover === cover
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelectCover(cover)}
                    className={cn(
                      "relative h-16 w-full rounded-md overflow-hidden border-2 transition-all",
                      "hover:scale-105 hover:shadow-md",
                      isSelected ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
                    )}
                    style={{
                      background: cover.startsWith('linear-gradient') || cover.startsWith('radial-gradient')
                        ? cover
                        : cover,
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20"
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

