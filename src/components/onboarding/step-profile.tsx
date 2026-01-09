import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WizardStepWrapper } from './wizard-step-wrapper'
import { OnboardingHeader } from './onboarding-header'
import { profileSchema, type ProfileFormData } from '@/lib/validations/onboarding-schemas'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'

interface StepProfileProps {
  onNext: (data: ProfileFormData) => void
  onBack: () => void
  initialData?: Partial<ProfileFormData>
}

const jobRoles = [
  { value: 'founder', label: 'Fundador / CEO' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'developer', label: 'Desenvolvedor' },
  { value: 'product', label: 'Produto' },
  { value: 'other', label: 'Outro' },
] as const

export function StepProfile({ onNext, onBack, initialData }: StepProfileProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData?.fullName || user?.user_metadata?.full_name || '',
      company: initialData?.company || '',
      jobRole: initialData?.jobRole || undefined,
    },
  })

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    try {
      onNext(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <OnboardingHeader showToggles={true} />

      <WizardStepWrapper
        title="Conte-nos sobre você"
        description="Personalize sua experiência no Revenify"
        onNext={form.handleSubmit(handleSubmit)}
        onBack={onBack}
        nextDisabled={!form.formState.isValid}
        loading={loading}
      >
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="João Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa / Site</FormLabel>
                <FormControl>
                  <Input placeholder="Minha Empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu cargo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
