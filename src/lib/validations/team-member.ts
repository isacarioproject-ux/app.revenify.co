import { z } from 'zod'

export const teamMemberSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  role: z
    .enum(['admin', 'editor', 'viewer'], {
      errorMap: () => ({ message: 'Papel inválido' }),
    })
    .default('viewer'),
})

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>

export const updateTeamMemberSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Papel inválido' }),
  }),
})

export type UpdateTeamMemberFormData = z.infer<typeof updateTeamMemberSchema>
