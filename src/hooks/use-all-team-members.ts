import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TeamMemberOption {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'pending' | 'active' | 'declined'
}

export function useAllTeamMembers() {
  const [members, setMembers] = useState<TeamMemberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        // Buscar todos os membros que o usuário convidou ou que estão na mesma organização
        const { data, error: fetchError } = await supabase
          .from('workspace_members')
          .select('id, name, email, status')
          .or(`invited_by.eq.${user.id},user_id.eq.${user.id}`)
          .order('email', { ascending: true })

        if (fetchError) throw fetchError

        const formattedMembers: TeamMemberOption[] = (data || []).map(member => ({
          id: member.id,
          name: member.name || member.email.split('@')[0],
          email: member.email,
          avatar: undefined,
          status: member.status as 'pending' | 'active' | 'declined'
        }))

        setMembers(formattedMembers)
      } catch (err) {
        console.error('Erro ao buscar membros da equipe:', err)
        setError(err instanceof Error ? err : new Error('Erro ao buscar membros'))
      } finally {
        setLoading(false)
      }
    }

    fetchAllMembers()

    // Realtime subscription
    const channel = supabase
      .channel('all-team-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
        },
        () => {
          fetchAllMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { members, loading, error }
}
