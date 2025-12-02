import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { OnboardingStepProps } from '@/types/onboarding'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Briefcase, FolderKanban, Rocket } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function ManagementStep({ onNext }: OnboardingStepProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'project' | 'document'>('project')
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome')
      return
    }

    if (!user) return

    setLoading(true)

    try {
      // Salvar no modo "Pessoal" (workspace_id = null)
      // Dados pessoais do onboarding ficam sem workspace
      console.log('🏠 Salvando no modo PESSOAL (sem workspace)')

      if (type === 'project') {
        // Criar projeto
        const projectData = {
          name: name.trim(),
          description: description.trim() || null,
          workspace_id: null,  // ✅ Modo PESSOAL (sem workspace)
          user_id: user.id,
          status: 'active'
        }

        console.log('📝 Criando projeto com dados:', projectData)

        const { error } = await supabase
          .from('projects')
          .insert(projectData)

        if (error) {
          console.error('❌ Erro ao criar projeto:', error.message, error)
          throw error
        }

        console.log('✅ Projeto criado com sucesso!')
        toast.success('📁 Primeiro projeto criado!')
      } else {
        // Criar documento
        const documentData = {
          title: name.trim(),
          content: description.trim() || '',
          workspace_id: null,  // ✅ Modo PESSOAL (sem workspace)
          created_by: user.id,
          type: 'document'
        }

        console.log('📝 Criando documento com dados:', documentData)

        const { error } = await supabase
          .from('documents')
          .insert(documentData)

        if (error) {
          console.error('❌ Erro ao criar documento:', error.message, error)
          throw error
        }

        console.log('✅ Documento criado com sucesso!')
        toast.success('📄 Primeiro documento criado!')
      }
      
      onNext({ 
        createdFirstProject: type === 'project',
        createdFirstDocument: type === 'document'
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar:', error)
      toast.error(`Erro ao criar: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    setSkipping(true)
    onNext({ 
      createdFirstProject: false,
      createdFirstDocument: false
    })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg space-y-2 pb-40 sm:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Logo com gradiente colorido de fundo */}
        <div className="text-center space-y-1">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40 overflow-visible">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
        </div>

        {/* Header - SEM ÍCONE */}
        <div className="text-center space-y-0.5">
          <h2 className="text-base font-semibold text-gray-900">📊 Crie seu primeiro {type === 'project' ? 'projeto' : 'documento'}!</h2>
          <p className="text-xs text-gray-600">Organize seu trabalho e documentos</p>
        </div>

        {/* Formulário - SEM CARD */}
        <div className="space-y-3">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === 'project' ? 'primary' : 'outline'}
            className="justify-start"
            onClick={() => setType('project')}
            disabled={loading}
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            Projeto
          </Button>
          <Button
            type="button"
            variant={type === 'document' ? 'primary' : 'outline'}
            className="justify-start"
            onClick={() => setType('document')}
            disabled={loading}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Documento
          </Button>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {type === 'project' ? 'Nome do Projeto' : 'Título do Documento'}
          </Label>
          <Input
            id="name"
            placeholder={type === 'project' 
              ? 'Ex: Lançamento Produto 2025, Site da Empresa...'
              : 'Ex: Proposta Cliente X, Contrato...'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Descrição <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder={type === 'project'
              ? 'Descreva o objetivo e escopo do projeto...'
              : 'Adicione anotações, detalhes ou contexto...'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
          />
        </div>

        {/* Dica */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/50 p-4 rounded-lg text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="font-medium">💡 Dica:</p>
          </div>
          <p className="text-muted-foreground text-xs">
            {type === 'project'
              ? 'Projetos ajudam a organizar tarefas, documentos e acompanhar progresso em um só lugar!'
              : 'Documentos são perfeitos para contratos, propostas, anotações e compartilhar com a equipe!'}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-1">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={loading || skipping}
            className="h-10 text-sm font-medium border-gray-300 hover:bg-gray-100 bg-white/60"
          >
            {skipping ? 'Pulando...' : 'Fazer depois'}
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || loading}
            className="flex-1 h-10 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              `Criar ${type === 'project' ? 'projeto' : 'documento'}`
            )}
          </Button>
        </div>
        </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-2 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Entrar com outro usuário
        </Button>
      </div>

    </div>
  )
}
