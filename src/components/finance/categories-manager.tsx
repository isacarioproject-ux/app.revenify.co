import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal' // Drawer em mobile, Dialog em desktop
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Pencil,
  GripVertical,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FinanceCategory } from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { useI18n } from '@/hooks/use-i18n'

interface CategoriesManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export const CategoriesManager = ({
  open,
  onOpenChange,
  onUpdate,
}: CategoriesManagerProps) => {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspace()
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    color: '#ef4444',
    icon: '💰',
  })
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  // Ícones disponíveis
  const availableIcons = [
    '💰', '💵', '💳', '💸', '🏦', '📊', '📈', '📉', '💼', '🎯',
    '🍔', '🍕', '🛒', '🏠', '🚗', '⚡', '💡', '📱', '🎮', '🎬',
    '✈️', '🏥', '💊', '👕', '👟', '📚', '🎓', '🏋️', '⚽', '🎨',
    '🎵', '🍺', '☕', '🍰', '🎁', '💎', '🔧', '🖥️', '📦', '🌟',
  ]

  useEffect(() => {
    if (open) fetchCategories()
  }, [open])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (currentWorkspace) {
        query = query.eq('workspace_id', currentWorkspace.id)
      } else {
        query = query.is('workspace_id', null)
      }

      const { data, error } = await query
      if (error) throw error

      setCategories(data || [])
    } catch (err: any) {
      toast.error(t('finance.categories.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // ✅ Campos válidos na tabela: id, user_id, workspace_id, name, type, color, icon, monthly_budget, parent_category_id
      const { error } = await supabase.from('finance_categories').insert({
        user_id: user.id,
        workspace_id: currentWorkspace?.id || null,
        name: newCategory.name.trim(),
        type: newCategory.type,
        color: newCategory.color,
        icon: newCategory.icon || null,
      })

      if (error) throw error

      setNewCategory({
        name: '',
        description: '',
        type: 'expense',
        color: '#ef4444',
        icon: '💰',
      })

      fetchCategories()
      onUpdate()
      toast.success(t('finance.categories.added'))
    } catch (err: any) {
      toast.error(t('finance.categories.errorAdd'), {
        description: err.message,
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('finance.categories.confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchCategories()
      onUpdate()
      toast.success(t('finance.categories.deleted'))
    } catch (err: any) {
      toast.error(t('finance.categories.errorDelete'), {
        description: err.message,
      })
    }
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent 
        className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col"
        drawerProps={{
          className: "h-[96vh] flex flex-col"
        }}
      >
        <ModalHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
          <ModalTitle className="text-base font-semibold">{t('finance.categories.title')}</ModalTitle>
        </ModalHeader>

        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Form nova categoria */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                {/* Seletor de Ícone */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-9 p-0 flex-shrink-0"
                      type="button"
                    >
                      <span className="text-base">{newCategory.icon || '😀'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-8 gap-1">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewCategory({ ...newCategory, icon })}
                          className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
                          type="button"
                        >
                          <span className="text-base">{icon}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="flex-1 space-y-1.5">
                <Input
                  placeholder={t('finance.categories.namePlaceholder')}
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                    className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategory.name.trim()) {
                      handleAddCategory()
                    }
                  }}
                />
                  <Input
                    placeholder={t('finance.categories.descriptionPlaceholder')}
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newCategory.type === 'income' ? 'primary' : 'outline'}
                  className="flex-1 sm:flex-none h-9"
                  onClick={() =>
                    setNewCategory({ ...newCategory, type: 'income', color: '#10b981' })
                  }
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('finance.filters.income')}</span>
                </Button>
                <Button
                  size="sm"
                  variant={newCategory.type === 'expense' ? 'primary' : 'outline'}
                  className="flex-1 sm:flex-none h-9"
                  onClick={() =>
                    setNewCategory({ ...newCategory, type: 'expense', color: '#ef4444' })
                  }
                >
                  <TrendingDown className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t('finance.filters.expense')}</span>
                </Button>
                
                <Button 
                  onClick={handleAddCategory} 
                  size="sm"
                  disabled={!newCategory.name.trim()}
                  className="h-9"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1.5">{t('finance.table.add')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                    <Skeleton className="h-4 flex-1 max-w-[200px]" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                    <Skeleton className="h-4 flex-1 max-w-[200px]" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
          {/* Categorias de Receita */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-medium">{t('finance.charts.income')}</h3>
              <Badge variant="secondary" className="text-xs">{incomeCategories.length}</Badge>
            </div>
            
            {incomeCategories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  {t('finance.categories.noIncome')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('finance.categories.addIncome')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-all"
                  >
                    {editingCategory === cat.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder={t('finance.categories.descriptionPlaceholder')}
                          className="h-7 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 text-xs"
                            onClick={async () => {
                              if (!editingCategory) return
                              try {
                                const { error } = await supabase
                                  .from('finance_categories')
                                  .update({
                                    name: editForm.name.trim(),
                                    description: editForm.description.trim() || null,
                                  })
                                  .eq('id', editingCategory)

                                if (error) throw error

                                toast.success(t('finance.categories.updated'))
                                setEditingCategory(null)
                                fetchCategories()
                                onUpdate()
                              } catch (err: any) {
                                toast.error(t('finance.categories.errorUpdate'), {
                                  description: err.message,
                                })
                              }
                            }}
                          >
                            {t('common.save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditingCategory(null)}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                            >
                              {cat.icon && <span className="text-lg">{cat.icon}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start">
                            <div className="grid grid-cols-8 gap-1">
                              {availableIcons.map((icon) => (
                                <button
                                  key={icon}
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('finance_categories')
                                        .update({ icon })
                                        .eq('id', cat.id)

                                      if (error) throw error

                                      toast.success(t('finance.categories.iconUpdated'))
                                      fetchCategories()
                                      onUpdate()
                                    } catch (err: any) {
                                      toast.error(t('finance.categories.errorUpdate'), {
                                        description: err.message,
                                      })
                                    }
                                  }}
                                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
                                  type="button"
                                >
                                  <span className="text-base">{icon}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{cat.name}</span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                    </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCategory(cat.id)
                                setEditForm({ name: cat.name, description: cat.description || '' })
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categorias de Despesa */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-medium">{t('finance.charts.expenses')}</h3>
              <Badge variant="secondary" className="text-xs">{expenseCategories.length}</Badge>
            </div>
            
            {expenseCategories.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <TrendingDown className="h-10 w-10 mx-auto mb-3 opacity-20 text-red-600" />
                <p className="text-sm text-muted-foreground">
                  {t('finance.categories.noExpense')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('finance.categories.addExpense')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-all"
                  >
                    {editingCategory === cat.id ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder={t('finance.categories.descriptionPlaceholder')}
                          className="h-7 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 text-xs"
                            onClick={async () => {
                              if (!editingCategory) return
                              try {
                                const { error } = await supabase
                                  .from('finance_categories')
                                  .update({
                                    name: editForm.name.trim(),
                                    description: editForm.description.trim() || null,
                                  })
                                  .eq('id', editingCategory)

                                if (error) throw error

                                toast.success(t('finance.categories.updated'))
                                setEditingCategory(null)
                                fetchCategories()
                                onUpdate()
                              } catch (err: any) {
                                toast.error(t('finance.categories.errorUpdate'), {
                                  description: err.message,
                                })
                              }
                            }}
                          >
                            {t('common.save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setEditingCategory(null)}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                            >
                              {cat.icon && <span className="text-lg">{cat.icon}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2" align="start">
                            <div className="grid grid-cols-8 gap-1">
                              {availableIcons.map((icon) => (
                                <button
                                  key={icon}
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('finance_categories')
                                        .update({ icon })
                                        .eq('id', cat.id)

                                      if (error) throw error

                                      toast.success(t('finance.categories.iconUpdated'))
                                      fetchCategories()
                                      onUpdate()
                                    } catch (err: any) {
                                      toast.error(t('finance.categories.errorUpdate'), {
                                        description: err.message,
                                      })
                                    }
                                  }}
                                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-colors"
                                  type="button"
                                >
                                  <span className="text-base">{icon}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{cat.name}</span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                    </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCategory(cat.id)
                                setEditForm({ name: cat.name, description: cat.description || '' })
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteCategory(cat.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
