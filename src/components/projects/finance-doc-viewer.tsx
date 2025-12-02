import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface FinanceDocViewerProps {
  documentId: string | null
  open: boolean
  onClose: () => void
}

interface FinanceDocument {
  id: string
  name: string
  template_type: string
  created_at: string
  updated_at: string
}

export function FinanceDocViewer({ documentId, open, onClose }: FinanceDocViewerProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [document, setDocument] = useState<FinanceDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saving, setSaving] = useState(false)

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Carregar documento
  useEffect(() => {
    if (documentId && open) {
      loadDocument()
    } else if (!open) {
      // Resetar estado ao fechar
      setIsEditing(false)
      setDocument(null)
    }
  }, [documentId, open])

  const loadDocument = async () => {
    if (!documentId || !user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('finance_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setDocument(data)
      setEditedName(data.name)
    } catch (error: any) {
      console.error('Erro ao carregar documento:', error)
      toast.error('Erro ao carregar documento')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!document || !user) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('finance_documents')
        .update({ name: editedName.trim() })
        .eq('id', document.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Documento atualizado com sucesso')
      setDocument({ ...document, name: editedName.trim() })
      setIsEditing(false)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar documento')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedName(document?.name || '')
    setIsEditing(false)
  }

  const handleEditInPage = () => {
    if (document) {
      navigate(`/minha-financa?doc=${document.id}`)
      onClose()
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando documento...</p>
          </div>
        </div>
      )
    }

    if (!document) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Documento não encontrado</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Header do documento */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-lg font-semibold mb-1"
                placeholder="Nome do documento"
              />
            ) : (
              <h3 className="text-lg font-semibold mb-1">{document.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{document.template_type}</Badge>
              <span className="text-xs text-muted-foreground">
                Criado em {new Date(document.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo do documento */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tipo de Template</label>
              <p className="text-sm">{document.template_type}</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Data de Criação</label>
              <p className="text-sm">{new Date(document.created_at).toLocaleString('pt-BR')}</p>
            </div>
            
            {document.updated_at && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Última Atualização</label>
                <p className="text-sm">{new Date(document.updated_at).toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Edite o nome acima e clique em Salvar, ou clique em "Editar Completo" para mais opções.'
              : 'A visualização completa dos campos específicos do documento será implementada em breve.'}
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <div>
            {!isEditing && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || !editedName.trim()}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEditInPage}>
                  Editar Completo
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Mobile: usar Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Documento Financeiro</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: usar Dialog
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documento Financeiro</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
