import html2pdf from 'html2pdf.js'
import TurndownService from 'turndown'

export interface ExportOptions {
  title: string
  content: any[] // Array de elementos
  format: 'pdf' | 'markdown' | 'html' | 'text'
}

// Converter elementos para HTML
export const elementsToHTML = (elements: any[]): string => {
  let html = ''

  elements.forEach((element) => {
    switch (element.type) {
      case 'h1':
        html += `<h1>${element.content}</h1>\n`
        break
      case 'h2':
        html += `<h2>${element.content}</h2>\n`
        break
      case 'text':
        html += `<p>${element.content}</p>\n`
        break
      case 'list':
        html += '<ul>\n'
        element.content.forEach((item: string) => {
          html += `  <li>${item}</li>\n`
        })
        html += '</ul>\n'
        break
      case 'checklist':
        html += '<ul style="list-style: none; padding-left: 0;">\n'
        element.content.forEach((item: any) => {
          const checked = item.checked ? '☑' : '☐'
          html += `  <li>${checked} ${item.text}</li>\n`
        })
        html += '</ul>\n'
        break
      case 'table':
        html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">\n'
        html += '  <thead><tr>\n'
        element.content.headers.forEach((header: string) => {
          html += `    <th>${header}</th>\n`
        })
        html += '  </tr></thead>\n'
        html += '  <tbody>\n'
        element.content.rows.forEach((row: string[]) => {
          html += '    <tr>\n'
          row.forEach((cell: string) => {
            html += `      <td>${cell}</td>\n`
          })
          html += '    </tr>\n'
        })
        html += '  </tbody>\n</table>\n'
        break
    }
  })

  return html
}

// Exportar para PDF
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const htmlContent = elementsToHTML(options.content)
  
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${options.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 2em; margin-top: 1em; margin-bottom: 0.5em; }
        p { margin: 1em 0; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        table { margin: 1em 0; }
        th { background: #f0f0f0; font-weight: 600; text-align: left; }
      </style>
    </head>
    <body>
      <h1>${options.title}</h1>
      ${htmlContent}
    </body>
    </html>
  `

  const element = document.createElement('div')
  element.innerHTML = fullHTML

  const opt = {
    margin: 10,
    filename: `${options.title.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  }

  await html2pdf().set(opt).from(element).save()
}

// Exportar para Markdown
export const exportToMarkdown = (options: ExportOptions): string => {
  const htmlContent = elementsToHTML(options.content)
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  })
  
  const markdown = turndownService.turndown(htmlContent)
  return `# ${options.title}\n\n${markdown}`
}

// Exportar para HTML
export const exportToHTML = (options: ExportOptions): string => {
  const htmlContent = elementsToHTML(options.content)
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #1a1a1a; }
    h2 { font-size: 2em; margin-top: 1.5em; margin-bottom: 0.5em; color: #2a2a2a; }
    p { margin: 1em 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 1em 0; 
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    th { 
      background: #f5f5f5; 
      font-weight: 600; 
    }
    tr:hover { background: #f9f9f9; }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <h1>${options.title}</h1>
  ${htmlContent}
</body>
</html>`
}

// Exportar para texto plano
export const exportToText = (options: ExportOptions): string => {
  let text = `${options.title}\n${'='.repeat(options.title.length)}\n\n`

  options.content.forEach((element) => {
    switch (element.type) {
      case 'h1':
        text += `\n${element.content}\n${'-'.repeat(element.content.length)}\n\n`
        break
      case 'h2':
        text += `\n${element.content}\n${'~'.repeat(element.content.length)}\n\n`
        break
      case 'text':
        text += `${element.content}\n\n`
        break
      case 'list':
        element.content.forEach((item: string) => {
          text += `• ${item}\n`
        })
        text += '\n'
        break
      case 'checklist':
        element.content.forEach((item: any) => {
          const checked = item.checked ? '[x]' : '[ ]'
          text += `${checked} ${item.text}\n`
        })
        text += '\n'
        break
      case 'table':
        text += '\n'
        element.content.headers.forEach((header: string, i: number) => {
          text += header + (i < element.content.headers.length - 1 ? ' | ' : '')
        })
        text += '\n' + '-'.repeat(50) + '\n'
        element.content.rows.forEach((row: string[]) => {
          row.forEach((cell: string, i: number) => {
            text += cell + (i < row.length - 1 ? ' | ' : '')
          })
          text += '\n'
        })
        text += '\n'
        break
    }
  })

  return text
}

// Download de arquivo
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Copiar para clipboard
export const copyToClipboard = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    return false
  }
}

// Estatísticas do documento
export const getDocumentStats = (elements: any[]) => {
  let wordCount = 0
  let charCount = 0
  let elementCount = elements.length

  elements.forEach((element) => {
    let text = ''
    
    if (typeof element.content === 'string') {
      text = element.content
    } else if (Array.isArray(element.content)) {
      if (element.type === 'checklist') {
        text = element.content.map((item: any) => item.text).join(' ')
      } else {
        text = element.content.join(' ')
      }
    } else if (element.type === 'table') {
      const headers = element.content.headers.join(' ')
      const rows = element.content.rows.flat().join(' ')
      text = headers + ' ' + rows
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    wordCount += words.length
    charCount += text.length
  })

  return { wordCount, charCount, elementCount }
}
