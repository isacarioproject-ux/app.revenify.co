import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WizardStepWrapper } from './wizard-step-wrapper'
import { OnboardingHeader } from './onboarding-header'
import { projectSchema, type ProjectFormData } from '@/lib/validations/onboarding-schemas'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useProjectsContext } from '@/contexts/projects-context'
import { toast } from 'sonner'

interface StepCreateProjectProps {
  onNext: (data: { projectId: string; projectKey: string; projectName: string; projectDomain: string }) => void
  onBack: () => void
  initialData?: Partial<ProjectFormData>
}

export function StepCreateProject({ onNext, onBack, initialData }: StepCreateProjectProps) {
  const { addProject } = useProjectsContext()
  const [loading, setLoading] = useState(false)

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || '',
      domain: initialData?.domain || '',
    },
  })

  const handleSubmit = async (data: ProjectFormData) => {
    setLoading(true)
    try {
      const project = await addProject({
        name: data.name,
        domain: data.domain,
      })

      onNext({
        projectId: project.id,
        projectKey: project.project_key,
        projectName: project.name,
        projectDomain: project.domain,
      })
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Erro ao criar projeto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <OnboardingHeader showToggles={true} />

      <WizardStepWrapper
        title="Crie seu primeiro projeto"
        description="Configure um projeto para começar a rastrear conversões"
        onNext={form.handleSubmit(handleSubmit)}
        onBack={onBack}
        nextLabel="Criar projeto"
        nextDisabled={!form.formState.isValid}
        loading={loading}
      >
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Minha Loja Online" {...field} />
                </FormControl>
                <FormDescription>
                  Um nome descritivo para identificar este projeto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domínio do site</FormLabel>
                <FormControl>
                  <Input placeholder="minhaloja.com" {...field} />
                </FormControl>
                <FormDescription>
                  Sem https:// ou www. Apenas o domínio principal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      </WizardStepWrapper>
    </div>
  )
}
