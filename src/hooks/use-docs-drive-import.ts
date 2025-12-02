import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/workspace-context'
import { DriveService } from '@/services/google/drive.service'
import { createDocument } from '@/lib/storage'
import { toast } from 'sonner'
import type { DriveFile } from '@/types/drive'
import type { PageData } from '@/types/docs'

export function useDocsDriverImport() {
  const { currentWorkspace } = useWorkspace()
  const [importing, setImporting] = useState(false)

  /**
   * Extrair HTML interno preservando formatação básica
   */
  const extractFormattedContent = (element: Element): string => {
    // Preservar tags de formatação: <b>, <i>, <u>, <strong>, <em>
    const html = element.innerHTML
    
    // Limpar spans do Google Docs mas preservar conteúdo
    let cleaned = html
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      // Preservar negrito
      .replace(/<b[^>]*>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<strong[^>]*>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      // Preservar itálico
      .replace(/<i[^>]*>/gi, '_')
      .replace(/<\/i>/gi, '_')
      .replace(/<em[^>]*>/gi, '_')
      .replace(/<\/em>/gi, '_')
      // Remover outras tags HTML
      .replace(/<[^>]+>/g, '')
      // Limpar entidades HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Limpar múltiplos espaços
      .replace(/\s+/g, ' ')
      .trim()

    return cleaned
  }

  /**
   * Converter HTML do Google Docs para elementos PageData
   * Com melhor suporte a formatação
   */
  const convertHtmlToElements = useCallback((html: string): PageData['elements'] => {
    // Criar um DOM temporário para parsear o HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const elements: PageData['elements'] = []

    // Função para gerar ID único
    const genId = () => Math.random().toString(36).substr(2, 9)

    // Percorrer elementos do body recursivamente
    const processElement = (element: Element) => {
      const tagName = element.tagName.toLowerCase()
      
      // Mapear tags HTML para tipos de elemento
      switch (tagName) {
        case 'h1':
          const h1Content = extractFormattedContent(element)
          if (h1Content.trim()) {
            elements.push({ id: genId(), type: 'h1', content: h1Content })
          }
          break
          
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const hContent = extractFormattedContent(element)
          if (hContent.trim()) {
            elements.push({ id: genId(), type: 'h2', content: hContent })
          }
          break
          
        case 'ul':
        case 'ol':
          // Processar itens da lista como array de strings
          const listItems = element.querySelectorAll(':scope > li')
          const items: string[] = []
          listItems.forEach(li => {
            const itemContent = extractFormattedContent(li)
            if (itemContent.trim()) {
              items.push(itemContent)
            }
          })
          if (items.length > 0) {
            elements.push({ id: genId(), type: 'list', content: items })
          }
          break
          
        case 'p':
          const pContent = extractFormattedContent(element)
          if (pContent.trim()) {
            elements.push({ id: genId(), type: 'text', content: pContent })
          }
          break
          
        case 'table':
          // Extrair tabela como texto formatado
          const rows = element.querySelectorAll('tr')
          const tableContent: string[] = []
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th')
            const rowText = Array.from(cells).map(c => c.textContent?.trim() || '').join(' | ')
            if (rowText.trim()) {
              tableContent.push(rowText)
            }
          })
          if (tableContent.length > 0) {
            elements.push({ id: genId(), type: 'list', content: tableContent })
          }
          break
          
        case 'img':
          // Imagens: salvar URL como texto especial (TODO: suporte real a imagens)
          const src = element.getAttribute('src')
          if (src) {
            elements.push({ id: genId(), type: 'text', content: `[Imagem: ${src}]` })
          }
          break
          
        case 'hr':
          // Linha horizontal como separador
          elements.push({ id: genId(), type: 'text', content: '---' })
          break
          
        case 'div':
        case 'article':
        case 'section':
          // Processar filhos de containers
          Array.from(element.children).forEach(child => processElement(child))
          break
          
        case 'br':
          // Ignorar <br> sozinhos
          break
          
        default:
          // Tentar extrair conteúdo de texto
          const defaultContent = extractFormattedContent(element)
          if (defaultContent.trim() && !element.children.length) {
            elements.push({ id: genId(), type: 'text', content: defaultContent })
          } else if (element.children.length > 0) {
            // Processar filhos
            Array.from(element.children).forEach(child => processElement(child))
          }
      }
    }

    // Processar elementos do body
    Array.from(doc.body.children).forEach(child => processElement(child))

    // Se não houver elementos, adicionar um padrão
    if (elements.length === 0) {
      elements.push({
        id: genId(),
        type: 'text',
        content: 'Documento importado vazio'
      })
    }

    // Remover elementos duplicados consecutivos vazios
    const cleanedElements = elements.filter((el, idx) => {
      if (typeof el.content === 'string' && !el.content.trim()) return false
      return true
    })

    return cleanedElements.length > 0 ? cleanedElements : elements
  }, [])

  /**
   * Importar Google Doc
   */
  const importGoogleDoc = useCallback(async (driveFile: DriveFile, projectId: string) => {
    setImporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se é um Google Doc
      if (!driveFile.mimeType?.includes('document')) {
        toast.error('Apenas Google Docs podem ser importados')
        return null
      }

      // Exportar Google Doc como HTML
      const htmlContent = await DriveService.exportDocument(driveFile.id, 'text/html')

      // Converter HTML para elementos
      const elements = convertHtmlToElements(htmlContent)

      // Criar documento local
      const newDoc = createDocument({
        name: driveFile.name,
        file_type: 'page',
        file_size: driveFile.size || 0,
        parent_id: null,
        icon: '📄',
        project_id: projectId,
        page_data: {
          title: driveFile.name,
          elements
        },
        // Campos do Drive
        drive_file_id: driveFile.id,
        drive_sync_enabled: true,
        drive_synced_at: new Date().toISOString()
      })

      toast.success(`Documento "${driveFile.name}" importado!`)
      return newDoc
    } catch (error) {
      console.error('❌ Erro ao importar Google Doc:', error)
      toast.error('Erro ao importar documento')
      return null
    } finally {
      setImporting(false)
    }
  }, [convertHtmlToElements])

  /**
   * Importar múltiplos Google Docs
   */
  const importGoogleDocs = useCallback(async (driveFiles: DriveFile[], projectId: string) => {
    setImporting(true)
    try {
      // Filtrar apenas Google Docs
      const googleDocs = driveFiles.filter(f => f.mimeType?.includes('document'))
      
      if (googleDocs.length === 0) {
        toast.error('Nenhum Google Doc selecionado')
        return []
      }

      // Importar todos
      const importedDocs = await Promise.all(
        googleDocs.map(doc => importGoogleDoc(doc, projectId))
      )

      const successCount = importedDocs.filter(d => d !== null).length
      
      if (successCount > 0) {
        toast.success(`${successCount} documento(s) importado(s)!`)
      }

      return importedDocs.filter(d => d !== null)
    } catch (error) {
      console.error('❌ Erro ao importar documentos:', error)
      toast.error('Erro ao importar documentos')
      return []
    } finally {
      setImporting(false)
    }
  }, [importGoogleDoc])

  /**
   * Sincronizar documento com Google Drive
   */
  const syncWithDrive = useCallback(async (documentId: string, driveFileId: string) => {
    try {
      // Exportar Google Doc como HTML
      const htmlContent = await DriveService.exportDocument(driveFileId, 'text/html')

      // Converter HTML para elementos
      const elements = convertHtmlToElements(htmlContent)

      // Atualizar documento local via Supabase
      const { error } = await supabase
        .from('documents')
        .update({
          page_data: { elements } as any, // TypeScript workaround
          drive_synced_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) throw error

      toast.success('Documento sincronizado!')
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error)
      toast.error('Erro ao sincronizar documento')
    }
  }, [convertHtmlToElements])

  /**
   * Converter elementos PageData para HTML
   */
  const convertElementsToHtml = useCallback((elements: PageData['elements'], title: string): string => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; line-height: 1.6; }
    ul, ol { margin-bottom: 1em; padding-left: 2em; }
    li { margin-bottom: 0.5em; }
  </style>
