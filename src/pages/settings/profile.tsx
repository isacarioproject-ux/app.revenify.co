import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { SettingsPageSkeleton } from '@/components/page-skeleton'
import { Upload, Camera } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      setEmail(user.email || '')
      setName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setCompany(user.user_metadata?.company || '')

      // Get avatar from user metadata
      const avatar = user.user_metadata?.avatar_url || ''
      setAvatarUrl(avatar)
    }

    loadUserData()
  }, [user])

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // Try creating bucket if it doesn't exist
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Bucket de avatars não encontrado', {
            description: 'Crie o bucket "avatars" no Supabase Storage'
          })
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      // Refresh session so the auth context picks up the new avatar
      await supabase.auth.refreshSession()

      setAvatarUrl(publicUrl)
      toast.success('Foto atualizada com sucesso!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error('Erro ao fazer upload da foto', {
        description: error.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          name: name,
          company: company,
        }
      })

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao salvar perfil', {
        description: error.message
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
      })

      if (error) throw error

      toast.success('Email de redefinição enviado!', {
        description: 'Verifique sua caixa de entrada'
      })
    } catch (error: any) {
      toast.error('Erro ao enviar email', {
        description: error.message
      })
    }
  }

  if (authLoading) {
    return (
      <>
        <SettingsPageSkeleton />
      </>
    )
  }

  return (
    <>
      <div className="w-full p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">
            {t('profile.description')}
          </p>
        </div>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.photo')}</CardTitle>
            <CardDescription>{t('profile.photoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {getInitials(name, email)}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Spinner size="md" color="white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? t('common.uploading') : t('profile.changePhoto')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('profile.photoHint')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
            <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('profile.name')}</Label>
                <Input
                  id="name"
                  placeholder={t('profile.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.emailHint')}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t('profile.company')}</Label>
              <Input
                id="company"
                placeholder={t('profile.companyPlaceholder')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.security')}</CardTitle>
            <CardDescription>{t('profile.securityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('profile.password')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('profile.passwordHint')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                {t('profile.resetPassword')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('profile.twoFactor')}</p>
                <p className="text-sm text-muted-foreground">{t('profile.twoFactorDesc')}</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t('common.comingSoon')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t('profile.dangerZone')}</CardTitle>
            <CardDescription>{t('profile.dangerZoneDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('profile.deleteAccount')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('profile.deleteAccountDesc')}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast.info(t('profile.deleteAccountInfo'))}
              >
                {t('profile.deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            {saving ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </div>
      </div>
    </>
  )
}
