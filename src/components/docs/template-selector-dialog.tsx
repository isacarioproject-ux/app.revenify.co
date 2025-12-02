import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { templates } from '@/lib/docs/templates';
import { Template } from '@/types/docs';

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onTemplateSelect: (template: Template) => void;
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  projectId,
  onTemplateSelect,
}: TemplateSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'business' | 'personal' | 'education'>('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory || template.category === 'all';
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: 'Todos',
      business: 'Negócios',
      personal: 'Pessoal',
      education: 'Educação',
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Escolher Template</DialogTitle>
          <DialogDescription className="sr-only">
            Selecione um template para criar uma nova página
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar templates..."
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList variant="grid" className="grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="business">Negócios</TabsTrigger>
            <TabsTrigger value="personal">Pessoal</TabsTrigger>
            <TabsTrigger value="education">Educação</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onTemplateSelect(template)}
                  className="text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="truncate">{template.name}</h4>
                        {template.category !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum template encontrado
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}