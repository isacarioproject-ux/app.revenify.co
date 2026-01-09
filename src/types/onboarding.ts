export type UserType = 'freelancer' | 'small_business' | 'enterprise' | 'personal'

export type PrimaryGoal = 'tasks' | 'finance' | 'projects' | 'all'

export type TeamSize = '1' | '2-10' | '11-50' | '50+'

export interface OnboardingStep {
  id: number
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  optional?: boolean
}

export interface OnboardingStepProps {
  onNext: (data?: any) => void
  onSkip?: () => void
  onBack?: () => void
  isFirst?: boolean
  isLast?: boolean
}

// New types for V2 onboarding
export type JobRole = 'founder' | 'marketing' | 'developer' | 'product' | 'other'

export interface OnboardingData {
  // V2 Professional Onboarding Fields
  // Perfil
  fullName?: string
  company?: string
  jobRole?: JobRole

  // Objetivos
  primaryGoals?: string[]

  // Projeto
  projectId?: string
  projectKey?: string
  projectName?: string
  projectDomain?: string

  // Source
  sourceId?: string

  // Metadata
  pixelInstalled?: boolean
  sourceCreated?: boolean

  // Progresso
  currentStep: number
  stepsCompleted: number[]
  totalSteps: number

  // Timing
  startedAt: Date
  lastActiveAt: Date

  // Legacy fields (deprecated but kept for backwards compatibility)
  userType?: UserType
  industry?: string
  teamSize?: TeamSize
  companyName?: string
  primaryGoal?: PrimaryGoal
  secondaryGoals?: string[]
  workspaceName?: string
  workspaceId?: string
}

export interface OnboardingAnalytics extends OnboardingData {
  id: string
  userId: string
  workspaceId?: string
  completed: boolean
  skipped: boolean
  abandonedAtStep?: number
  completedAt?: Date
  timeSpentSeconds: number
  createdWorkspace: boolean
  createdFirstTask: boolean
  createdFirstTransaction: boolean
  invitedTeamMember: boolean
  completedTour: boolean
  deviceType?: string
  browser?: string
  os?: string
  referrer?: string
  utmSource?: string
  utmCampaign?: string
}
