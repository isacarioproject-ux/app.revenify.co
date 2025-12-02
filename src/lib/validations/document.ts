import { z } from 'zod'

export const documentSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(255, 'O nome deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres')
    .optional()
    .nullable(),
  project_id: z
    .string()
    .uuid('ID de projeto inválido')
    .optional()
    .nullable(),
  category: z.enum(['PDF', 'Word', 'Excel', 'PowerPoint', 'Image', 'Other'], {
    errorMap: () => ({ message: 'Categoria inválida' }),
  }).default('Other'),
  tags: z
    .array(z.string())
    .max(10, 'Máximo de 10 tags permitidas')
    .default([]),
  file_url: z
    .string()
    .url('URL inválida')
    .optional()
    .nullable(),
  file_type: z
    .string()
    .optional()
    .nullable(),
  file_size: z
    .number()
    .min(0, 'Tamanho inválido')
    .max(10 * 1024 * 1024, 'Arquivo muito grande (máximo 10MB)')
    .optional()
    .nullable(),
})

export type DocumentFormData = z.infer<typeof documentSchema>
