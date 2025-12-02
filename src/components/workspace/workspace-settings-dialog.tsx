import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Settings,
  Users,
  Mail,
  Trash2,
  Copy,
  Crown,
  Shield,
  Eye,
  UserPlus,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useWorkspace } from '@/contexts/workspace-context'
import { WorkspaceMemberWithUser, WorkspaceInvite } from '@/types/workspace'
import { formatDistanceToNow } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/use-date-fns-locale'

type TabValue = 'general' | 'members' | 'invites' | 'danger'

interface WorkspaceSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: TabValue
}

export const WorkspaceSettingsDialog = ({
  open,
  onOpenChange,
  defaultTab = 'general',
}: WorkspaceSettingsDialogProps) => {
  const { t } = useI18n()
  const { currentWorkspace, refreshWorkspaces } = useWorkspace()
  const dateFnsLocale = useDateFnsLocale()

  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab || 'general')
  
  // Sincronizar activeTab com defaultTab quando mudar
  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [open, defaultTab])
  
  // General settings
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Members
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Invites
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [sendingInvite, setSendingInvite] = useState(false)

  // Delete workspace
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (open && currentWorkspace) {
      setName(currentWorkspace.name)
      setDescription(currentWorkspace.description || '')
      fetchMembers()
      fetchInvites()
    }
  }, [open, currentWorkspace])

  const fetchMembers = async () => {
    if (!currentWorkspace) return

    setLoadingMembers(true)
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (err: any) {
      toast.error(t('workspace.members.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchInvites = async () => {
    if (!currentWorkspace) return

    setLoadingInvites(true)
    try {
      const { data, error } = await supabase
        .from('workspace_invites')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvites(data || [])
    } catch (err: any) {
      toast.error(t('workspace.invites.errorLoad'), {
        description: err.message,
      })
    } finally {
      setLoadingInvites(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!currentWorkspace || !name.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', currentWorkspace.id)

      if (error) throw error

      await refreshWorkspaces()
      toast.success(t('workspace.settings.saved'))
    } catch (err: any) {
      toast.error(t('workspace.settings.errorSave'), {
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendInvite = async () => {
    if (!currentWorkspace || !inviteEmail.trim()) return

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      toast.error(t('finance.table.invalidValue'))
      return
    }

    setSendingInvite(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('finance.goals.userNotAuthenticated'))

      // Criar convite
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15)
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expira em 7 dias

      const { error } = await supabase
        .from('workspace_invites')
        .insert({
          workspace_id: currentWorkspace.id,
          email: inviteEmail.toLowerCase().trim(),
          invited_by: user.id,
          role: inviteRole,
          status: 'pending' as const,
          token,
          expires_at: expiresAt.toISOString(),
        })

      if (error) throw error
      
      setInviteEmail('')
      setInviteRole('member')
      fetchInvites()
      
      toast.success(t('workspace.invites.sent'), {
        description: `${t('workspace.invites.sentTo')} ${inviteEmail}`,
      })
    } catch (err: any) {
      toast.error(t('workspace.invites.errorSend'), {
        description: err.message,
      })
    } finally {
      setSendingInvite(false)
    }
  }

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}` 
    navigator.clipboard.writeText(inviteUrl)
    toast.success(t('workspace.invites.linkCopied'))
  }

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId)

      if (error) throw error
      
      fetchInvites()
      toast.success(t('workspace.invites.cancelled'))
    } catch (err: any) {
      toast.error(t('workspace.invites.errorCancel'), {
        description: err.message,
      })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
      
      fetchMembers()
      toast.success(t('workspace.members.roleUpdated'))
    } catch (err: any) {
      toast.error(t('workspace.members.errorUpdate'), {
        description: err.message,
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t('workspace.members.remove') + '?')) return

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      
      fetchMembers()
      toast.success(t('workspace.members.removed'))
    } catch (err: any) {
      toast.error(t('workspace.members.errorRemove'), {
        description: err.message,
      })
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return
    if (deleteConfirmText !== currentWorkspace.name) return

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', currentWorkspace.id)

      if (error) throw error

      await refreshWorkspaces()
      onOpenChange(false)
      
      toast.success(t('workspace.delete.deleted'), {
        description: t('workspace.delete.description'),
      })
    } catch (err: any) {
      toast.error(t('workspace.delete.error'), {
        description: err.message,
      })
    }
  }

  if (!currentWorkspace) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />
      case 'viewer': return <Eye className="h-3 w-3 text-gray-500" />
      default: return <Users className="h-3 w-3" />
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: t('workspace.owner'),
      admin: t('workspace.members.admin'),
      member: t('workspace.members.member'),
      viewer: t('workspace.members.viewer'),
    }
    return labels[role] || role
  }

  const isOwner = currentWorkspace.user_role === 'owner'
  const isAdmin = currentWorkspace.user_role === 'admin' || isOwner

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('workspace.settings.title')}
            </DialogTitle>
            <DialogDescription>
              {currentWorkspace.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1">
            <div className="px-6 border-b">
              <TabsList variant="underlined" className="w-full justify-start">
                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  {t('workspace.settings.general')}
                </TabsTrigger>
                <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Users className="h-4 w-4 mr-2" />
                  {t('workspace.settings.members')} ({members.length})
                </TabsTrigger>
                <TabsTrigger value="invites" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('workspace.settings.invites')} ({invites.length})
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="danger" className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive text-destructive">
                    {t('workspace.settings.danger')}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <ScrollArea className="h-[500px]">
              {/* TAB: Geral */}
              <TabsContent value="general" className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">{t('workspace.name')}</Label>
                    <Input
                      id="workspace-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-description">{t('workspace.description')}</Label>
                    <Textarea
                      id="workspace-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('workspace.settings.general')}</Label>
                      <Badge variant="secondary" className="capitalize">
                        {currentWorkspace.plan}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('workspace.members.count')}</Label>
                      <p className="text-sm">{members.length} / {currentWorkspace.max_members}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Button onClick={handleSaveGeneral} disabled={saving}>
                      {saving ? t('workspace.settings.saving') : t('workspace.settings.save')}
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Membros */}
              <TabsContent value="members" className="p-6">
                <div className="space-y-4">
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('workspace.members.errorLoad')}...
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('workspace.invites.noInvites')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {member.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.profiles?.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.profiles?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAdmin && member.role !== 'owner' ? (
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                              >
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon('admin')}
                                      {t('workspace.members.admin')}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="member">
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon('member')}
                                      {t('workspace.members.member')}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon('viewer')}
                                      {t('workspace.members.viewer')}
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                {getRoleIcon(member.role)}
                                {getRoleLabel(member.role)}
                              </Badge>
                            )}

                            {isAdmin && member.role !== 'owner' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Convites */}
              <TabsContent value="invites" className="p-6 space-y-6">
                {isAdmin && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t('workspace.invites.title')}
                    </h3>
                    
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">{t('workspace.invites.email')}</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder={t('workspace.invites.emailPlaceholder')}
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invite-role">{t('workspace.members.role')}</Label>
                        <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                          <SelectTrigger id="invite-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('workspace.members.admin')}</SelectItem>
                            <SelectItem value="member">{t('workspace.members.member')}</SelectItem>
                            <SelectItem value="viewer">{t('workspace.members.viewer')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleSendInvite}
                        disabled={!inviteEmail || sendingInvite}
                        className="w-full"
                      >
                        {sendingInvite ? t('workspace.invites.sending') : t('workspace.invites.send')}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{t('workspace.invites.pending')}</h3>
                  
                  {loadingInvites ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('workspace.invites.errorLoad')}...
                    </p>
                  ) : invites.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('workspace.invites.noInvites')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('workspace.expiresIn')} {formatDistanceToNow(new Date(invite.expires_at), {
                                addSuffix: true,
                                locale: dateFnsLocale,
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleCopyInviteLink(invite.token)}
                              title={t('workspace.invites.copyLink')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleDeleteInvite(invite.id)}
                                title={t('workspace.invites.cancel')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Zona de Perigo */}
              {isOwner && (
                <TabsContent value="danger" className="p-6">
                  <div className="space-y-4 p-4 border-2 border-destructive rounded-lg">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-destructive">
                        {t('workspace.delete.title')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t('workspace.delete.description')}
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('workspace.delete.button')}
                    </Button>
                  </div>
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Confirmar Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.delete.confirm')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta ação não pode ser desfeita. Isso irá permanentemente excluir o
                workspace <strong>{currentWorkspace.name}</strong> e remover todos os
                dados associados.
              </p>
              <div className="space-y-2">
                <Label>{t('workspace.delete.type')} {t('workspace.delete.confirmDescription')}:</Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={currentWorkspace.name}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              {t('workspace.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={deleteConfirmText !== currentWorkspace.name}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('workspace.delete.button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
