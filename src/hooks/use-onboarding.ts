import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { OnboardingData, OnboardingAnalytics } from '@/types/onboarding'

const TOTAL_STEPS = 11

export function useOnboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [data, setData] = useState<OnboardingData>({
    currentStep: 1,
    stepsCompleted: [],
    startedAt: new Date(),
    lastActiveAt: new Date()
  })
  
  const [loading, setLoading] = useState(false)
  const [analyticsId, setAnalyticsId] = useState<string | null>(null)

  // Inicializar/Restaurar onboarding
  useEffect(() => {
    if (!user) return

    const initOnboarding = async () => {
      try {
        // Verificar se já existe registro
        const { data: existing, error: selectError } = await supabase
          .from('onboarding_analytics')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (selectError) {
          return
        }

        if (existing) {
          // Restaurar estado
          setAnalyticsId(existing.id)
          setData({
            userType: existing.user_type,
            industry: existing.industry,
            teamSize: existing.team_size,
            companyName: existing.company_name,
            primaryGoal: existing.primary_goal,
            secondaryGoals: existing.secondary_goals || [],
            workspaceName: undefined,
            workspaceId: existing.workspace_id,
            currentStep: existing.current_step,
            stepsCompleted: existing.steps_completed || [],
            startedAt: new Date(existing.started_at),
            lastActiveAt: new Date(existing.last_active_at)
          })
        } else {
          // Usar upsert para evitar conflitos
          const { data: newRecord, error } = await supabase
            .from('onboarding_analytics')
            .upsert({
              user_id: user.id,
              device_type: getDeviceType(),
              browser: getBrowser(),
              os: getOS(),
              referrer: document.referrer || null,
              current_step: 1,
              total_steps: 6,
              steps_completed: [],
              completed: false,
              skipped: false
            }, {
              onConflict: 'user_id'
            })
            .select()
            .single()

          if (error) {
            throw error
          }
          
          if (newRecord) {
            setAnalyticsId(newRecord.id)
          }
        }
      } catch (error) {
        // Silently fail - table may not exist
      }
    }

    initOnboarding()
  }, [user])

  // Atualizar analytics no backend
  const updateAnalytics = useCallback(async (updates: Record<string, any>) => {
    if (!analyticsId) {
      return
    }

    try {
      // Preparar dados para atualização
      const updateData: any = {
        last_active_at: new Date().toISOString(),
        time_spent_seconds: Math.floor((Date.now() - data.startedAt.getTime()) / 1000)
      }

      // Adicionar updates customizados (já devem estar em snake_case)
      Object.keys(updates).forEach(key => {
        updateData[key] = updates[key]
      })

      const { error } = await supabase
        .from('onboarding_analytics')
        .update(updateData)
        .eq('id', analyticsId)

      if (error) {
        throw error
      }
    } catch (error) {
      // Silently fail
    }
  }, [analyticsId, data.startedAt])

  // Avançar para próximo passo
  const nextStep = useCallback(async (stepData?: any) => {
    const newData = { ...data, ...stepData }
    const nextStepNumber = data.currentStep + 1
    
    setData({
      ...newData,
      currentStep: nextStepNumber,
      stepsCompleted: [...data.stepsCompleted, data.currentStep],
      lastActiveAt: new Date()
    })

    // Preparar dados para update (converter para snake_case)
    const dbUpdates: any = {
      current_step: nextStepNumber,
      steps_completed: [...data.stepsCompleted, data.currentStep]
    }

    // Adicionar stepData convertido
    if (stepData) {
      if (stepData.userType) dbUpdates.user_type = stepData.userType
      if (stepData.primaryGoal) dbUpdates.primary_goal = stepData.primaryGoal
      if (stepData.secondaryGoals) dbUpdates.secondary_goals = stepData.secondaryGoals
      if (stepData.workspaceName) dbUpdates.workspace_id = stepData.workspaceId
      if (stepData.createdFirstTask !== undefined) dbUpdates.created_first_task = stepData.createdFirstTask
      if (stepData.completedTour !== undefined) dbUpdates.completed_tour = stepData.completedTour
    }

    // Atualizar no backend
    await updateAnalytics(dbUpdates)
  }, [data, updateAnalytics])

  // Voltar passo anterior
  const previousStep = useCallback(() => {
    if (data.currentStep > 1) {
      const prevStep = data.currentStep - 1
      
      setData(prev => ({
        ...prev,
        currentStep: prevStep,
        lastActiveAt: new Date()
      }))

      updateAnalytics({
        current_step: prevStep
      })
    }
  }, [data.currentStep, updateAnalytics])

  // Pular onboarding
  const skip = useCallback(async () => {
    try {
      await updateAnalytics({
        skipped: true,
        abandoned_at_step: data.currentStep,
        completed_at: new Date().toISOString()
      })

      toast.info('Você pode configurar isso depois em Settings')
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao pular onboarding:', error)
      navigate('/dashboard') // Navegar mesmo com erro
    }
  }, [data.currentStep, updateAnalytics, navigate])

  // Completar onboarding
  const complete = useCallback(async () => {
    setLoading(true)

    try {
      await updateAnalytics({
        completed: true,
        completed_at: new Date().toISOString(),
        steps_completed: Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)
      })

      // Sinalizar que vem do onboarding (para refresh de workspaces)
      sessionStorage.setItem('from-onboarding', 'true')
      
      toast.success('🎉 Tudo pronto! Bem-vindo ao Isacar!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao completar onboarding:', error)
      toast.error('Erro ao finalizar onboarding')
      
      // Sinalizar mesmo com erro (para tentar refresh)
      sessionStorage.setItem('from-onboarding', 'true')
      navigate('/dashboard') // Navegar mesmo com erro
    } finally {
      setLoading(false)
    }
  }, [updateAnalytics, navigate])

  // Registrar ação
  const trackAction = useCallback(async (action: string, value: boolean = true) => {
    const actionMap: Record<string, string> = {
      'workspace': 'created_workspace',
      'task': 'created_first_task',
      'transaction': 'created_first_transaction',
      'invite': 'invited_team_member',
      'tour': 'completed_tour'
    }

    const dbField = actionMap[action]
    if (dbField) {
      await updateAnalytics({ [dbField]: value })
    }
  }, [updateAnalytics])

  return {
    data,
    currentStep: data.currentStep,
    totalSteps: TOTAL_STEPS,
    progress: (data.stepsCompleted.length / TOTAL_STEPS) * 100,
    loading,
    nextStep,
    previousStep,
    skip,
    complete,
    trackAction,
    isFirst: data.currentStep === 1,
    isLast: data.currentStep === TOTAL_STEPS
  }
}

// Helpers
function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  return 'Other'
}

function getOS(): string {
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS')) return 'iOS'
  return 'Other'
}
