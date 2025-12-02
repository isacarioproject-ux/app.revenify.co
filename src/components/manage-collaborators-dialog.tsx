import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Plus, Shield, Eye, Edit3, Loader2 } from 'lucide-react'
import type { Project } from '@/types/database'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { useAllTeamMembers, type TeamMemberOption } from '@/hooks/use-all-team-members'

interface TeamMember extends TeamMemberOption {}

interface ProjectCollaborator extends TeamMember {
  role: 'viewer' | 'editor' | 'admin'
}

interface ManageCollaboratorsDialogProps {
  project: Project
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const getRoleConfig = (t: any) => ({
  viewer: { label: t('collaborators.viewer'), icon: Eye, color: 'text-blue-500' },
  editor: { label: t('collaborators.editor'), icon: Edit3, color: 'text-green-500' },
  admin: { label: t('collaborators.admin'), icon: Shield, color: 'text-purple-500' }
})

export function ManageCollaboratorsDialog({ project, open: controlledOpen, onOpenChange }: ManageCollaboratorsDialogProps) {
  const { t } = useI18n()
  const { members: teamMembers, loading: loadingMembers } = useAllTeamMembers()
  const [internalOpen, setInternalOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([])
  const roleConfig = getRoleConfig(t)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  // Form state
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor' | 'admin'>('editor')

  const handleAdd = () => {
    const member = teamMembers.find(m => m.id === selectedMember)
    if (!member) {
      toast.error(t('collaborators.selectError'))
      return
    }

    const exists = collaborators.find(c => c.id === member.id)
    if (exists) {
      toast.error(t('collaborators.alreadyAdded'))
      return
    }

    const newCollab: ProjectCollaborator = {
      id: member.id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      status: member.status,
      role: selectedRole
    }

    setCollaborators([...collaborators, newCollab])
    setSelectedMember('')
    toast.success(`${member.name} ${t('collaborators.added')}`)
  }

  const handleRemove = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id))
    toast.success(t('collaborators.removed'))
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className="md:max-w-[420px]">
        <ModalHeader>
          <ModalTitle>{t('collaborators.title')}</ModalTitle>
          <ModalDescription>
            Adicione membros ao projeto
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Membro da Equipe */}
          <div className="space-y-2">
            <Label>{t('collaborators.teamMember')}</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember} disabled={loadingMembers}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMembers ? 'Carregando...' : t('collaborators.selectMember')} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Nenhum membro convidado ainda
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        <span className="text-xs text-muted-foreground">({member.email})</span>
                        {member.status === 'pending' && (
                          <Badge variant="outline" className="text-xs h-4 px-1">Pendente</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>{t('collaborators.permission')}</Label>
            <RadioGroup 
              value={selectedRole} 
              onValueChange={(v) => setSelectedRole(v as 'viewer' | 'editor' | 'admin')}
              className="gap-2"
            >
              {Object.entries(roleConfig).map(([key, config]) => (
                <Label
                  key={key}
                  htmlFor={key}
                  className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                >
                  <RadioGroupItem value={key} id={key} />
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleAdd} className="w-full" disabled={!selectedMember}>
            <Plus className="mr-2 h-4 w-4" />
            {t('collaborators.addToProject')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
