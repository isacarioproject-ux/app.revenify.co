// Types para Google Drive Integration

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  modifiedTime?: string
  iconLink?: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  parents?: string[]
}

export interface DriveFolder {
  id: string
  name: string
  parents?: string[]
}

export interface DriveListResponse {
  files: DriveFile[]
  nextPageToken?: string
}

export interface ProjectDriveFile {
  id: string
  project_id: string
  workspace_id: string
  user_id: string
  drive_file_id: string
  drive_file_name: string
  drive_file_type: string | null
  drive_file_size: number | null
  drive_file_url: string | null
  created_at: string
  updated_at: string
}

export interface TaskDriveAttachment {
  id: string
  task_id: string
  workspace_id: string
  user_id: string
  drive_file_id: string
  drive_file_name: string
  drive_file_type: string | null
  drive_file_size: number | null
  drive_file_url: string | null
  attached_at: string
}

export interface TransactionReceipt {
  id: string
  transaction_id: string
  workspace_id: string
  drive_file_id: string
  drive_file_name: string
  drive_file_url: string | null
  uploaded_at: string
}
