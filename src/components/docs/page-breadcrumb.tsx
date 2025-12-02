import { Button } from '@/components/ui/button'
import { ChevronRight, ArrowLeft, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageBreadcrumbProps {
  cardName: string
  pageName: string
  onBack: () => void
  className?: string
}

export const PageBreadcrumb = ({ 
  cardName, 
  pageName, 
  onBack,
  className 
}: PageBreadcrumbProps) => {
  return (
    <div className={cn("flex items-center gap-1 sm:gap-2 text-sm", className)}>
      {/* Botão Voltar (mobile) */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 sm:hidden"
        onClick={onBack}
        title="Voltar para lista"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Breadcrumb Desktop */}
      <div className="hidden sm:flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          {cardName}
        </Button>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Nome da página atual */}
      <span className="text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-none">
        {pageName || 'Sem título'}
      </span>
    </div>
  )
}
