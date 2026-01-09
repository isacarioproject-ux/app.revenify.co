import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import type { OnboardingData } from '@/types/onboarding'
import {
  checkOnboardingStatus,
  getOnboardingRecord,
  createOnboardingRecord,
  updateOnboardingStep,
  completeOnboarding,
} from '@/lib/supabase/onboarding-queries'

const TOTAL_STEPS = 7
const STORAGE_KEY_PREFIX = 'onboarding_state_'

/**
 * Hook para gerenciar o fluxo de onboarding profissional
 */
export function useOnboardingV2() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Partial<OnboardingData>>({
    currentStep: 1,
    stepsCompleted: [],
    totalSteps: TOTAL_STEPS,
    startedAt: new Date(),
    lastActiveAt: new Date(),
  })

  // Inicializar onboarding
  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }

    const initializeOnboarding = async () => {
      try {
        // Verificar se já completou
        const isCompleted = await checkOnboardingStatus(user.id)
        if (isCompleted) {
          navigate('/dashboard', { replace: true })
          return
        }

        // Buscar registro existente
        const record = await getOnboardingRecord(user.id)

        if (record) {
          // Restaurar estado
          setCurrentStep(record.current_step || 1)
          setData({
            currentStep: record.current_step || 1,
            stepsCompleted: record.steps_completed || [],
            totalSteps: TOTAL_STEPS,
            fullName: record.user_full_name,
            company: record.company_name,
            jobRole: record.job_role,
            primaryGoals: record.primary_goals,
            projectId: record.project_id,
            pixelInstalled: record.pixel_installed,
            sourceCreated: record.source_created,
            startedAt: new Date(record.started_at),
            lastActiveAt: new Date(record.last_active_at),
          })
        } else {
          // Criar novo registro
          const deviceInfo = {
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
            referrer: document.referrer || undefined,
            utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
            utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
          }

          await createOnboardingRecord(user.id, deviceInfo)
        }
      } catch (error) {
        console.error('Error initializing onboarding:', error)
        toast.error('Erro ao inicializar onboarding')
      } finally {
        setLoading(false)
      }
    }

    initializeOnboarding()
  }, [user, navigate])

  // Atualizar step data
  const updateData = useCallback((stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }))
  }, [])

  // Próximo step
  const nextStep = useCallback(async (stepData?: Partial<OnboardingData>) => {
    if (!user) return

    try {
      const newData = { ...data, ...stepData }
      const nextStepNumber = currentStep + 1

      // Atualizar no Supabase
      await updateOnboardingStep(user.id, nextStepNumber, newData)

      // Atualizar estado local
      setData(newData)
      setCurrentStep(nextStepNumber)

      // Cache em localStorage
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${user.id}`,
        JSON.stringify({ currentStep: nextStepNumber, ...newData })
      )
    } catch (error) {
      console.error('Error moving to next step:', error)
      toast.error('Erro ao avançar')
    }
  }, [user, currentStep, data])

  // Step anterior
  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  // Pular step (apenas para opcionais)
  const skip = useCallback(async () => {
    if (!user) return

    try {
      const nextStepNumber = currentStep + 1

      await updateOnboardingStep(user.id, nextStepNumber, data)

      setCurrentStep(nextStepNumber)
    } catch (error) {
      console.error('Error skipping step:', error)
    }
  }, [user, currentStep, data])

  // Completar onboarding
  const complete = useCallback(async () => {
    if (!user) return

    try {
      await completeOnboarding(user.id)

      // Marcar como completado no localStorage
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')

      // Limpar cache temporário
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${user.id}`)

      toast.success('Bem-vindo ao Revenify! 🎉')

      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Erro ao finalizar onboarding')
    }
  }, [user, navigate])

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    data,
    loading,
    progress,
    updateData,
    nextStep,
    previousStep,
    skip,
    complete,
  }
}

// Utility functions
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
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
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
