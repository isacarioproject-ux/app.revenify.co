import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  console.log('🎯 AcceptInvitePage montado, token:', token)

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 useEffect rodou, token:', token)
    if (token) {
      console.log('✅ Token existe, carregando convite...')
      loadInvite()
    } else {
      console.log('❌ Token não existe!')
      setError('Token de convite inválido')
      setLoading(false)
    }
  }, [token])

  const loadInvite = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 Buscando convite com token:', token)
      
      // Buscar convite
      const { data: inviteData, error: inviteError } = await supabase
        .from('workspace_invites')
        .select(`
          *,
          workspaces (
            id,
            name,
            description
          )
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      console.log('📧 Resultado do convite:', { inviteData, inviteError })
      console.log('📧 inviteData completo:', JSON.stringify(inviteData, null, 2))

      if (inviteError) {
        console.error('❌ Erro ao buscar convite:', inviteError)
        throw new Error('Convite não encontrado ou já foi aceito')
      }

      if (!inviteData) {
        throw new Error('Convite não encontrado')
      }

      // Verificar se expirou
      if (new Date(inviteData.expires_at) < new Date()) {
        throw new Error('Este convite expirou')
      }

      console.log('✅ Convite válido:', inviteData)
      console.log('🏢 Workspace do convite:', inviteData.workspaces)
      
      // Se workspace não veio no join, buscar diretamente
      let workspaceData = inviteData.workspaces
      if (!workspaceData) {
        console.log('⚠️ Workspace não veio no join, buscando diretamente...')
        const { data: ws, error: wsError } = await supabase
          .from('workspaces')
          .select('id, name, description')
          .eq('id', inviteData.workspace_id)
          .single()
        
        if (!wsError && ws) {
          workspaceData = ws
          console.log('✅ Workspace encontrado:', ws)
        } else {
          console.error('❌ Erro ao buscar workspace:', wsError)
        }
      }
      
      setInvite(inviteData)
      setWorkspace(workspaceData)
      
      console.log('💾 Estado setado - invite:', inviteData, 'workspace:', workspaceData)
    } catch (err: any) {
      console.error('❌ Erro ao carregar convite:', err)
      setError(err.message || 'Erro ao carregar convite')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!invite) return

    setAccepting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate(`/auth?redirect=/invite/${token}`)
        return
      }

      // Verificar se email do convite corresponde ao usuário
      if (user.email !== invite.email) {
        throw new Error('Este convite foi enviado para outro email')
      }

      // Adicionar como membro
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role,
          invited_by: invite.invited_by,
          status: 'active',
          joined_at: new Date().toISOString(),
        })

      if (memberError) throw memberError

      // Marcar convite como aceito
      await supabase
        .from('workspace_invites')
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', invite.id)

      console.log('✅ Convite aceito com sucesso!')

      toast.success('✓ Convite aceito!', {
        description: `Você agora faz parte de ${workspace.name}`,
      })

      // Redirecionar para dashboard (vai recarregar os workspaces automaticamente)
      navigate('/dashboard')
      
      // Recarregar a página para atualizar workspaces
      setTimeout(() => window.location.reload(), 100)
    } catch (err: any) {
      toast.error('Erro ao aceitar convite', {
        description: err.message,
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-center">Convite Inválido</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite || !workspace) {
    console.log('⚠️ Dados incompletos:', { invite, workspace })
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const workspaceInitials = workspace.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'WS'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10">
                {workspaceInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-center text-2xl">
            Convite para Workspace
          </CardTitle>
          <CardDescription className="text-center">
            Você foi convidado para se juntar a um workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações do workspace */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Workspace</span>
              <span className="font-medium">{workspace.name}</span>
            </div>
            
            {workspace.description && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Descrição</span>
                <p className="text-sm">{workspace.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seu papel</span>
              <Badge variant="secondary">
                {invite.role === 'admin' && 'Administrador'}
                {invite.role === 'member' && 'Membro'}
                {invite.role === 'viewer' && 'Visualizador'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Convidado para</span>
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                {invite.email}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-2">
            <Button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aceitar Convite
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
              disabled={accepting}
            >
              Recusar
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ao aceitar, você terá acesso aos recursos e conteúdos compartilhados
            neste workspace
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
