import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Upload, X, Eye, Save, Send, Edit, Trash2, FileText, Clock, Type, Shield, ExternalLink } from 'lucide-react'
import {
  getBlogCategories,
  createBlogPost,
  updateBlogPost,
  uploadBlogImage,
  generateSlug,
  estimateReadingTime,
  getAllBlogPosts,
  deleteBlogPost,
} from '@/lib/supabase/blog-queries'
import type { BlogCategory, BlogPostFormData, BlogPost } from '@/types/blog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { markdownToSafeHtml } from '@/lib/sanitize'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useI18n } from '@/hooks/use-i18n'
import { format } from 'date-fns'

// Email autorizado para acessar o blog admin
const AUTHORIZED_EMAIL = 'revenify.co@gmail.com'

export default function BlogCreate() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Verificar se o usuário tem permissão
  const isAuthorized = user?.email === AUTHORIZED_EMAIL

  // Redirecionar se não autorizado
  useEffect(() => {
    if (!authLoading && user && !isAuthorized) {
      toast.error('Acesso não autorizado', {
        description: 'Apenas administradores podem acessar esta página'
      })
      navigate('/dashboard')
    }
  }, [user, authLoading, isAuthorized, navigate])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [viewPost, setViewPost] = useState<BlogPost | null>(null)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<BlogPostFormData>>({})
  const [saving, setSaving] = useState(false)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [uploadingEditImage, setUploadingEditImage] = useState(false)
  const editImageRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: null,
    author_name: user?.user_metadata?.name || user?.email || '',
    author_avatar: user?.user_metadata?.avatar_url || null,
    category_id: '',
    status: 'draft',
    published_at: null,
    // Sidebar company info (optional)
    sidebar_company_name: null,
    sidebar_company_logo: null,
    sidebar_company_website: null,
    sidebar_company_industry: null,
    sidebar_company_size: null,
    sidebar_company_founded: null,
    sidebar_company_about: null,
  })

  const [autoSlug, setAutoSlug] = useState(true)

  // Load categories and posts
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getBlogCategories()
        setCategories(data)
        if (data.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: data[0].id }))
        }
        await loadPosts()
      } catch (error: any) {
        console.error('Error loading categories:', error)

        if (error?.message?.includes('404') || error?.code === 'PGRST116') {
          const errorMsg = 'Blog database not configured. Please run the SQL schema first.'
          setSetupError(errorMsg)
          toast.error(errorMsg, {
            description: 'Check BLOG-SETUP.md for instructions',
            duration: 10000,
          })
        } else {
          toast.error('Failed to load categories', {
            description: error?.message || 'Unknown error',
          })
        }
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [authLoading])

  async function loadPosts() {
    try {
      setLoadingPosts(true)
      const data = await getAllBlogPosts()
      setPosts(data)
    } catch (error: any) {
      console.error('Error loading posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && formData.title) {
      const slug = generateSlug(formData.title)
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.title, autoSlug])

  // Update author info when user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        author_name: user.user_metadata?.name || user.email || '',
        author_avatar: user.user_metadata?.avatar_url || null,
      }))
    }
  }, [user])

  const handleInputChange = (
    field: keyof BlogPostFormData,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingImage(true)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

      // Upload to Supabase Storage
      const publicUrl = await uploadBlogImage(file, fileName)

      setFormData((prev) => ({ ...prev, cover_image: publicUrl }))
      setImagePreview(publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading image:', error)

      if (error?.message?.includes('Bucket not found')) {
        toast.error('Storage bucket not found', {
          description: 'Please create the blog-images bucket in Supabase Storage',
          duration: 10000,
        })
      } else {
        toast.error('Failed to upload image', {
          description: error?.message || 'Unknown error',
        })
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, cover_image: null }))
    setImagePreview(null)
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return false
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required')
      return false
    }

    if (!formData.excerpt.trim()) {
      toast.error('Excerpt is required')
      return false
    }

    if (!formData.content.trim()) {
      toast.error('Content is required')
      return false
    }

    if (!formData.category_id) {
      toast.error('Category is required')
      return false
    }

    if (!formData.author_name.trim()) {
      toast.error('Author name is required')
      return false
    }

    return true
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const postData: BlogPostFormData = {
        ...formData,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }

      await createBlogPost(postData)

      toast.success(
        status === 'published'
          ? 'Blog post published successfully!'
          : 'Blog post saved as draft'
      )

      // Reload posts list
      await loadPosts()

      // Reset form
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image: null,
        author_name: user?.user_metadata?.name || user?.email || '',
        author_avatar: user?.user_metadata?.avatar_url || null,
        category_id: categories[0]?.id || '',
        status: 'draft',
        published_at: null,
        sidebar_company_name: null,
        sidebar_company_logo: null,
        sidebar_company_website: null,
        sidebar_company_industry: null,
        sidebar_company_size: null,
        sidebar_company_founded: null,
        sidebar_company_about: null,
      })
      setImagePreview(null)
    } catch (error) {
      toast.error('Failed to create blog post')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!postToDelete) return

    try {
      await deleteBlogPost(postToDelete)
      toast.success('Post deleted successfully')
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      await loadPosts()
    } catch (error: any) {
      toast.error('Failed to delete post', {
        description: error.message,
      })
    }
  }

  function confirmDelete(id: string) {
    setPostToDelete(id)
    setDeleteDialogOpen(true)
  }

  function openEditDialog(post: BlogPost) {
    setEditPost(post)
    setEditImagePreview(post.cover_image || null)
    setEditFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category_id: post.category_id,
      status: post.status,
      cover_image: post.cover_image,
      author_name: post.author_name,
      sidebar_company_name: post.sidebar_company_name,
      sidebar_company_logo: post.sidebar_company_logo,
      sidebar_company_website: post.sidebar_company_website,
      sidebar_company_industry: post.sidebar_company_industry,
      sidebar_company_size: post.sidebar_company_size,
      sidebar_company_founded: post.sidebar_company_founded,
      sidebar_company_about: post.sidebar_company_about,
    })
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('blog.toast.imageSizeError'))
      return
    }
    setUploadingEditImage(true)
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const publicUrl = await uploadBlogImage(file, fileName)
      setEditFormData((p) => ({ ...p, cover_image: publicUrl }))
      setEditImagePreview(publicUrl)
      toast.success(t('blog.toast.imageUploaded'))
    } catch (error: any) {
      toast.error(t('blog.toast.imageError'), { description: error?.message })
    } finally {
      setUploadingEditImage(false)
    }
  }

  function removeEditImage() {
    setEditFormData((p) => ({ ...p, cover_image: null }))
    setEditImagePreview(null)
    if (editImageRef.current) editImageRef.current.value = ''
  }

  async function handleSaveEdit() {
    if (!editPost) return
    setSaving(true)
    try {
      await updateBlogPost(editPost.id, editFormData)
      toast.success(t('blog.toast.updated'))
      setEditPost(null)
      await loadPosts()
    } catch (error: any) {
      toast.error(t('blog.toast.updateError'), {
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  // Mostrar mensagem se não autorizado
  if (!isAuthorized) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
          <div className="p-5 rounded-2xl bg-destructive/10 mb-6">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('blog.accessDenied')}</h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t('blog.accessDenied.description')}
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            {t('blog.backToDashboard')}
          </Button>
        </div>
      </>
    )
  }

  const readingTime = estimateReadingTime(formData.content)

  return (
    <>
      <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('blog.admin')}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('blog.admin.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
              className="h-9"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">{t('blog.saveDraft')}</span>
              <span className="sm:hidden">{t('blog.saveDraft')}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit('published')}
              disabled={submitting}
              className="h-9"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">{t('blog.publish')}</span>
              <span className="sm:hidden">{t('blog.publish')}</span>
            </Button>
          </div>
        </div>

        {/* Setup Error Alert */}
        {setupError && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-col gap-2">
              <p className="font-semibold">{setupError}</p>
              <p className="text-sm">
                Follow the steps in <code className="bg-destructive/20 px-1 py-0.5 rounded">BLOG-SETUP.md</code> to configure the blog database and storage.
              </p>
              <div className="text-sm space-y-1 mt-2">
                <p>Quick steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Run the SQL schema in Supabase SQL Editor</li>
                  <li>Create <code className="bg-destructive/20 px-1 py-0.5 rounded">blog-images</code> bucket in Storage (public)</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base">{t('blog.postDetails')}</CardTitle>
                <CardDescription className="text-xs">
                  {t('blog.postDetails.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">
                    {t('blog.title')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={t('blog.title.placeholder')}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={200}
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug" className="text-xs">
                      {t('blog.slug')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={autoSlug}
                        onCheckedChange={setAutoSlug}
                        id="auto-slug"
                      />
                      <Label htmlFor="auto-slug" className="text-[10px] cursor-pointer text-muted-foreground">
                        Auto
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="slug"
                    placeholder="post-slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    disabled={autoSlug}
                    maxLength={200}
                    className="h-9 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground truncate">
                    revenify.co/blog/{formData.slug || 'your-slug'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="excerpt" className="text-xs">
                    {t('blog.excerpt')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="excerpt"
                    placeholder={t('blog.excerpt.placeholder')}
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={2}
                    maxLength={300}
                    className="text-sm resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {formData.excerpt.length}/300 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base">{t('blog.content')}</CardTitle>
                <CardDescription className="text-xs">
                  {t('blog.content.markdown')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Tabs defaultValue="write" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="write" className="text-xs"><Type className="h-3.5 w-3.5 mr-1.5" />{t('blog.write')}</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      {t('blog.preview')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="write" className="space-y-3 mt-3">
                    <Textarea
                      placeholder={"Write your blog post content in Markdown...\n\n# Section Title\n\nThis is a paragraph with **bold** and *italic* text.\n\n## Subsection\n\n- List item 1\n- List item 2"}
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={16}
                      className="font-mono text-xs resize-none"
                    />
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-1">
                      <span>Markdown supported: # headers, **bold**, *italic*, [links](url), ```code```</span>
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="mt-3">
                    <div className="border rounded-lg p-4 sm:p-6 min-h-[300px] prose prose-sm max-w-none dark:prose-invert">
                      {formData.content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: markdownToSafeHtml(formData.content),
                          }}
                        />
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No content to preview. Start writing in the Write tab.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Cover Image */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base">{t('blog.coverImage')}</CardTitle>
                <CardDescription className="text-xs">{t('blog.coverImage.specs')}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-36 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-1.5" />
                    <Label
                      htmlFor="cover-image"
                      className="cursor-pointer text-xs text-primary hover:underline"
                    >
                      {t('blog.coverImage.upload')}
                    </Label>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t('blog.coverImage.specs')}
                    </p>
                  </div>
                )}
                {uploadingImage && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base">{t('blog.settings')}</CardTitle>
                <CardDescription className="text-xs">{t('blog.settings.description')}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs">
                    {t('blog.category')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger id="category" className="h-9 text-xs">
                      <SelectValue placeholder={t('blog.category.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="author" className="text-xs">
                    {t('blog.authorName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="author"
                    value={formData.author_name}
                    onChange={(e) => handleInputChange('author_name', e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {t('blog.readingTime')}
                    </span>
                    <span className="font-medium">{readingTime} min</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Type className="h-3 w-3" />
                      {t('blog.words')}
                    </span>
                    <span className="font-medium">
                      {formData.content.trim().split(/\s+/).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Company Info (Optional) */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-base">{t('blog.companyInfo')}</CardTitle>
                <CardDescription className="text-xs">
                  {t('blog.companyInfo.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corp"
                    value={formData.sidebar_company_name || ''}
                    onChange={(e) => handleInputChange('sidebar_company_name', e.target.value || null)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyWebsite" className="text-xs">Website</Label>
                  <Input
                    id="companyWebsite"
                    placeholder="acme.com"
                    value={formData.sidebar_company_website || ''}
                    onChange={(e) => handleInputChange('sidebar_company_website', e.target.value || null)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyIndustry" className="text-xs">Industry</Label>
                    <Input
                      id="companyIndustry"
                      placeholder="SaaS"
                      value={formData.sidebar_company_industry || ''}
                      onChange={(e) => handleInputChange('sidebar_company_industry', e.target.value || null)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companySize" className="text-xs">Size</Label>
                    <Input
                      id="companySize"
                      placeholder="1-10"
                      value={formData.sidebar_company_size || ''}
                      onChange={(e) => handleInputChange('sidebar_company_size', e.target.value || null)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyFounded" className="text-xs">Founded Year</Label>
                  <Input
                    id="companyFounded"
                    placeholder="2023"
                    value={formData.sidebar_company_founded || ''}
                    onChange={(e) => handleInputChange('sidebar_company_founded', e.target.value || null)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyAbout" className="text-xs">About</Label>
                  <Textarea
                    id="companyAbout"
                    placeholder="Brief description..."
                    rows={2}
                    value={formData.sidebar_company_about || ''}
                    onChange={(e) => handleInputChange('sidebar_company_about', e.target.value || null)}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyLogo" className="text-xs">Logo URL</Label>
                  <Input
                    id="companyLogo"
                    placeholder="https://example.com/logo.png"
                    value={formData.sidebar_company_logo || ''}
                    onChange={(e) => handleInputChange('sidebar_company_logo', e.target.value || null)}
                    className="h-9 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Posts List */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('blog.publishedPosts')}</CardTitle>
                <CardDescription className="text-xs">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t('blog.noPosts')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('blog.noPosts.description')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[580px] px-4 sm:px-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">{t('blog.title')}</TableHead>
                          <TableHead className="text-xs">{t('blog.category')}</TableHead>
                          <TableHead className="text-xs">{t('blog.status')}</TableHead>
                          <TableHead className="text-xs">{t('blog.status.published')}</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium max-w-[200px]">
                              <div className="truncate text-xs">{post.title}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {(post as any).blog_categories?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  post.status === 'published' ? 'default' : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {post.status === 'published' ? t('blog.status.published') : t('blog.status.draft')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {post.published_at
                                ? format(new Date(post.published_at), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setViewPost(post)}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('blog.viewPost')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => openEditDialog(post)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('blog.editPost')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => confirmDelete(post.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('blog.deletePost')}</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Post Dialog */}
      <Dialog open={!!viewPost} onOpenChange={(open) => !open && setViewPost(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewPost?.title}</DialogTitle>
            <DialogDescription className="sr-only">Post preview</DialogDescription>
          </DialogHeader>
          {viewPost && (
            <div className="space-y-4">
              {/* Cover Image */}
              {viewPost.cover_image && (
                <img
                  src={viewPost.cover_image}
                  alt={viewPost.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {(viewPost as any).blog_categories?.name || 'Unknown'}
                </Badge>
                <Badge variant={viewPost.status === 'published' ? 'default' : 'secondary'}>
                  {viewPost.status}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {viewPost.reading_time || estimateReadingTime(viewPost.content)} {t('blog.minRead')}
                </span>
                {viewPost.published_at && (
                  <span>{format(new Date(viewPost.published_at), 'MMM d, yyyy')}</span>
                )}
                <span>by {viewPost.author_name}</span>
              </div>

              {/* Excerpt */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground italic">{viewPost.excerpt}</p>
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(viewPost.content) }} />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {viewPost.status === 'published' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://revenify.co/blog/${viewPost.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    <span>{t('blog.openInSite')}</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setViewPost(null)
                    openEditDialog(viewPost)
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  <span>{t('blog.edit')}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => { if (!open) { setEditPost(null); setEditImagePreview(null) } }}>
        <DialogContent className="!top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-full max-h-full h-full w-full rounded-none border-0 sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:rounded-xl sm:border sm:!max-w-4xl sm:h-auto sm:max-h-[85vh] lg:!max-w-5xl overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('blog.editPost')}</DialogTitle>
            <DialogDescription className="sr-only">{t('blog.editPost.description')}</DialogDescription>
          </DialogHeader>
          {editPost && (
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-2">
              {/* Left Column — Main Fields */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.title')}</Label>
                  <Input
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
                    className="h-9"
                    placeholder={t('blog.title.placeholder')}
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.slug')}</Label>
                  <Input
                    value={editFormData.slug || ''}
                    onChange={(e) => setEditFormData((p) => ({ ...p, slug: e.target.value }))}
                    className="h-9 font-mono text-xs"
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.excerpt')}</Label>
                  <Textarea
                    value={editFormData.excerpt || ''}
                    onChange={(e) => setEditFormData((p) => ({ ...p, excerpt: e.target.value }))}
                    rows={2}
                    className="text-sm resize-none"
                    placeholder={t('blog.excerpt.placeholder')}
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.content.markdown')}</Label>
                  <Textarea
                    value={editFormData.content || ''}
                    onChange={(e) => setEditFormData((p) => ({ ...p, content: e.target.value }))}
                    rows={8}
                    className="font-mono text-xs resize-none"
                  />
                </div>
              </div>

              {/* Right Column — Settings + Image */}
              <div className="md:w-[260px] shrink-0 space-y-3">
                {/* Cover Image Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.coverImage')}</Label>
                  {editImagePreview ? (
                    <div className="relative">
                      <img
                        src={editImagePreview}
                        alt="Cover"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6"
                        onClick={removeEditImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-3 text-center">
                      {uploadingEditImage ? (
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                          <Label
                            htmlFor="edit-cover-image"
                            className="cursor-pointer text-xs text-primary hover:underline"
                          >
                            {t('blog.coverImage.upload')}
                          </Label>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t('blog.coverImage.specs')}
                          </p>
                        </>
                      )}
                      <Input
                        id="edit-cover-image"
                        ref={editImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImageUpload}
                        disabled={uploadingEditImage}
                      />
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.category')}</Label>
                  <Select
                    value={editFormData.category_id || ''}
                    onValueChange={(v) => setEditFormData((p) => ({ ...p, category_id: v }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={t('blog.category.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.status')}</Label>
                  <Select
                    value={editFormData.status || 'draft'}
                    onValueChange={(v) => setEditFormData((p) => ({ ...p, status: v as 'draft' | 'published', published_at: v === 'published' ? new Date().toISOString() : null }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('blog.status.draft')}</SelectItem>
                      <SelectItem value="published">{t('blog.status.published')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('blog.authorName')}</Label>
                  <Input
                    value={editFormData.author_name || ''}
                    onChange={(e) => setEditFormData((p) => ({ ...p, author_name: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Save Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditPost(null)}>
                    <span>{t('blog.cancel')}</span>
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        <span>{t('blog.saving')}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        <span>{t('blog.saveChanges')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('blog.delete.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('blog.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('blog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('blog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
