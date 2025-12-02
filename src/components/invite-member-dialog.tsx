import { useState, FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { teamMemberSchema, type TeamMemberFormData } from '@/lib/validations/team-member'
import { UserPlus } from 'lucide-react'
import type { TeamMemberRole } from '@/types/database'

interface InviteMemberDialogProps {
  projectId: string
  onInvite: (data: { email: string; role: TeamMemberRole; project_id: string }) => Promise<void>
  trigger?: React.ReactNode
}

const roleOptions: { value: Exclude<TeamMemberRole, 'owner'>; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Pode gerenciar membros e configurações' },
  { value: 'editor', label: 'Editor', description: 'Pode editar conteúdo do projeto' },
  { value: 'viewer', label: 'Visualizador', description: 'Pode apenas visualizar o projeto' },
]

export function InviteMemberDialog({ projectId, onInvite, trigger }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<TeamMemberFormData>({
    email: '',
    role: 'viewer',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)
    setLoading(true)

    try {
      // Validar com Zod
      const validated = teamMemberSchema.parse(formData)

      // Convidar membro
      await onInvite({
        ...validated,
        project_id: projectId,
      })

      // Mostrar sucesso
      setSuccess(true)
      
      // Resetar form
      setFormData({
        email: '',
        role: 'viewer',
      })

      // Fechar após 2s
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      if (err.errors) {
        // Erros do Zod
        const zodErrors: Record<string, string> = {}
        err.errors.forEach((error: any) => {
          if (error.path) {
            zodErrors[error.path[0]] = error.message
          }
        })
        setErrors(zodErrors)
      } else {
        setErrors({ submit: err.message || 'Erro ao convidar membro' })
      }
      console.error('Erro ao convidar membro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Membro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite para colaborar neste projeto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-2">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">Papel</Label>
              <Select
                value={formData.role}
                onValueChange={(value: string) => setFormData({ ...formData, role: value as Exclude<TeamMemberRole, 'owner'> })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-slate-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Error geral */}
            {errors.submit && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
                <p className="text-sm text-emerald-400 font-medium">✓ Convite enviado com sucesso!</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading || success}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? 'Enviando...' : success ? 'Enviado!' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
