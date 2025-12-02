import { PageElement } from '@/components/docs/page-elements'
import { getTranslatedTemplates } from './page-templates'

/**
 * Re-traduz o conteúdo de um documento baseado no template_id
 * Isso permite que templates mudem de idioma quando o usuário troca o idioma
 */
export const retranslateTemplate = (
  templateId: string,
  currentElements: PageElement[]
): PageElement[] | null => {
  // Buscar template traduzido atual
  const templates = getTranslatedTemplates()
  const template = templates.find(t => t.id === templateId)
  
  if (!template) {
    console.log(`⚠️ Template ${templateId} não encontrado`)
    return null
  }

  console.log(`🌍 Re-traduzindo template: ${templateId}`)

  // Mapear elementos atuais para elementos traduzidos
  // Mantém IDs originais mas atualiza conteúdo
  const translatedElements = template.elements.map((templateEl, index) => {
    const currentEl = currentElements[index]
    
    // Se o elemento atual existe, manter seu ID
    if (currentEl) {
      return {
        ...currentEl,
        content: templateEl.content, // ✅ Conteúdo traduzido
      }
    }
    
    // Se não existe, usar o do template
    return templateEl
  })

  return translatedElements
}

/**
 * Verifica se um documento é um template que pode ser re-traduzido
 */
export const isRetranslatableTemplate = (templateId: string | null): boolean => {
  if (!templateId) return false
  
  const templates = getTranslatedTemplates()
  return templates.some(t => t.id === templateId)
}
