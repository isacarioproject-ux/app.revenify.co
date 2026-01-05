/**
 * Utilitário de sanitização de HTML para prevenir XSS
 * Usa uma abordagem whitelist para tags e atributos permitidos
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
]

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class', 'id'],
}

/**
 * Remove tags HTML perigosas e atributos não permitidos
 * @param html - String HTML para sanitizar
 * @returns String HTML sanitizada
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Criar um elemento temporário para parsing
  const doc = new DOMParser().parseFromString(html, 'text/html')
  
  // Função recursiva para limpar nós
  function cleanNode(node: Node): void {
    const childNodes = Array.from(node.childNodes)
    
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element
        const tagName = element.tagName.toLowerCase()
        
        // Remover tags não permitidas (mas manter conteúdo)
        if (!ALLOWED_TAGS.includes(tagName)) {
          // Mover filhos para o pai antes de remover
          while (element.firstChild) {
            node.insertBefore(element.firstChild, element)
          }
          node.removeChild(element)
          continue
        }
        
        // Remover atributos não permitidos
        const allowedAttrs = [
          ...(ALLOWED_ATTRIBUTES[tagName] || []),
          ...(ALLOWED_ATTRIBUTES['*'] || []),
        ]
        
        const attrs = Array.from(element.attributes)
        for (const attr of attrs) {
          if (!allowedAttrs.includes(attr.name)) {
            element.removeAttribute(attr.name)
          }
          
          // Prevenir javascript: URLs
          if (attr.name === 'href' || attr.name === 'src') {
            const value = attr.value.toLowerCase().trim()
            if (value.startsWith('javascript:') || value.startsWith('data:')) {
              element.removeAttribute(attr.name)
            }
          }
        }
        
        // Adicionar rel="noopener noreferrer" para links externos
        if (tagName === 'a' && element.getAttribute('target') === '_blank') {
          element.setAttribute('rel', 'noopener noreferrer')
        }
        
        // Recursivamente limpar filhos
        cleanNode(element)
      } else if (child.nodeType === Node.COMMENT_NODE) {
        // Remover comentários HTML
        node.removeChild(child)
      }
    }
  }
  
  cleanNode(doc.body)
  
  return doc.body.innerHTML
}

/**
 * Escapa caracteres HTML especiais (para texto puro, não HTML)
 * @param text - Texto para escapar
 * @returns Texto com caracteres HTML escapados
 */
export function escapeHtml(text: string): string {
  if (!text) return ''
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char])
}

/**
 * Converte markdown básico para HTML sanitizado
 * @param markdown - Texto em markdown
 * @returns HTML sanitizado
 */
export function markdownToSafeHtml(markdown: string): string {
  if (!markdown) return ''
  
  let html = escapeHtml(markdown)
  
  // Converter markdown básico
  html = html
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  
  return html
}
