// Blog types for admin panel

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  author_name: string
  author_avatar: string | null
  category_id: string
  status: 'draft' | 'published'
  published_at: string | null
  reading_time: number
  created_at: string
  updated_at: string
  // Sidebar company/customer info
  sidebar_company_name: string | null
  sidebar_company_logo: string | null
  sidebar_company_website: string | null
  sidebar_company_industry: string | null
  sidebar_company_size: string | null
  sidebar_company_founded: string | null
  sidebar_company_about: string | null
}

export interface BlogPostWithCategory extends BlogPost {
  blog_categories: BlogCategory
}

export interface BlogPostFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  author_name: string
  author_avatar: string | null
  category_id: string
  status: 'draft' | 'published'
  published_at: string | null
  // Sidebar company info (optional)
  sidebar_company_name: string | null
  sidebar_company_logo: string | null
  sidebar_company_website: string | null
  sidebar_company_industry: string | null
  sidebar_company_size: string | null
  sidebar_company_founded: string | null
  sidebar_company_about: string | null
}
