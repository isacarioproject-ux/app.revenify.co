import { z } from 'zod'

export const projectSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(255, 'O nome deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  status: z.enum(['Planejamento', 'Em andamento', 'Concluído', 'Pausado', 'Cancelado'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }).default('Planejamento'),
  progress: z
    .number()
    .min(0, 'O progresso mínimo é 0%')
    .max(100, 'O progresso máximo é 100%')
    .default(0),
  team_size: z
    .number()
    .min(1, 'A equipe deve ter pelo menos 1 membro')
    .max(100, 'A equipe deve ter no máximo 100 membros')
    .optional()
    .nullable(),
  due_date: z
    .string()
    .refine((date) => {
      if (!date) return true
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 'Data inválida')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^[a-z]+$/, 'Cor inválida')
    .default('indigo'),
})

export type ProjectFormData = z.infer<typeof projectSchema>
