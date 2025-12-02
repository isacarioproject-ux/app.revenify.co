import { useState, useEffect, FormEvent } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { supabase } from '@/lib/supabase'
import { User, Mail, Camera, Save, Key, Loader2, UserCircle, AlertCircle, Upload, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/hooks/use-i18n'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfilePage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    bio: '',
    avatar_url: '',
  })
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      if (!user) throw new Error(t('profile.userNotFound'))

      setUser(user)
      setProfile({
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        bio: user.user_metadata?.bio || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.errorLoading'),
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)

      // 1. Update Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        },
      })

      if (authError) throw authError

      // 2. Update profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString(),
          })

        if (profileError) throw profileError
      }

      toast({
        title: t('profile.saved'),
        description: t('profile.savedDesc'),
      })

      // Recarregar dados do usuário para atualizar sidebar
      await fetchProfile()
      
      // Forçar reload da sessão para atualizar componentes
      window.dispatchEvent(new CustomEvent('user-updated'))
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.errorSaving'),
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    console.log('🔐 Iniciando troca de senha...', {
      newLength: passwordData.new.length,
      confirmLength: passwordData.confirm.length,
      match: passwordData.new === passwordData.confirm
    })

    if (passwordData.new !== passwordData.confirm) {
      console.warn('❌ Senhas não coincidem')
      toast({
        variant: 'destructive',
        title: t('profile.passwordMismatch'),
        description: t('profile.passwordMismatchDesc'),
      })
      return
    }

    if (passwordData.new.length < 8) {
      console.warn('❌ Senha muito curta:', passwordData.new.length)
      toast({
        variant: 'destructive',
        title: t('profile.passwordTooShort'),
        description: t('profile.passwordTooShortDesc'),
      })
      return
    }

    try {
      setSaving(true)
      console.log('📤 Enviando atualização de senha...')

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      })

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Senha alterada com sucesso')

      toast({
        title: t('profile.passwordChanged'),
        description: t('profile.passwordChangedDesc'),
      })

      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('profile.passwordError'),
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'US'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      const file = event.target.files?.[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Por favor, selecione uma imagem válida',
        })
        return
      }

      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'A imagem deve ter no máximo 2MB',
        })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${user.id}/${fileName}`

      console.log('📤 Iniciando upload:', { filePath, fileType: file.type, fileSize: file.size })

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError)
        throw uploadError
      }

      console.log('✅ Upload concluído:', data)

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar perfil com nova URL
      setProfile({ ...profile, avatar_url: publicUrl })

      // Salvar automaticamente
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })

      if (authError) throw authError

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer upload',
        description: error.message,
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen w-full flex items-start justify-center pt-6 pb-8">
          <div className="w-full px-4 md:w-[60%] md:px-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Header Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              
              {/* Avatar Card Skeleton */}
              <div className="p-6 rounded-lg border space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </div>

              {/* Form Skeleton */}
              <div className="p-6 rounded-lg border space-y-4">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full flex items-start justify-center pt-6 pb-8">
        <div className="w-full px-4 md:w-[60%] md:px-0 space-y-4">
        {/* Header */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">{t('profile.title')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('profile.description')}
          </p>
        </div>

        {/* Grid: Perfil à esquerda, Avatar à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Coluna Esquerda: Perfil */}
          <div className="space-y-1">
            <h2 className="text-base font-medium">{t('profile.personalInfo')}</h2>
            <p className="text-xs text-muted-foreground">
              {t('profile.personalInfoDesc')}
            </p>
          </div>

          {/* Coluna Direita: Avatar */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-medium self-center">{t('profile.avatar')}</h3>
            
            <div className="relative group">
              <Avatar className="h-[100px] w-[100px] border">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </div>

            <p className="text-sm font-medium">{profile.full_name || t('profile.noName')}</p>
          </div>
        </div>

          {/* Todos os inputs em sequência vertical - metade da largura, alinhado com avatar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div></div>
            <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">{t('profile.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder={t('profile.fullNamePlaceholder')}
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('profile.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-sm font-medium">{t('profile.newPassword')}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new_password"
                  type="password"
                  placeholder={t('profile.minChars')}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-sm font-medium">{t('profile.confirmNewPassword')}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder={t('profile.typeAgain')}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              onClick={async () => {
                // Se tem senha nova, alterar senha
                if (passwordData.new || passwordData.confirm) {
                  await handleChangePassword()
                } else {
                  // Senão, apenas salvar perfil
                  await handleSaveProfile()
                }
              }}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </>
              )}
            </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
