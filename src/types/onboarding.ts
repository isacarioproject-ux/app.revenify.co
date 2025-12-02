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

export interface OnboardingData {
  // Perfil
  userType?: UserType
  industry?: string
  teamSize?: TeamSize
  companyName?: string
  
  // Objetivos
  primaryGoal?: PrimaryGoal
  secondaryGoals?: string[]
  
  // Workspace
  workspaceName?: string
  workspaceId?: string
  
  // Progresso
  currentStep: number
  stepsCompleted: number[]
  
  // Timing
  startedAt: Date
  lastActiveAt: Date
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
