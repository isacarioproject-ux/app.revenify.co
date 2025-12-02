// Database types for Supabase tables

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
      project_documents: {
        Row: ProjectDocument
        Insert: ProjectDocumentInsert
        Update: ProjectDocumentUpdate
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
      }
      workspace_members: {
        Row: TeamMember
        Insert: TeamMemberInsert
        Update: TeamMemberUpdate
      }
    }
  }
}

export type ProjectStatus = 'Planejamento' | 'Em andamento' | 'Concluído' | 'Pausado' | 'Cancelado'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface ProjectTask {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface ProjectTaskInsert {
  project_id: string
  user_id: string
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string | null
  due_date?: string | null
  position?: number
}

export interface ProjectTaskUpdate {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string | null
  due_date?: string | null
  position?: number
}

export interface Project {
  id: string
  user_id: string
  workspace_id: string | null // ✅ Adicionado
  name: string
  description: string | null
  status: ProjectStatus
  progress: number
  team_size: number | null
  due_date: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  user_id: string
  workspace_id?: string | null // ✅ Adicionado
  name: string
  description?: string | null
  status?: ProjectStatus
  progress?: number
  team_size?: number | null
  due_date?: string | null
  color?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  status?: ProjectStatus
  progress?: number
  team_size?: number | null
  due_date?: string | null
  color?: string
}

// Project Documents (documentos dentro de cada projeto)
export interface ProjectDocument {
  id: string
  project_id: string
  user_id: string
  workspace_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  is_private: boolean
  shared_with: string[]
  finance_doc_count: number
  created_at: string
  updated_at: string
}

export interface ProjectDocumentInsert {
  project_id: string
  user_id: string
  workspace_id?: string | null
  name: string
  description?: string | null
  status?: ProjectStatus
  is_private?: boolean
  shared_with?: string[]
  finance_doc_count?: number
}

export interface ProjectDocumentUpdate {
  name?: string
  description?: string | null
  status?: ProjectStatus
  is_private?: boolean
  shared_with?: string[]
  finance_doc_count?: number
}

// Document types
export type DocumentCategory = 'PDF' | 'Word' | 'Excel' | 'PowerPoint' | 'Image' | 'Other'

export interface Document {
  id: string
  user_id: string
  project_id: string | null
  name: string
  description: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  category: DocumentCategory
  tags: string[]
  is_shared: boolean
  shared_with: string[]
  created_at: string
  updated_at: string
}

export interface DocumentInsert {
  user_id: string
  project_id?: string | null
  name: string
  description?: string | null
  file_url?: string | null
  file_type?: string | null
  file_size?: number | null
  category?: DocumentCategory
  tags?: string[]
  is_shared?: boolean
  shared_with?: string[]
}

export interface DocumentUpdate {
  name?: string
  description?: string | null
  project_id?: string | null
  file_url?: string | null
  file_type?: string | null
  file_size?: number | null
  category?: DocumentCategory
  tags?: string[]
  is_shared?: boolean
  shared_with?: string[]
}

// Team Member types
export type TeamMemberRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type TeamMemberStatus = 'pending' | 'active' | 'declined' | 'removed'

export interface TeamMember {
  id: string
  project_id: string | null // Opcional - convite de organização ou projeto específico
  email: string
  name: string | null
  role: TeamMemberRole
  status: TeamMemberStatus
  user_id: string | null
  invited_by: string
  invited_at: string
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface TeamMemberInsert {
  project_id?: string | null // Opcional - convite de organização ou projeto
  email: string
  name?: string | null
  role?: TeamMemberRole
  status?: TeamMemberStatus
  invited_by: string
}

export interface TeamMemberUpdate {
  project_id?: string
  name?: string | null
  role?: TeamMemberRole
  status?: TeamMemberStatus
  user_id?: string | null
  joined_at?: string | null
}
