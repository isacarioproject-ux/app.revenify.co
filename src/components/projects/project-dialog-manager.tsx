import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectManager } from './project-manager'

interface ProjectDialogManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated?: () => void
  // Se passar projectId, abre o gestor. Se não, abre criação
  initialProjectId?: string
  initialProjectName?: string
}

type DialogMode = 'create' | 'manager'

export function ProjectDialogManager({
  open,
  onOpenChange,
  onProjectCreated,
  initialProjectId,
  initialProjectName,
}: ProjectDialogManagerProps) {
  const [mode, setMode] = useState<DialogMode>(
    initialProjectId ? 'manager' : 'create'
  )
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(
    initialProjectId
  )
  const [currentProjectName, setCurrentProjectName] = useState<string>(
    initialProjectName || ''
  )

  // Atualizar modo quando initialProjectId muda
  useEffect(() => {
    if (open) {
      console.log('ProjectDialogManager - open:', open, 'initialProjectId:', initialProjectId, 'mode:', mode)
      if (initialProjectId) {
        console.log('Mudando para modo MANAGER')
        setMode('manager')
        setCurrentProjectId(initialProjectId)
        setCurrentProjectName(initialProjectName || '')
      } else {
        console.log('Mudando para modo CREATE')
        setMode('create')
        setCurrentProjectId(undefined)
        setCurrentProjectName('')
      }
    }
  }, [open, initialProjectId, initialProjectName])

  // Quando fecha, reseta para modo criação
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMode('create')
      setCurrentProjectId(undefined)
      setCurrentProjectName('')
    }
    onOpenChange(open)
  }

  // Quando cria um projeto, abre o gestor dele
  const handleProjectCreated = (projectId?: string, projectName?: string) => {
    if (projectId && projectName) {
      setCurrentProjectId(projectId)
      setCurrentProjectName(projectName)
      setMode('manager')
    }
    onProjectCreated?.()
  }

  // Volta para criação
  const handleBackToCreate = () => {
    setMode('create')
    setCurrentProjectId(undefined)
    setCurrentProjectName('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        showClose={false} 
        className="!w-screen sm:max-w-[900px] md:!rounded-lg !rounded-none p-0 gap-0 [&>button]:hidden max-h-[100dvh] flex flex-col"
      >
        <DialogTitle className="sr-only">
          {mode === 'create' ? 'Criar Novo Projeto' : `Gestor de Projeto: ${currentProjectName}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'create' ? 'Formulário para criar um novo projeto' : 'Gerenciador de projeto com tarefas e documentos'}
        </DialogDescription>
        {mode === 'create' ? (
          <CreateProjectDialog
            open={open}
            onOpenChange={handleOpenChange}
            onProjectCreated={handleProjectCreated}
            embedded
          />
        ) : (
          <ProjectManager
            projectId={currentProjectId!}
            projectName={currentProjectName}
            onBack={handleBackToCreate}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
