import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard-layout'
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
import { Loader2, Upload, X, Eye, Save, Send, Edit, Trash2 } from 'lucide-react'
import {
  getBlogCategories,
  createBlogPost,
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
import { format } from 'date-fns'

// Email autorizado para acessar o blog admin
const AUTHORIZED_EMAIL = 'revenify.co@gmail.com'

export default function BlogCreate() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

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

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  // Mostrar mensagem se não autorizado
  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Esta página é exclusiva para administradores do Revenify.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const readingTime = estimateReadingTime(formData.content)

  return (
    <DashboardLayout>
      <div className="w-full p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Create Blog Post</h1>
            <p className="text-muted-foreground mt-1">
              Write and publish a new blog post for your site
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
            >
              {!submitting && <Save className="mr-2 h-4 w-4" />}
              {submitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSubmit('published')} disabled={submitting}>
              {!submitting && <Send className="mr-2 h-4 w-4" />}
              {submitting ? 'Publishing...' : 'Publish'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Basic information about your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter post title..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">
                      Slug <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={autoSlug}
                        onCheckedChange={setAutoSlug}
                        id="auto-slug"
                      />
                      <Label htmlFor="auto-slug" className="text-xs cursor-pointer">
                        Auto-generate
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
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: https://revenify.co/blog/{formData.slug || 'your-slug'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">
                    Excerpt <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the post (appears in cards and SEO)"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.excerpt.length}/300 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write your blog post in Markdown format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="write" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="write" className="space-y-4">
                    <Textarea
                      placeholder="Write your blog post content in Markdown...

# Section Title

This is a paragraph with **bold** and *italic* text.

## Subsection

- List item 1
- List item 2

```javascript
const code = 'example';
```

[Link text](https://example.com)"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <Alert>
                      <AlertDescription>
                        <strong>Markdown Guide:</strong> Use # for headers, **bold**, *italic*,
                        [link](url), ```code blocks```, - for lists
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                  <TabsContent value="preview" className="space-y-4">
                    <div className="border rounded-lg p-6 min-h-[400px] prose prose-sm max-w-none">
                      {formData.content ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: markdownToSafeHtml(formData.content),
                          }}
                        />
                      ) : (
                        <p className="text-muted-foreground">
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
          <div className="space-y-6">
            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>Upload a cover image (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <Label
                      htmlFor="cover-image"
                      className="cursor-pointer text-sm text-primary hover:underline"
                    >
                      Click to upload image
                    </Label>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 1200x630px, max 5MB
                    </p>
                  </div>
                )}
                {uploadingImage && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Post metadata and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
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

                <div className="space-y-2">
                  <Label htmlFor="author">
                    Author Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="author"
                    value={formData.author_name}
                    onChange={(e) => handleInputChange('author_name', e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reading time</span>
                    <span className="font-medium">{readingTime} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Words</span>
                    <span className="font-medium">
                      {formData.content.trim().split(/\s+/).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Company Info (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>Company/Customer Info (Optional)</CardTitle>
                <CardDescription>
                  Add company details to show in sidebar (like Dub.co customer stories)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corp"
                    value={formData.sidebar_company_name || ''}
                    onChange={(e) => handleInputChange('sidebar_company_name', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    placeholder="acme.com"
                    value={formData.sidebar_company_website || ''}
                    onChange={(e) => handleInputChange('sidebar_company_website', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyIndustry">Industry</Label>
                  <Input
                    id="companyIndustry"
                    placeholder="SaaS, E-commerce, etc."
                    value={formData.sidebar_company_industry || ''}
                    onChange={(e) => handleInputChange('sidebar_company_industry', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input
                    id="companySize"
                    placeholder="1-10 employees"
                    value={formData.sidebar_company_size || ''}
                    onChange={(e) => handleInputChange('sidebar_company_size', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyFounded">Founded Year</Label>
                  <Input
                    id="companyFounded"
                    placeholder="2023"
                    value={formData.sidebar_company_founded || ''}
                    onChange={(e) => handleInputChange('sidebar_company_founded', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAbout">About</Label>
                  <Textarea
                    id="companyAbout"
                    placeholder="Brief description of the company..."
                    rows={3}
                    value={formData.sidebar_company_about || ''}
                    onChange={(e) => handleInputChange('sidebar_company_about', e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogo">Company Logo URL</Label>
                  <Input
                    id="companyLogo"
                    placeholder="https://example.com/logo.png"
                    value={formData.sidebar_company_logo || ''}
                    onChange={(e) => handleInputChange('sidebar_company_logo', e.target.value || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Or upload the logo to Supabase Storage and paste the URL here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Posts List Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Published Posts</CardTitle>
            <CardDescription>
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet. Create your first post above!
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-md">
                          <div className="truncate">{post.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(post as any).blog_categories?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              post.status === 'published' ? 'default' : 'secondary'
                            }
                          >
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {post.published_at
                            ? format(new Date(post.published_at), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {post.status === 'published' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(
                                    `http://localhost:3007/blog/${post.slug}`,
                                    '_blank'
                                  )
                                }
                                title="View post"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toast.info('Edit feature coming soon!')}
                              title="Edit post"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(post.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog
              post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
