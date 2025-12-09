import { supabase } from '@/lib/supabase'
import type { BlogCategory, BlogPost, BlogPostFormData } from '@/types/blog'

// Get all blog categories
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching blog categories:', error)
    throw error
  }

  return data || []
}

// Create a new blog post
export async function createBlogPost(postData: BlogPostFormData): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([postData])
    .select()
    .single()

  if (error) {
    console.error('Error creating blog post:', error)
    throw error
  }

  return data
}

// Update an existing blog post
export async function updateBlogPost(
  id: string,
  postData: Partial<BlogPostFormData>
): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(postData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating blog post:', error)
    throw error
  }

  return data
}

// Upload blog cover image to Supabase Storage
export async function uploadBlogImage(
  file: File,
  fileName: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('blog-images').getPublicUrl(data.path)

  return publicUrl
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Estimate reading time from content (words per minute)
export function estimateReadingTime(content: string, wpm: number = 200): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wpm)
}

// Get all blog posts (for management page)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
    throw error
  }

  return data || []
}

// Get single blog post by ID
export async function getBlogPostById(id: string): Promise<BlogPost> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    throw error
  }

  return data
}

// Delete blog post
export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)

  if (error) {
    console.error('Error deleting blog post:', error)
    throw error
  }
}
