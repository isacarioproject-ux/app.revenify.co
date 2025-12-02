import React, { useCallback, useState } from 'react';
import { Upload, X, File, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // em MB
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  maxFiles = 5,
  maxSize = 10,
  accept = '*',
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(
        (file) => file.size <= maxSize * 1024 * 1024
      );

      if (files.length + validFiles.length <= maxFiles) {
        const newFiles = [...files, ...validFiles].slice(0, maxFiles);
        setFiles(newFiles);
        onFileSelect(newFiles);
      }
    },
    [files, maxFiles, maxSize, onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.size <= maxSize * 1024 * 1024
    );

    if (files.length + validFiles.length <= maxFiles) {
      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onFileSelect(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="size-4" />;
    if (file.type.includes('pdf')) return <FileText className="size-4" />;
    return <File className="size-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (!disabled) handleDrop(e);
        }}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        )}
      >
        <Upload className="size-6 mx-auto mb-2 text-gray-400" />
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Arraste ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
          Máx. {maxFiles} arquivos, {maxSize}MB cada
        </p>
        <input
          type="file"
          id="file-input"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={disabled}
        >
          {disabled ? 'Enviando...' : 'Selecionar Arquivos'}
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="text-gray-600 dark:text-gray-400">
                {getFileIcon(file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-gray-200">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="size-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
