import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export const PendingInvitesNotification = () => {
  const { t } = useI18n()
  const [invites, setInvites] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchPendingInvites()

    // Buscar convites a cada 30 segundos
    const interval = setInterval(fetchPendingInvites, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingInvites = async () => {
    try {
      console.log('📬 Buscando convites pendentes...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        console.log('❌ Usuário sem email')
        return
      }

      console.log('👤 Email do usuário:', user.email)

      const { data, error } = await supabase
        .from('workspace_invites')
        .select(`
          *,
          workspaces (
            name
          )
        `)
        .eq('email', user.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())

      console.log('📧 Convites encontrados:', data?.length || 0, data)

      if (error) throw error
      setInvites(data || [])
    } catch (err) {
      console.error('Error fetching invites:', err)
    }
  }

  const handleDismiss = (inviteId: string) => {
    setDismissed([...dismissed, inviteId])
  }

  const visibleInvites = invites.filter(inv => !dismissed.includes(inv.id))

  if (visibleInvites.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleInvites.map((invite) => (
        <Card key={invite.id} className="shadow-lg border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{t('workspace.invites.title')}</CardTitle>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleDismiss(invite.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {t('workspace.invites.sentTo')} <strong>{invite.workspaces?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              {invite.role === 'admin' && t('workspace.members.admin')}
              {invite.role === 'member' && t('workspace.members.member')}
              {invite.role === 'viewer' && t('workspace.members.viewer')}
            </Badge>
            
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                console.log('🔗 Clicou em Ver Convite')
                console.log('🔗 Token:', invite.token)
                console.log('🔗 URL:', `/invite/${invite.token}`)
                
                // Fechar notificação
                handleDismiss(invite.id)
                
                // Navegar para página de convite
                navigate(`/invite/${invite.token}`)
              }}
            >
              {t('workspace.notification.view')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