</head>
<body>
`

    for (const element of elements) {
      switch (element.type) {
        case 'h1':
          // Converter markdown bold/italic
          const h1Content = String(element.content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
          html += `<h1>${h1Content}</h1>\n`
          break
          
        case 'h2':
          const h2Content = String(element.content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
          html += `<h2>${h2Content}</h2>\n`
          break
          
        case 'text':
          const textContent = String(element.content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
          html += `<p>${textContent}</p>\n`
          break
          
        case 'list':
          if (Array.isArray(element.content)) {
            html += '<ul>\n'
            for (const item of element.content) {
              const listContent = String(item)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
              html += `  <li>${listContent}</li>\n`
            }
            html += '</ul>\n'
          }
          break
          
        default:
          if (element.content) {
            html += `<p>${String(element.content)}</p>\n`
          }
      }
    }

    html += '</body>\n</html>'
    return html
  }, [])

  /**
   * 🚀 Exportar documento local para Google Docs (criar novo)
   */
  const exportToGoogleDocs = useCallback(async (
    documentId: string,
    elements: PageData['elements'],
    title: string
  ): Promise<string | null> => {
    setImporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Converter elementos para HTML
      const htmlContent = convertElementsToHtml(elements, title)

      // Criar arquivo HTML temporário
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const file = new File([blob], `${title}.html`, { type: 'text/html' })

      // Upload para o Drive
      const uploadedFile = await DriveService.uploadFile(file)

      // Atualizar documento local com referência do Drive
      await supabase
        .from('documents')
        .update({
          drive_file_id: uploadedFile.id,
          drive_sync_enabled: true,
          drive_synced_at: new Date().toISOString()
        })
        .eq('id', documentId)

      toast.success('Documento exportado para Google Drive!', {
        action: {
          label: 'Abrir',
          onClick: () => window.open(uploadedFile.webViewLink, '_blank')
        }
      })

      return uploadedFile.id
    } catch (error) {
      console.error('❌ Erro ao exportar para Google Docs:', error)
      toast.error('Erro ao exportar documento')
      return null
    } finally {
      setImporting(false)
    }
  }, [convertElementsToHtml])

  /**
   * 🔄 Upload de alterações para o Drive (atualizar existente)
   */
  const uploadChangesToDrive = useCallback(async (
    driveFileId: string,
    elements: PageData['elements'],
    title: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Converter elementos para HTML
      const htmlContent = convertElementsToHtml(elements, title)

      // Criar arquivo HTML
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const file = new File([blob], `${title}.html`, { type: 'text/html' })

      // Re-upload (substituir) - usando a API de upload
      // Como o Google Drive não tem update simples, vamos criar novo e deletar antigo
      const newFile = await DriveService.uploadFile(file)
      
      // Deletar arquivo antigo
      await DriveService.deleteFile(driveFileId)

      toast.success('Alterações enviadas para o Drive!')
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar alterações:', error)
      toast.error('Erro ao enviar alterações')
      return false
    }
  }, [convertElementsToHtml])

  /**
   * 📥 Importar imagem do Google Drive
   */
  const importDriveImage = useCallback(async (driveFile: DriveFile): Promise<string | null> => {
    try {
      // Verificar se é uma imagem
      if (!driveFile.mimeType?.startsWith('image/')) {
        toast.error('Arquivo não é uma imagem')
        return null
      }

      // Retornar URL do thumbnail ou webViewLink
      // O Google Drive fornece URLs públicas para thumbnails
      const imageUrl = driveFile.thumbnailLink || driveFile.webContentLink || driveFile.webViewLink

      if (!imageUrl) {
        toast.error('Não foi possível obter URL da imagem')
        return null
      }

      return imageUrl
    } catch (error) {
      console.error('❌ Erro ao importar imagem:', error)
      toast.error('Erro ao importar imagem')
      return null
    }
  }, [])

  return {
    importing,
    importGoogleDoc,
    importGoogleDocs,
    syncWithDrive,
    exportToGoogleDocs,
    uploadChangesToDrive,
    importDriveImage,
    convertElementsToHtml
  }
}
