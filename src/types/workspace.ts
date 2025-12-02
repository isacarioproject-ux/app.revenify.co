export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  owner_id: string
  avatar_url: string | null
  settings: Record<string, any>
  plan: 'free' | 'pro' | 'enterprise'
  max_members: number
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_by: string | null
  invited_at: string
  joined_at: string | null
  status: 'pending' | 'active' | 'suspended'
  created_at: string
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  profiles?: {
    full_name: string
    avatar_url: string | null
    email: string
  }
}

export interface WorkspaceInvite {
  id: string
  workspace_id: string
  email: string
  invited_by: string
  role: 'admin' | 'member' | 'viewer'
  token: string
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
  created_at: string
}

export interface WorkspaceWithRole extends Workspace {
  user_role?: 'owner' | 'admin' | 'member' | 'viewer'
  member_count?: number
}
