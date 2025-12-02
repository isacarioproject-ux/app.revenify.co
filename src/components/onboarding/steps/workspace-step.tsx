import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OnboardingStepProps } from '@/types/onboarding'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

export function WorkspaceStep({ onNext, onBack }: OnboardingStepProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Auto-gerar slug baseado no nome
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    }
  }
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleNext = async () => {
    // Evitar múltiplas chamadas
    if (loading) {
      console.log('⚠️ Já está criando workspace, aguarde...')
      return
    }

    if (!name.trim()) {
      toast.error('Digite um nome para o workspace')
      return
    }

    if (!slug.trim()) {
      toast.error('Digite um slug para o workspace')
      return
    }

    if (!user) return

    setLoading(true)

    try {
      console.log('🏢 Criando novo workspace:', name.trim())

      // Upload do logo se existir
      let logoUrl = null
      if (logo) {
        const fileExt = logo.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('workspace-logos')
          .upload(fileName, logo)

        if (uploadError) {
          console.warn('⚠️ Erro ao fazer upload do logo:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('workspace-logos')
            .getPublicUrl(fileName)
          logoUrl = publicUrl
        }
      }

      // Criar workspace usando RPC function
      const { data: workspaceId, error } = await supabase.rpc('create_workspace_with_owner', {
        workspace_name: name.trim(),
        workspace_slug: slug.trim(),
        workspace_description: null
      })

      if (error) {
        console.error('❌ Erro ao criar workspace:', error.message, error)
        
        // Mensagem de erro específica
        if (error.code === '23505') {
          toast.error('Erro: Este workspace já existe. Aguarde um momento e tente novamente com outro nome.')
        } else {
          toast.error(`Erro ao criar workspace: ${error.message}`)
        }
        
        setLoading(false)
        return
      }

      // Atualizar avatar se logo foi enviado
      if (logoUrl && workspaceId) {
        await supabase
          .from('workspaces')
          .update({ avatar_url: logoUrl })
          .eq('id', workspaceId)
      }

      console.log('✅ Workspace criado com sucesso:', workspaceId)

      toast.success('Workspace criado!')
      
      onNext({
        workspaceName: name,
        workspaceId: workspaceId
      })
    } catch (error: any) {
      console.error('❌ Erro ao criar workspace:', error)
      toast.error(`Erro ao criar workspace: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Gradiente branco de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 pointer-events-none" />
      
      <div className="relative w-full max-w-lg space-y-6 sm:space-y-8">
        {/* Logo Isacar.dev com gradiente colorido */}
        <div className="text-center">
          <div className="relative inline-block">
            {/* Gradiente colorido atrás do logo */}
            <div className="absolute inset-0 blur-2xl sm:blur-3xl opacity-40">
              <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-blue-400 rounded-full"></div>
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/4 w-20 h-20 sm:w-24 sm:h-24 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-20 h-20 sm:w-24 sm:h-24 bg-red-400 rounded-full"></div>
            </div>
            
            {/* Logo */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 relative z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Isacar.dev
            </h1>
          </div>
        </div>

        {/* Título e descrição */}
        <div className="text-center space-y-2 px-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Crie seu espaço de trabalho
          </h2>
          <p className="text-sm text-gray-500">
            Configure um espaço compartilhado para gerenciar seus vínculos com sua equipe.
          </p>
        </div>

        {/* Formulário */}
        <div className="space-y-4 sm:space-y-5 px-4">
        {/* Nome do workspace */}
        <div className="space-y-2">
          <Label htmlFor="workspace-name" className="text-sm font-medium text-gray-700">
            Nome do espaço de trabalho
          </Label>
          <Input
            id="workspace-name"
            placeholder="Isacar"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={loading}
            autoFocus
            className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 focus:border-gray-400"
          />
        </div>

        {/* Slug do workspace */}
        <div className="space-y-2">
          <Label htmlFor="workspace-slug" className="text-sm font-medium text-gray-700">
            Slug do espaço de trabalho
          </Label>
          <div className="flex items-center gap-0">
            <span className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-2 sm:px-3 h-10 sm:h-11 flex items-center rounded-l-md border border-r-0 border-gray-300 whitespace-nowrap">
              isacar.dev/
            </span>
            <Input
              id="workspace-slug"
              placeholder="isacar"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              disabled={loading}
              className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 focus:border-gray-400 rounded-l-none flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">
            Você pode alterar isso mais tarde nas configurações.
          </p>
        </div>

        {/* Logo do workspace */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Logotipo do espaço de trabalho
          </Label>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Preview do logo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              )}
            </div>

            {/* Botão de upload */}
            <div className="flex-1 min-w-0">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={loading}
              />
              <label htmlFor="logo-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="cursor-pointer w-full sm:w-auto"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="truncate">Carregar imagem</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Tamanho recomendado: 160x160px
              </p>
            </div>
          </div>
        </div>

        {/* Botão criar */}
        <div className="pt-2">
          <Button 
            onClick={handleNext} 
            disabled={!name.trim() || !slug.trim() || loading}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar espaço de trabalho'
            )}
          </Button>
        </div>
      </div>
      </div>

      {/* Info do usuário no canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 text-sm text-gray-600 space-y-1 z-20">
        <p className="text-xs">Você está conectado como <span className="font-medium">{user?.email}</span></p>
        <button 
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-700 underline text-xs block"
        >
          Entrar como outro usuário
        </button>
      </div>
    </div>
  )
}
