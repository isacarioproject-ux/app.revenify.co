import { AnimatePresence } from 'framer-motion'
import { useOnboardingV2 } from '@/hooks/use-onboarding-v2'
import { WizardProgress } from '@/components/onboarding/wizard-progress'
import { StepWelcome } from '@/components/onboarding/step-welcome'
import { StepProfile } from '@/components/onboarding/step-profile'
import { StepGoals } from '@/components/onboarding/step-goals'
import { StepCreateProject } from '@/components/onboarding/step-create-project'
import { StepSuccess } from '@/components/onboarding/step-success'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingV2() {
  const {
    currentStep,
    totalSteps,
    data,
    loading,
    progress,
    updateData,
    nextStep,
    previousStep,
    skip,
    complete,
  } = useOnboardingV2()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar (except on first and last step) */}
      {currentStep > 1 && currentStep < totalSteps && (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="container max-w-4xl mx-auto py-4">
            <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <StepWelcome
              key="welcome"
              onNext={() => nextStep()}
            />
          )}

          {/* Step 2: Profile */}
          {currentStep === 2 && (
            <StepProfile
              key="profile"
              onNext={(profileData) => {
                updateData({
                  fullName: profileData.fullName,
                  company: profileData.company,
                  jobRole: profileData.jobRole,
                })
                nextStep({ ...profileData })
              }}
              onBack={previousStep}
              initialData={{
                fullName: data.fullName,
                company: data.company,
                jobRole: data.jobRole,
              }}
            />
          )}

          {/* Step 3: Goals */}
          {currentStep === 3 && (
            <StepGoals
              key="goals"
              onNext={(goalsData) => {
                updateData({ primaryGoals: goalsData.goals })
                nextStep({ primaryGoals: goalsData.goals })
              }}
              onBack={previousStep}
              onSkip={() => skip()}
              initialData={{ goals: data.primaryGoals }}
            />
          )}

          {/* Step 4: Create Project */}
          {currentStep === 4 && (
            <StepCreateProject
              key="create-project"
              onNext={(projectData) => {
                updateData({
                  projectId: projectData.projectId,
                  projectKey: projectData.projectKey,
                  projectName: projectData.projectName,
                  projectDomain: projectData.projectDomain,
                })
                nextStep({ ...projectData })
              }}
              onBack={previousStep}
              initialData={{
                name: data.projectName,
                domain: data.projectDomain,
              }}
            />
          )}

          {/* Step 5: Install Pixel - SKIP FOR MVP */}
          {currentStep === 5 && (
            <div key="skip-pixel">
              {(() => {
                // Auto-skip to next step
                setTimeout(() => nextStep(), 0)
                return null
              })()}
            </div>
          )}

          {/* Step 6: Create Source - SKIP FOR MVP */}
          {currentStep === 6 && (
            <div key="skip-source">
              {(() => {
                // Auto-skip to success
                setTimeout(() => nextStep(), 0)
                return null
              })()}
            </div>
          )}

          {/* Step 7: Success */}
          {currentStep === 7 && (
            <StepSuccess
              key="success"
              onComplete={complete}
              data={{
                projectName: data.projectName,
                projectCreated: !!data.projectId,
                pixelInstalled: data.pixelInstalled,
                sourceCreated: data.sourceCreated,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
