import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TeamMember, TeamMemberRole } from '@/types/database'
import { toast } from 'sonner'

interface UseOrganizationMembersReturn {
  members: TeamMember[]
  loading: boolean
  error: Error | null
  inviteMember: (email: string, role: TeamMemberRole, projectId?: string | null, name?: string) => Promise<void>
  updateMember: (id: string, data: Partial<TeamMember>) => Promise<void>
  removeMember: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useOrganizationMembers(): UseOrganizationMembersReturn {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar TODOS os membros que o usuário convidou (sem filtro de projeto)
      const { data, error: fetchError } = await supabase
        .from('workspace_members')
        .select('*')
        .or(`invited_by.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMembers(data || [])
    } catch (err) {
      console.error('Erro ao buscar membros:', err)
      setError(err instanceof Error ? err : new Error('Erro ao buscar membros'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('organization-team-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
        },
        () => {
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMembers])

  const inviteMember = async (email: string, role: TeamMemberRole, projectId?: string | null, name?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert({
          project_id: projectId || null, // ✅ Opcional - convite de organização
          email,
          name,
          role,
          invited_by: user.id,
          status: 'pending',
        })

      if (insertError) throw insertError

      await fetchMembers()
      toast.success('Convite enviado com sucesso!')
    } catch (err) {
      console.error('Erro ao convidar membro:', err)
      toast.error('Erro ao enviar convite')
      throw err instanceof Error ? err : new Error('Erro ao convidar membro')
    }
  }

  const updateMember = async (id: string, data: Partial<TeamMember>) => {
    try {
      const { error: updateError } = await supabase
        .from('workspace_members')
        .update(data)
        .eq('id', id)

      if (updateError) throw updateError

      // Atualização otimista
      setMembers(prev =>
        prev.map(member =>
          member.id === id ? { ...member, ...data } : member
        )
      )
      toast.success('Membro atualizado!')
    } catch (err) {
      console.error('Erro ao atualizar membro:', err)
      await fetchMembers() // Revert on error
      toast.error('Erro ao atualizar membro')
      throw err instanceof Error ? err : new Error('Erro ao atualizar membro')
    }
  }

  const removeMember = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Atualização otimista
      setMembers(prev => prev.filter(member => member.id !== id))
      toast.success('Membro removido!')
    } catch (err) {
      console.error('Erro ao remover membro:', err)
      await fetchMembers() // Revert on error
      toast.error('Erro ao remover membro')
      throw err instanceof Error ? err : new Error('Erro ao remover membro')
    }
  }

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMember,
    removeMember,
    refetch: fetchMembers,
  }
}
