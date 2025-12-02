import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { GripVertical, Maximize2, Plus, MoreVertical, Copy, Trash2, Minimize2, Sidebar, Download, Cloud, FileText } from 'lucide-react';
import { useDocsCard } from '../hooks/useDocsCard';
import { useDocsDriverImport } from '../hooks/use-docs-drive-import';
import { DocumentRow } from './document-row';
import { PageViewer } from './page-viewer';
import { PageEditorSidebar } from './page-editor-sidebar';
import { TemplateSelectorDialog } from './template-selector-dialog';
import { UploadDocumentModal } from './upload-document-modal';
import { ExportMenu } from './export-menu';
import { DrivePickerDialog } from './drive/drive-picker-dialog';
import { toast } from 'sonner';
import { createDocument, deleteDocument as deleteDoc, duplicateDocument, getDocument } from '../lib/storage';
import { PageData } from '../types/docs';

interface DocsCardProps {
  projectId: string;
  workspaceName?: string;
}

export function DocsCard({ projectId, workspaceName }: DocsCardProps) {
  const [cardName, setCardName] = useState('Documentos');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const { documents, loading, refetch } = useDocsCard(projectId);
  const { importing, importGoogleDocs } = useDocsDriverImport();

  // Load card name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`docs-card-name-${projectId}`);
    if (saved) setCardName(saved);
  }, [projectId]);

  const handleCardNameChange = (value: string) => {
    setCardName(value);
    localStorage.setItem(`docs-card-name-${projectId}`, value);
  };

  const handleCreateBlankPage = () => {
    const newDoc = createDocument({
      name: 'Nova Página',
      file_type: 'page',
      file_size: 0,
      parent_id: null,
      icon: '📄',
      project_id: projectId,
      page_data: {
        title: 'Nova Página',
        elements: [
          { id: Math.random().toString(36).substr(2, 9), type: 'h1', content: 'Nova Página' },
          { id: Math.random().toString(36).substr(2, 9), type: 'text', content: 'Comece a escrever...' },
        ],
      },
    });
    refetch();
    setSelectedDocId(newDoc.id);
    setShowPageEditor(true);
    toast.success('Página criada!');
  };

  const handleDuplicateCard = () => {
    toast.success('Card duplicado!');
  };

  const handleDeleteCard = () => {
    if (confirm('Deseja excluir este card e todos os seus documentos?')) {
      documents.forEach(doc => deleteDoc(doc.id));
      refetch();
      toast.success('Card excluído!');
    }
  };

  const handleDocumentSelect = (docId: string) => {
    const doc = getDocument(docId);
    if (doc?.file_type === 'page') {
      setSelectedDocId(docId);
      setShowPageEditor(true);
    }
  };

  const handleImportFromDrive = async (driveFiles: any[]) => {
    await importGoogleDocs(driveFiles, projectId);
    refetch();
    setShowDrivePicker(false);
  };

  const selectedDoc = selectedDocId ? getDocument(selectedDocId) : null;

  return (
    <>
      <Card className="group">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            <Input
              value={cardName}
              onChange={(e) => handleCardNameChange(e.target.value)}
              className="flex-1 h-9 border-transparent hover:border-border focus:border-border transition-colors"
            />

            {workspaceName && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {workspaceName}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowTemplateSelector(true)}>
                  <span className="mr-2">✨</span>
                  De Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateBlankPage}>
                  <span className="mr-2">📄</span>
                  Página em Branco
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUploadModal(true)}>
                  <span className="mr-2">📤</span>
                  Upload Arquivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDrivePicker(true)} disabled={importing}>
                  <Cloud className="mr-2 h-4 w-4" />
                  Importar do Drive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicateCard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteCard} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando documentos...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-2">Nenhum documento ainda</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Crie sua primeira página ou importe do Drive
                  </p>
                  <Button onClick={handleCreateBlankPage} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira página
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {documents.map(doc => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onSelect={handleDocumentSelect}
                      onUpdate={refetch}
                      projectId={projectId}
                    />
                  ))}
                </div>
              )}
            </div>

            {showPageEditor && selectedDoc && (
              <div className="w-80 border-l pl-4">
                <PageEditorSidebar docId={selectedDocId!} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expanded Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className={`max-w-7xl ${isFullscreen ? 'h-screen' : 'h-[95vh]'}`}>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <DialogTitle>{cardName}</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização expandida dos documentos
            </DialogDescription>
            <div className="flex items-center gap-2">
              {!showPageEditor && selectedDocId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPageEditor(true)}
                >
                  <Sidebar className="h-4 w-4 mr-2" />
                  Abrir Sidebar
                </Button>
              )}
              
              {selectedDocId && (
                <ExportMenu docId={selectedDocId} />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex gap-4 overflow-hidden flex-1">
            {selectedDocId && selectedDoc?.file_type === 'page' ? (
              <>
                <div className="flex-1 overflow-auto">
                  <PageViewer
                    docId={selectedDocId}
                    onBack={() => setSelectedDocId(null)}
                  />
                </div>
                {showPageEditor && (
                  <div className="w-80 border-l pl-4 overflow-auto">
                    <PageEditorSidebar docId={selectedDocId} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 space-y-1 overflow-auto">
                {documents.map(doc => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onSelect={handleDocumentSelect}
                    onUpdate={refetch}
                    projectId={projectId}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selector */}
      <TemplateSelectorDialog
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        projectId={projectId}
        onTemplateSelect={(template) => {
          const newDoc = createDocument({
            name: template.name,
            file_type: 'page',
            file_size: 0,
            parent_id: null,
            icon: template.emoji,
            project_id: projectId,
            template_id: template.id,
            page_data: {
              title: template.name,
              elements: template.elements.map(el => ({
                ...el,
                id: Math.random().toString(36).substr(2, 9),
              })),
              iconEmoji: template.emoji,
            },
          });
          refetch();
          toast.success(`${template.name} criado!`);
          setShowTemplateSelector(false);
        }}
      />

      {/* Upload Modal */}
      <UploadDocumentModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        projectId={projectId}
        onUploadComplete={refetch}
      />

      {/* Drive Picker */}
      <DrivePickerDialog
        open={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onSelect={handleImportFromDrive}
        multiple={true}
        accept={['application/vnd.google-apps.document']}
      />
    </>
  );
}