import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Link2,
  MoreVertical,
  Download,
  Copy,
  Edit,
  Trash2,
  Cloud,
  CloudUpload,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { DocumentWithChildren } from '@/types/docs';
import { toast } from 'sonner';
import { createDocument, deleteDocument, duplicateDocument, updateDocument } from '@/lib/docs/storage';
import { DriveService } from '@/services/google/drive.service';
import { useGoogleIntegration } from '@/hooks/use-google-integration';
import { useDocsDriverImport } from '@/hooks/use-docs-drive-import';
import { supabase } from '@/lib/supabase';

interface DocumentRowProps {
  document: DocumentWithChildren;
  onSelect: (docId: string) => void;
  onUpdate: () => void;
  projectId: string;
}

export function DocumentRow({ document, onSelect, onUpdate, projectId }: DocumentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(document.name);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [syncingWithDrive, setSyncingWithDrive] = useState(false);
  const { isConnected: isGoogleConnected } = useGoogleIntegration();
  const { syncWithDrive, exportToGoogleDocs, convertElementsToHtml } = useDocsDriverImport();

  const hasChildren = document.children && document.children.length > 0;
  const indent = (document.level || 0) * 20;

  const handleCreateSubpage = () => {
    const subpage = createDocument({
      name: 'Nova Subpágina',
      file_type: 'page',
      file_size: 0,
      parent_id: document.id,
      icon: '📄',
      project_id: projectId,
      page_data: {
        title: 'Nova Subpágina',
        elements: [
          { id: Math.random().toString(36).substr(2, 9), type: 'h1', content: 'Nova Subpágina' },
          { id: Math.random().toString(36).substr(2, 9), type: 'text', content: 'Comece a escrever...' },
        ],
      },
    });
    setIsExpanded(true);
    onUpdate();
    toast.success('Subpágina criada!');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?doc=${document.id}`;
    try {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch (error) {
      // Fallback for browsers that block clipboard API
      const textArea = window.document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      window.document.body.appendChild(textArea);
      textArea.select();
      try {
        window.document.execCommand('copy');
        toast.success('Link copiado!');
      } catch (err) {
        toast.error('Não foi possível copiar o link');
      }
      window.document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    } else {
      toast.info('Documento não tem arquivo para download');
    }
  };

  const handleDuplicate = () => {
    if (document.file_type === 'page') {
      duplicateDocument(document.id);
      onUpdate();
      toast.success('Página duplicada!');
    } else {
      toast.info('Apenas páginas podem ser duplicadas');
    }
  };

  const handleRename = () => {
    if (newName.trim()) {
      updateDocument(document.id, { name: newName.trim() });
      setIsRenaming(false);
      onUpdate();
      toast.success('Renomeado com sucesso!');
    }
  };

  const handleDelete = () => {
    if (confirm(`Deseja excluir "${document.name}"${hasChildren ? ' e suas subpáginas' : ''}?`)) {
      deleteDocument(document.id);
      onUpdate();
      toast.success('Documento excluído!');
    }
  };

  // 🔄 Enviar documento para o Google Drive
  const handleUploadToDrive = async () => {
    if (!isGoogleConnected) {
      toast.error('Conecte o Google primeiro', {
        description: 'Vá em Configurações → Integrações'
      });
      return;
    }

    setUploadingToDrive(true);
    try {
      // Se for página, exportar como HTML
      if (document.file_type === 'page' && document.page_data) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head><title>${document.name}</title></head>
          <body>
            <h1>${document.page_data.title || document.name}</h1>
            ${document.page_data.elements?.map((el: any) => {
              if (el.type === 'h1') return `<h1>${el.content}</h1>`;
              if (el.type === 'h2') return `<h2>${el.content}</h2>`;
              if (el.type === 'text') return `<p>${el.content}</p>`;
              if (el.type === 'list') return `<ul>${(el.content as string[]).map(item => `<li>${item}</li>`).join('')}</ul>`;
              return '';
            }).join('') || ''}
          </body>
          </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], `${document.name}.html`, { type: 'text/html' });
        
        const result = await DriveService.uploadFile(file);
        
        // Salvar referência do Drive no documento
        await supabase
          .from('documents')
          .update({
            drive_file_id: result.id,
            drive_synced_at: new Date().toISOString()
          })
          .eq('id', document.id);
        
        toast.success('Enviado para o Drive!', {
          description: 'Documento salvo no Google Drive',
          action: {
            label: 'Abrir',
            onClick: () => window.open(result.webViewLink, '_blank')
          }
        });
        onUpdate();
      } else if (document.file_url) {
        // Se for arquivo com URL, fazer upload direto
        toast.info('Uploading arquivo...', { description: 'Isso pode demorar um pouco' });
        
        const response = await fetch(document.file_url);
        const blob = await response.blob();
        const file = new File([blob], document.name, { type: blob.type });
        
        const result = await DriveService.uploadFile(file);
        
        await supabase
          .from('documents')
          .update({
            drive_file_id: result.id,
            drive_synced_at: new Date().toISOString()
          })
          .eq('id', document.id);
        
        toast.success('Arquivo enviado!', {
          action: {
            label: 'Abrir no Drive',
            onClick: () => window.open(result.webViewLink, '_blank')
          }
        });
        onUpdate();
      }
    } catch (error: any) {
      console.error('Erro ao enviar para o Drive:', error);
      toast.error('Erro ao enviar', { description: error.message });
    } finally {
      setUploadingToDrive(false);
    }
  };

  // 🔄 Sincronizar com o Drive (atualizar conteúdo do Drive → Local)
  const handleSyncWithDrive = async () => {
    if (!document.drive_file_id) return;
    
    setSyncingWithDrive(true);
    try {
      // Usar o hook que já converte HTML para elementos
      await syncWithDrive(document.id, document.drive_file_id);
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar', { description: error.message });
    } finally {
      setSyncingWithDrive(false);
    }
  };

  // 🚀 Exportar documento local para Google Drive (criar novo)
  const handleExportToGoogleDocs = async () => {
    if (!isGoogleConnected) {
      toast.error('Conecte o Google primeiro', {
        description: 'Vá em Configurações → Integrações'
      });
      return;
    }

    if (!document.page_data?.elements) {
      toast.error('Documento vazio');
      return;
    }

    setUploadingToDrive(true);
    try {
      await exportToGoogleDocs(
        document.id,
        document.page_data.elements,
        document.name
      );
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar', { description: error.message });
    } finally {
      setUploadingToDrive(false);
    }
  };

  // Abrir no Drive
  const handleOpenInDrive = async () => {
    if (!document.drive_file_id) return;
    
    try {
      const metadata = await DriveService.getFileMetadata(document.drive_file_id);
      if (metadata.webViewLink) {
        window.open(metadata.webViewLink, '_blank');
      }
    } catch (error) {
      toast.error('Erro ao abrir no Drive');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <tr
        className="group hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => {
          if (!isRenaming) {
            onSelect(document.id);
          }
        }}
      >
        <td className="py-2 px-2" style={{ paddingLeft: `${indent + 8}px` }}>
          <div className="flex items-center gap-2">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        <span className="text-lg">{document.icon || '📄'}</span>

        {isRenaming ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setNewName(document.name);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-7 flex-1"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="truncate max-w-[200px] sm:max-w-[300px]">{document.name}</span>
            {document.drive_file_id && (
              <span title="Sincronizado com Google Drive">
                <Cloud className="h-3 w-3 text-blue-500 flex-shrink-0" />
              </span>
            )}
          </div>
        )}

        <span className="text-xs text-muted-foreground hidden md:block min-w-[80px]">
          {formatFileSize(document.file_size)}
        </span>

        <span className="text-xs text-muted-foreground hidden lg:block min-w-[90px]">
          {formatDate(document.created_at)}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {document.file_type === 'page' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateSubpage();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
          >
            <Link2 className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Opções do Google Drive */}
              {isGoogleConnected && (
                <>
                  {document.drive_file_id ? (
                    <>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInDrive();
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                        Abrir no Drive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncWithDrive();
                        }}
                        disabled={syncingWithDrive}
                      >
                        {syncingWithDrive ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        {syncingWithDrive ? 'Sincronizando...' : 'Sincronizar'}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {document.file_type === 'page' && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportToGoogleDocs();
                          }}
                          disabled={uploadingToDrive}
                        >
                          {uploadingToDrive ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                          )}
                          {uploadingToDrive ? 'Exportando...' : 'Criar Google Doc'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadToDrive();
                        }}
                        disabled={uploadingToDrive}
                      >
                        {uploadingToDrive ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CloudUpload className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        {uploadingToDrive ? 'Enviando...' : 'Enviar para Drive'}
                      </DropdownMenuItem>
                    </>
                  )}
                  <div className="h-px bg-border my-1" />
                </>
              )}

              {document.file_url && (
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </DropdownMenuItem>
              )}
              {document.file_type === 'page' && (
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
        </td>
      </tr>

      {isExpanded && hasChildren && (
        <>
          {document.children!.map(child => (
            <DocumentRow
              key={child.id}
              document={child}
              onSelect={onSelect}
              onUpdate={onUpdate}
              projectId={projectId}
            />
          ))}
        </>
      )}
    </>
  );
}