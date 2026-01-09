import { z } from 'zod'

/**
 * Step 2: Profile Schema
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .trim(),
  company: z
    .string()
    .min(2, 'Nome da empresa obrigatório')
    .max(100, 'Nome muito longo')
    .trim(),
  jobRole: z.enum(['founder', 'marketing', 'developer', 'product', 'other'], {
    required_error: 'Selecione seu cargo',
  }),
})

export type ProfileFormData = z.infer<typeof profileSchema>

/**
 * Step 3: Goals Schema
 */
export const goalsSchema = z.object({
  goals: z
    .array(z.string())
    .min(1, 'Selecione ao menos 1 objetivo')
    .max(3, 'Selecione no máximo 3 objetivos'),
})

export type GoalsFormData = z.infer<typeof goalsSchema>

/**
 * Step 4: Project Schema
 */
export const projectSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .trim(),
  domain: z
    .string()
    .min(3, 'Domínio inválido')
    .max(100, 'Domínio muito longo')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/,
      'Domínio inválido. Ex: minhaloja.com'
    )
    .trim()
    .transform((val) =>
      val.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase()
    ),
})

export type ProjectFormData = z.infer<typeof projectSchema>

/**
 * Step 6: Source Schema (optional)
 */
export const sourceSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo').trim(),
  utmSource: z
    .string()
    .min(2, 'UTM Source obrigatório')
    .max(50, 'Muito longo')
    .trim()
    .toLowerCase(),
  utmMedium: z
    .string()
    .min(2, 'UTM Medium obrigatório')
    .max(50, 'Muito longo')
    .trim()
    .toLowerCase(),
  utmCampaign: z
    .string()
    .max(100, 'Muito longo')
    .trim()
    .toLowerCase()
    .optional(),
})

export type SourceFormData = z.infer<typeof sourceSchema>
