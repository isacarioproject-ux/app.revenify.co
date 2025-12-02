import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Code, Printer, BarChart3, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getDocument } from '@/lib/docs/storage';
import { PageElement } from '@/types/docs';

interface ExportMenuProps {
  docId: string;
}

export function ExportMenu({ docId }: ExportMenuProps) {
  const [showStats, setShowStats] = useState(false);

  const doc = getDocument(docId);

  const exportToPDF = () => {
    toast.info('Exportação para PDF iniciada...');
    setTimeout(() => {
      toast.success('PDF gerado! (simulado)');
    }, 1000);
  };

  const exportToMarkdown = () => {
    if (!doc?.page_data) return;

    const elements = doc.page_data.elements;
    let markdown = `# ${doc.page_data.title}\n\n`;

    elements.forEach((el: PageElement) => {
      switch (el.type) {
        case 'h1':
          markdown += `# ${el.content}\n\n`;
          break;
        case 'h2':
          markdown += `## ${el.content}\n\n`;
          break;
        case 'text':
          markdown += `${el.content}\n\n`;
          break;
        case 'list':
          (el.content as string[]).forEach(item => {
            markdown += `- ${item}\n`;
          });
          markdown += '\n';
          break;
        case 'checklist':
          (el.content as any[]).forEach(item => {
            markdown += `- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
          });
          markdown += '\n';
          break;
        case 'table':
          const table = el.content as any;
          markdown += `| ${table.headers.join(' | ')} |\n`;
          markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
          table.rows.forEach((row: string[]) => {
            markdown += `| ${row.join(' | ')} |\n`;
          });
          markdown += '\n';
          break;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown exportado!');
  };

  const exportToHTML = () => {
    if (!doc?.page_data) return;

    const elements = doc.page_data.elements;
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${doc.page_data.title}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>${doc.page_data.title}</h1>
`;

    elements.forEach((el: PageElement) => {
      switch (el.type) {
        case 'h1':
          html += `  <h1>${el.content}</h1>\n`;
          break;
        case 'h2':
          html += `  <h2>${el.content}</h2>\n`;
          break;
        case 'text':
          html += `  <p>${String(el.content).replace(/\n/g, '<br>')}</p>\n`;
          break;
        case 'list':
          html += '  <ul>\n';
          (el.content as string[]).forEach(item => {
            html += `    <li>${item}</li>\n`;
          });
          html += '  </ul>\n';
          break;
        case 'checklist':
          html += '  <ul style="list-style: none;">\n';
          (el.content as any[]).forEach(item => {
            html += `    <li><input type="checkbox" ${item.checked ? 'checked' : ''}> ${item.text}</li>\n`;
          });
          html += '  </ul>\n';
          break;
        case 'table':
          const table = el.content as any;
          html += '  <table>\n    <thead>\n      <tr>\n';
          table.headers.forEach((h: string) => {
            html += `        <th>${h}</th>\n`;
          });
          html += '      </tr>\n    </thead>\n    <tbody>\n';
          table.rows.forEach((row: string[]) => {
            html += '      <tr>\n';
            row.forEach(cell => {
              html += `        <td>${cell}</td>\n`;
            });
            html += '      </tr>\n';
          });
          html += '    </tbody>\n  </table>\n';
          break;
      }
    });

    html += `</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML exportado!');
  };

  const exportToText = () => {
    if (!doc?.page_data) return;

    const elements = doc.page_data.elements;
    let text = `${doc.page_data.title}\n${'='.repeat(doc.page_data.title.length)}\n\n`;

    elements.forEach((el: PageElement) => {
      switch (el.type) {
        case 'h1':
        case 'h2':
          text += `${el.content}\n${'-'.repeat(String(el.content).length)}\n\n`;
          break;
        case 'text':
          text += `${el.content}\n\n`;
          break;
        case 'list':
          (el.content as string[]).forEach(item => {
            text += `• ${item}\n`;
          });
          text += '\n';
          break;
        case 'checklist':
          (el.content as any[]).forEach(item => {
            text += `${item.checked ? '[✓]' : '[ ]'} ${item.text}\n`;
          });
          text += '\n';
          break;
        case 'table':
          const table = el.content as any;
          text += table.headers.join('\t') + '\n';
          table.rows.forEach((row: string[]) => {
            text += row.join('\t') + '\n';
          });
          text += '\n';
          break;
      }
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Texto exportado!');
  };

  const copyMarkdown = () => {
    if (!doc?.page_data) return;

    const elements = doc.page_data.elements;
    let markdown = `# ${doc.page_data.title}\n\n`;

    elements.forEach((el: PageElement) => {
      switch (el.type) {
        case 'h1':
          markdown += `# ${el.content}\n\n`;
          break;
        case 'h2':
          markdown += `## ${el.content}\n\n`;
          break;
        case 'text':
          markdown += `${el.content}\n\n`;
          break;
        case 'list':
          (el.content as string[]).forEach(item => {
            markdown += `- ${item}\n`;
          });
          markdown += '\n';
          break;
        case 'checklist':
          (el.content as any[]).forEach(item => {
            markdown += `- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
          });
          markdown += '\n';
          break;
      }
    });

    try {
      navigator.clipboard.writeText(markdown);
      toast.success('Markdown copiado!');
    } catch (error) {
      // Fallback for browsers that block clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = markdown;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Markdown copiado!');
      } catch (err) {
        toast.error('Não foi possível copiar o markdown');
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateStats = () => {
    if (!doc?.page_data) return null;

    const elements = doc.page_data.elements;
    let wordCount = 0;
    let charCount = 0;

    elements.forEach((el: PageElement) => {
      const text = String(el.content);
      wordCount += text.split(/\s+/).filter(w => w.length > 0).length;
      charCount += text.length;
    });

    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      words: wordCount,
      characters: charCount,
      elements: elements.length,
      readingTime,
    };
  };

  const stats = calculateStats();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToMarkdown}>
            <FileText className="h-4 w-4 mr-2" />
            Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToHTML}>
            <Code className="h-4 w-4 mr-2" />
            HTML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToText}>
            <FileText className="h-4 w-4 mr-2" />
            Texto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyMarkdown}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowStats(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Statistics Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estatísticas do Documento</DialogTitle>
            <DialogDescription className="sr-only">
              Visualize estatísticas detalhadas do documento
            </DialogDescription>
          </DialogHeader>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl mb-1">{stats.words}</div>
                  <div className="text-sm text-muted-foreground">Palavras</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl mb-1">{stats.characters}</div>
                  <div className="text-sm text-muted-foreground">Caracteres</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl mb-1">{stats.elements}</div>
                  <div className="text-sm text-muted-foreground">Elementos</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl mb-1">~{stats.readingTime} min</div>
                  <div className="text-sm text-muted-foreground">Tempo de leitura</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}