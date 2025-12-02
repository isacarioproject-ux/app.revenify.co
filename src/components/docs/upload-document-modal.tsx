import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File } from 'lucide-react';
import { toast } from 'sonner';
import { createDocument } from '@/lib/docs/storage';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUploadComplete: () => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  projectId,
  onUploadComplete,
}: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const detectFileType = (filename: string): 'pdf' | 'word' | 'excel' | 'image' | 'other' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'word';
    if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'other';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB for demo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // In a real app, this would upload to Supabase Storage
      // For now, we'll create a fake URL
      const fakeUrl = `https://example.com/uploads/${file.name}`;
      
      const fileType = detectFileType(file.name);
      
      createDocument({
        name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_url: fakeUrl,
        parent_id: null,
        icon: getFileIcon(fileType),
        project_id: projectId,
      });

      toast.success('Arquivo enviado com sucesso!');
      onUploadComplete();
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string): string => {
    const icons: Record<string, string> = {
      pdf: '📕',
      word: '📘',
      excel: '📊',
      image: '🖼️',
      other: '📎',
    };
    return icons[type] || '📎';
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Arquivo</DialogTitle>
          <DialogDescription className="sr-only">
            Envie um arquivo para adicionar aos documentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Selecionar Arquivo</Label>
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <File className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste aqui
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Máximo 10MB
                    </span>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="*/*"
                />
              </label>
            </div>
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              <p>Tipo: {detectFileType(file.name)}</p>
              <p>Tamanho: {formatFileSize(file.size)}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}