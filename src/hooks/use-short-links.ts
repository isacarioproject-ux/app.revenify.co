import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjects } from '@/hooks/use-projects'
import { toast } from 'sonner'

export interface ShortLink {
  id: string
  project_id: string
  short_code: string
  destination_url: string
  title: string | null
  description: string | null
  source_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  is_active: boolean
  expires_at: string | null
  clicks_count: number
  unique_clicks_count: number
  last_clicked_at: string | null
  created_at: string
  custom_domain: string | null
  password: string | null
  ab_test_enabled: boolean
  ab_test_url: string | null
  ab_test_split: number
  geo_targeting: GeoTargetingRule[] | null
  device_targeting: DeviceTargetingRule | null
  deep_link_ios: string | null
  deep_link_android: string | null
  deep_link_fallback: string | null
  cloaking_enabled: boolean
  cloaked_title: string | null
  cloaked_description: string | null
  cloaked_image: string | null
}

export interface GeoTargetingRule {
  country: string
  url: string
}

export interface DeviceTargetingRule {
  desktop_url?: string
  mobile_url?: string
  tablet_url?: string
}

interface CreateShortLinkData {
  destination_url: string
  title?: string
  description?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  expires_at?: string
  password?: string
  ab_test_enabled?: boolean
  ab_test_url?: string
  ab_test_split?: number
  geo_targeting?: GeoTargetingRule[]
  device_targeting?: DeviceTargetingRule
  deep_link_ios?: string
  deep_link_android?: string
  deep_link_fallback?: string
  cloaking_enabled?: boolean
  cloaked_title?: string
  cloaked_description?: string
  cloaked_image?: string
}

export function useShortLinks() {
  const { selectedProject, loading: projectsLoading } = useProjects()
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedOnce = useRef(false)

  const fetchShortLinks = useCallback(async () => {
    if (!selectedProject?.id) {
      setShortLinks([])
      if (!projectsLoading) {
        setIsLoading(false)
      }
      return
    }

    try {
      // Só mostrar loading no primeiro carregamento
      if (!hasLoadedOnce.current) {
        setIsLoading(true)
      }
      const { data, error: fetchError } = await supabase
        .from('short_links')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setShortLinks(data || [])
      hasLoadedOnce.current = true
    } catch (err) {
      console.error('Error fetching short links:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedProject?.id, projectsLoading])

  useEffect(() => {
    fetchShortLinks()
  }, [fetchShortLinks])

  // Real-time updates
  useEffect(() => {
    if (!selectedProject?.id) return

    const channel = supabase
      .channel(`short-links-${selectedProject.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'short_links',
          filter: `project_id=eq.${selectedProject.id}`,
        },
        () => {
          fetchShortLinks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedProject?.id, fetchShortLinks])

  // Gerar short code no frontend (fallback se RPC não existir)
  const generateShortCode = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createShortLink = async (data: CreateShortLinkData): Promise<ShortLink | null> => {
    if (!selectedProject?.id) {
      toast.error('Selecione um projeto primeiro')
      return null
    }

    try {
      // Gerar short code no frontend
      const shortCode = generateShortCode()

      const { data: newLink, error: insertError } = await supabase
        .from('short_links')
        .insert({
          project_id: selectedProject.id,
          short_code: shortCode,
          destination_url: data.destination_url,
          title: data.title || null,
          description: data.description || null,
          utm_source: data.utm_source || null,
          utm_medium: data.utm_medium || null,
          utm_campaign: data.utm_campaign || null,
          utm_term: data.utm_term || null,
          utm_content: data.utm_content || null,
          expires_at: data.expires_at || null,
          password: data.password || null,
          ab_test_enabled: data.ab_test_enabled || false,
          ab_test_url: data.ab_test_url || null,
          ab_test_split: data.ab_test_split || 50,
          geo_targeting: data.geo_targeting || null,
          device_targeting: data.device_targeting || null,
          deep_link_ios: data.deep_link_ios || null,
          deep_link_android: data.deep_link_android || null,
          deep_link_fallback: data.deep_link_fallback || null,
          cloaking_enabled: data.cloaking_enabled || false,
          cloaked_title: data.cloaked_title || null,
          cloaked_description: data.cloaked_description || null,
          cloaked_image: data.cloaked_image || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setShortLinks(prev => [newLink, ...prev])
      toast.success('Link curto criado!')
      return newLink
    } catch (err) {
      console.error('Error creating short link:', err)
      toast.error('Erro ao criar link curto')
      return null
    }
  }

  const deleteShortLink = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('short_links')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setShortLinks(prev => prev.filter(link => link.id !== id))
      toast.success('Link excluído')
    } catch (err) {
      console.error('Error deleting short link:', err)
      toast.error('Erro ao excluir link')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('short_links')
        .update({ is_active: isActive })
        .eq('id', id)

      if (updateError) throw updateError

      setShortLinks(prev =>
        prev.map(link =>
          link.id === id ? { ...link, is_active: isActive } : link
        )
      )
      toast.success(isActive ? 'Link ativado' : 'Link desativado')
    } catch (err) {
      console.error('Error toggling short link:', err)
      toast.error('Erro ao atualizar link')
    }
  }

  // Stats
  const stats = {
    totalLinks: shortLinks.length,
    activeLinks: shortLinks.filter(l => l.is_active).length,
    totalClicks: shortLinks.reduce((sum, l) => sum + l.clicks_count, 0),
  }

  return {
    shortLinks,
    isLoading,
    error,
    stats,
    createShortLink,
    deleteShortLink,
    toggleActive,
    refetch: fetchShortLinks,
  }
}
