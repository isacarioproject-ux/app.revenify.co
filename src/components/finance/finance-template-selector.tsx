import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, Sparkles, FolderKanban } from 'lucide-react'
import { FINANCE_TEMPLATES, getCategoryLabel, FinanceTemplate } from '@/lib/finance-templates'
import { useI18n } from '@/hooks/use-i18n'

interface FinanceTemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: FinanceTemplate) => void
  projects?: any[]
  selectedProjectId?: string
  onProjectChange?: (projectId: string) => void
}

export const FinanceTemplateSelector = ({
  open,
  onOpenChange,
  onSelectTemplate,
  projects = [],
  selectedProjectId = '',
  onProjectChange,
}: FinanceTemplateSelectorProps) => {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Scroll fix - v2

  const filteredTemplates = FINANCE_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', label: t('finance.templates.all') },
    { id: 'personal', label: t('finance.templates.personal') },
    { id: 'business', label: t('finance.templates.business') },
    { id: 'investment', label: t('finance.templates.investment') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {t('finance.templates.title')}
          </DialogTitle>
          <DialogDescription>
            {t('finance.templates.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Busca + Projeto */}
        <div className="px-6 py-3 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('finance.templates.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Seletor de Projeto */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                {t('finance.templates.linkProject')}
              </Label>
              <Select value={selectedProjectId} onValueChange={onProjectChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('finance.templates.noProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('finance.templates.noProject')}</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Categorias */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b border-border flex-shrink-0">
            <TabsList variant="grid" className="grid-cols-4">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Grid responsivo: 1 col mobile, 2 cols tablet, 3 cols desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template)
                    onOpenChange(false)
                  }}
                  className="group text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-all min-h-[160px] flex items-center justify-center"
                >
                  <div className="flex flex-col gap-3 w-full">
                    {/* Ícone centralizado */}
                    <div className="text-5xl text-center group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="text-center">
                      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                        {template.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {template.description}
                      </p>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">{t('finance.templates.noResults')}</p>
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
