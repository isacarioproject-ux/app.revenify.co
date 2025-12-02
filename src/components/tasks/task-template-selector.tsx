import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { taskTemplates } from '@/lib/tasks/task-templates';
import { TaskTemplate } from '@/types/tasks';
import { Search, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';

interface TaskTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: TaskTemplate) => void;
}

export function TaskTemplateSelector({ open, onClose, onSelect }: TaskTemplateSelectorProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'todas' | 'pessoal' | 'trabalho' | 'ti'>('todas');

  const filteredTemplates = taskTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                         template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'todas' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: TaskTemplate) => {
    onSelect(template);
    onClose();
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1100px] w-[88vw] sm:!max-w-[1100px] h-[85vh] md:h-[80vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Ícone Animado */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <CheckSquare className="size-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <DialogTitle>{t('tasks.template.title')}</DialogTitle>
              <DialogDescription>
                {t('tasks.template.description')}
              </DialogDescription>
            </div>
            {/* Badge contador */}
            {filteredTemplates.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {filteredTemplates.length}
                </Badge>
              </motion.div>
            )}
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative px-6 pb-4">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder={t('tasks.template.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)} className="flex-1 flex flex-col overflow-hidden px-6">
          <TabsList variant="fullWidth" className="mb-4">
            <TabsTrigger value="todas">{t('tasks.template.all')}</TabsTrigger>
            <TabsTrigger value="pessoal">{t('tasks.template.personal')}</TabsTrigger>
            <TabsTrigger value="trabalho">{t('tasks.template.work')}</TabsTrigger>
            <TabsTrigger value="ti">{t('tasks.template.it')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="flex-1 overflow-auto pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {filteredTemplates.map((template, index) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, borderColor: "rgb(59, 130, 246)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(template)}
                    className="text-left p-5 border rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                  >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 font-semibold text-[15px] dark:text-gray-100">{template.name}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                          {template.category === 'pessoal' ? t('tasks.template.personal') :
                           template.category === 'trabalho' ? t('tasks.template.work') :
                           template.category === 'ti' ? t('tasks.template.it') :
                           template.category === 'geral' ? t('tasks.template.general') :
                           template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
              </motion.div>
            </AnimatePresence>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>{t('tasks.template.noResults')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}