import { useState, FormEvent } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'
import { useFileUpload } from '@/hooks/use-file-upload'
import { documentSchema, type DocumentFormData } from '@/lib/validations/document'
import { Loader2 } from 'lucide-react'
import type { Document, DocumentCategory } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'

interface DocumentDialogProps {
  document?: Document | null
  onSave: (data: DocumentFormData) => Promise<void>
  trigger?: React.ReactNode
  projects?: Array<{ id: string; name: string }>
}

const categoryOptions: { value: DocumentCategory; label: string }[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'Word', label: 'Word (DOC/DOCX)' },
  { value: 'Excel', label: 'Excel (XLS/XLSX)' },
  { value: 'PowerPoint', label: 'PowerPoint (PPT/PPTX)' },
  { value: 'Image', label: 'Imagem' },
  { value: 'Other', label: 'Outro' },
]

export function DocumentDialog({ document, onSave, trigger, projects = [] }: DocumentDialogProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, uploadActions] = useFileUpload()
  const [uploadProgress, setUploadProgress] = useState(0)
  const uploading = loading && uploadProgress > 0 && uploadProgress < 100
  
  // Função de upload real para Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(10)
      
      // Pegar o user_id atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }
      
      setUploadProgress(30)
      
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      setUploadProgress(50)
      
      // Upload para o bucket 'documents'
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Erro no upload:', error)
        throw error
      }
      
      setUploadProgress(80)
      
      // Pegar a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      setUploadProgress(100)
      
      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setUploadProgress(0)
      throw error
    }
  }
  
  const [formData, setFormData] = useState<DocumentFormData>({
    name: document?.name || '',
    description: document?.description || '',
    project_id: document?.project_id || null,
    category: document?.category || 'Other',
    tags: document?.tags || [],
    file_url: document?.file_url || null,
    file_type: document?.file_type || null,
    file_size: document?.file_size || null,
  })

  const [tagInput, setTagInput] = useState('')

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      // Detectar categoria baseada no tipo de arquivo
      let category: DocumentCategory = 'Other'
      if (file.type.includes('pdf')) category = 'PDF'
      else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) category = 'Word'
      else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) category = 'Excel'
      else if (file.type.includes('powerpoint') || file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) category = 'PowerPoint'
      else if (file.type.startsWith('image/')) category = 'Image'

      setFormData(prev => ({
        ...prev,
        name: prev.name || file.name,
        category,
        file_type: file.type,
        file_size: file.size,
      }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      let fileUrl = formData.file_url
      
      // Se tem arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
        if (!fileUrl) {
          throw new Error('Erro ao fazer upload do arquivo')
        }
      }
      
      // Validar com Zod
      const validated = documentSchema.parse({
        ...formData,
        file_url: fileUrl,
      })
      
      // Salvar documento
      await onSave(validated)
      
      toast.success(document ? t('common.updated') : t('common.created'), {
        description: document ? t('documents.updated') : t('documents.created')
      })
      
      // Fechar modal e resetar form
      setOpen(false)
      if (!document) {
        setFormData({
          name: '',
          description: '',
          project_id: null,
          category: 'Other',
          tags: [],
          file_url: null,
          file_type: null,
          file_size: null,
        })
        setTagInput('')
      }
    } catch (err: any) {
      if (err.errors) {
        // Erros de validação Zod
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach((error: any) => {
          const field = error.path[0]
          fieldErrors[field] = error.message
        })
        setErrors(fieldErrors)
      } else {
        toast.error(t('common.error'), {
          description: err.message || t('documents.saveError')
        })
        console.error('Erro ao salvar documento:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className="md:max-w-[480px]">
        <ModalHeader>
          <ModalTitle>{document ? 'Editar Documento' : 'Novo Documento'}</ModalTitle>
          <ModalDescription>
            {document ? 'Atualize as informações' : 'Faça upload do documento'}
          </ModalDescription>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Relatório Anual 2024"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData({ ...formData, category: value as DocumentCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.svg"
                maxSize={10 * 1024 * 1024}
                currentFile={selectedFile}
              />
              {uploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('documents.uploading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedFile ? `${selectedFile.name}` : 'PDF, Word, Excel, PowerPoint, Imagens'}
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" disabled={loading || uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fazendo upload...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : document ? (
                'Atualizar'
              ) : (
                'Criar Documento'
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
