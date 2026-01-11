import { supabase } from '../supabase'
import type { OnboardingData } from '@/types/onboarding'

/**
 * Check if user has completed onboarding
 * Retorna true (completado) em caso de erro para não bloquear o usuário
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    // Primeiro verifica se usuário já tem projetos (mais confiável)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    // Se tem projetos, onboarding está completo
    if (!projectsError && projects && projects.length > 0) {
      return true
    }

    // Verifica na tabela de onboarding
    const { data, error } = await supabase
      .from('onboarding_analytics')
      .select('completed')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking onboarding status:', error)
      // Em caso de erro, assume completado para não bloquear usuário
      return true
    }

    return data?.completed === true
  } catch (error) {
    console.error('Error in checkOnboardingStatus:', error)
    // Em caso de erro, assume completado para não bloquear usuário
    return true
  }
}

/**
 * Get onboarding record for user
 */
export async function getOnboardingRecord(userId: string) {
  try {
    const { data, error } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error getting onboarding record:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getOnboardingRecord:', error)
    return null
  }
}

/**
 * Create new onboarding record
 */
export async function createOnboardingRecord(
  userId: string,
  deviceInfo: {
    deviceType?: string
    browser?: string
    os?: string
    referrer?: string
    utmSource?: string
    utmCampaign?: string
  }
) {
  try {
    const { data, error } = await supabase
      .from('onboarding_analytics')
      .insert({
        user_id: userId,
        current_step: 1,
        total_steps: 7,
        started_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        completed: false,
        skipped: false,
        steps_completed: [],
        time_spent_seconds: 0,
        ...deviceInfo,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating onboarding record:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createOnboardingRecord:', error)
    return null
  }
}

/**
 * Update onboarding step and data
 */
export async function updateOnboardingStep(
  userId: string,
  stepNumber: number,
  stepData: Partial<OnboardingData>
) {
  try {
    // Get current record to append to steps_completed
    const record = await getOnboardingRecord(userId)
    if (!record) {
      console.error('No onboarding record found for user')
      return null
    }

    const stepsCompleted = record.steps_completed || []
    if (!stepsCompleted.includes(stepNumber)) {
      stepsCompleted.push(stepNumber)
    }

    const { data, error } = await supabase
      .from('onboarding_analytics')
      .update({
        current_step: stepNumber,
        steps_completed: stepsCompleted,
        last_active_at: new Date().toISOString(),
        // Update specific fields from stepData
        ...(stepData.fullName && { user_full_name: stepData.fullName }),
        ...(stepData.company && { company_name: stepData.company }),
        ...(stepData.jobRole && { job_role: stepData.jobRole }),
        ...(stepData.primaryGoals && { primary_goals: stepData.primaryGoals }),
        ...(stepData.projectId && { project_id: stepData.projectId }),
        ...(stepData.pixelInstalled !== undefined && {
          pixel_installed: stepData.pixelInstalled,
        }),
        ...(stepData.sourceCreated !== undefined && {
          source_created: stepData.sourceCreated,
        }),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating onboarding step:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateOnboardingStep:', error)
    return null
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(userId: string) {
  try {
    // Calculate time spent
    const record = await getOnboardingRecord(userId)
    const timeSpent = record?.started_at
      ? Math.floor(
          (new Date().getTime() - new Date(record.started_at).getTime()) / 1000
        )
      : 0

    const { data, error } = await supabase
      .from('onboarding_analytics')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
        current_step: 7, // Final step
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error completing onboarding:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in completeOnboarding:', error)
    return null
  }
}

/**
 * Mark onboarding as abandoned at specific step
 */
export async function abandonOnboarding(userId: string, step: number) {
  try {
    const { error } = await supabase
      .from('onboarding_analytics')
      .update({
        abandoned_at_step: step,
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking onboarding as abandoned:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in abandonOnboarding:', error)
    return false
  }
}
