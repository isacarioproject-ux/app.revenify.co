import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
} from 'lucide-react';
import { DocumentWithChildren } from '../types/docs';
import { toast } from 'sonner';
import { createDocument, deleteDocument, duplicateDocument, updateDocument } from '../lib/storage';

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
      <div
        className="group flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => {
          if (!isRenaming) {
            onSelect(document.id);
          }
        }}
      >
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
          <>
            <span className="flex-1 truncate max-w-[200px] sm:max-w-[300px]">{document.name}</span>
            {document.drive_file_id && (
              <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                <Cloud className="h-3 w-3" />
                <span className="hidden sm:inline">Drive</span>
              </Badge>
            )}
          </>
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
            <DropdownMenuContent align="end">
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

      {isExpanded && hasChildren && (
        <div>
          {document.children!.map(child => (
            <DocumentRow
              key={child.id}
              document={child}
              onSelect={onSelect}
              onUpdate={onUpdate}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </>
  );
}