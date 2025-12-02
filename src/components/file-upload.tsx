import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, FileText, Image as ImageIcon } from 'lucide-react'

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
    setPreviewUrl(null)
    return undefined
  }, [file])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-2 border border-slate-800">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-12 h-12 object-cover rounded border border-slate-700"
        />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded text-slate-400">
          {file.type.startsWith('image/') ? (
            <ImageIcon className="h-6 w-6" />
          ) : (
            <FileText className="h-6 w-6" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">{file.name}</div>
        <div className="text-xs text-slate-500">{formatFileSize(file.size)}</div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number // em bytes
  currentFile?: File | null
}

export function FileUpload({ onFileSelect, accept = '*', maxSize = 10 * 1024 * 1024, currentFile }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(currentFile || null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError(null)
    
    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return false
    }
    
    return true
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    // Reset input para permitir selecionar o mesmo arquivo novamente
    event.target.value = ''
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    onFileSelect(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="grid gap-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
        aria-label="File input"
      />
      
      {!selectedFile ? (
        <div
          className={`
            border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-700 bg-slate-900/50 hover:border-indigo-400 hover:bg-slate-900/70'
            }
          `}
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center py-4 px-4">
            <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-indigo-400' : 'text-slate-500'}`} />
            <p className="text-xs font-medium text-slate-300 mb-1">
              Arraste o arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Máximo: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </div>
      ) : (
        <FilePreview file={selectedFile} onRemove={handleRemoveFile} />
      )}
      
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}
