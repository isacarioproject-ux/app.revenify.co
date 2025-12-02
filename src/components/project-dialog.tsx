import { useState, FormEvent } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalTrigger } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectSchema, type ProjectFormData } from '@/lib/validations/project'
import { Loader2 } from 'lucide-react'
import type { Project, ProjectStatus } from '@/types/database'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'

interface ProjectDialogProps {
  project?: Project | null
  onSave: (data: ProjectFormData) => Promise<void>
  trigger?: React.ReactNode
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'Planejamento', label: 'Planejamento' },
  { value: 'Em andamento', label: 'Em andamento' },
  { value: 'Concluído', label: 'Concluído' },
  { value: 'Pausado', label: 'Pausado' },
  { value: 'Cancelado', label: 'Cancelado' },
]

const colorOptions = [
  { value: 'indigo', label: 'Indigo' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'amber', label: 'Âmbar' },
  { value: 'red', label: 'Vermelho' },
  { value: 'violet', label: 'Violeta' },
  { value: 'pink', label: 'Rosa' },
]

export function ProjectDialog({ project, onSave, trigger }: ProjectDialogProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'Planejamento',
    progress: project?.progress || 0,
    team_size: project?.team_size || 1,
    due_date: project?.due_date || '',
    color: project?.color || 'indigo',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validar com Zod
      const validated = projectSchema.parse(formData)
      
      // Salvar projeto
      await onSave(validated)
      
      // Toast de sucesso
      toast.success(project ? t('common.updated') : t('common.created'), {
        description: project 
          ? t('projects.updated') 
          : t('projects.created')
      })
      
      // Fechar modal e resetar form
      setOpen(false)
      if (!project) {
        setFormData({
          name: '',
          description: '',
          status: 'Planejamento',
          progress: 0,
          team_size: 1,
          due_date: '',
          color: 'indigo',
        })
      }
    } catch (err: any) {
      if (err.errors) {
        // Erros de validação Zod
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach((error: any) => {
          const field = error.path[0]
          fieldErrors[field] = error.message
        })
        setErrors(fieldErrors)
        toast.error(t('common.error'), {
          description: t('projects.validationError')
        })
      } else {
        toast.error(t('common.error'), {
          description: err.message || t('projects.saveError')
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        {trigger}
      </ModalTrigger>
      <ModalContent className="md:max-w-[480px]">
        <ModalHeader>
          <ModalTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</ModalTitle>
          <ModalDescription>
            {project ? 'Atualize as informações' : 'Preencha os dados do projeto'}
          </ModalDescription>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Website Institucional"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição breve"
              />
            </div>

            {/* Status e Data */}
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => setFormData({ ...formData, status: value as ProjectStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Data Entrega</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                project ? 'Atualizar' : 'Criar Projeto'
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
