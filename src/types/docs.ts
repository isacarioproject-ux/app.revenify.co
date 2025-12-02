export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export type PageElementType = 'h1' | 'h2' | 'text' | 'list' | 'checklist' | 'table';

export interface PageElement {
  id: string;
  type: PageElementType;
  content: string | string[] | ChecklistItem[] | TableData;
}

export interface PageData {
  title: string;
  elements: PageElement[];
  iconEmoji?: string;
  coverImg?: string;
}

export interface Document {
  id: string;
  name: string;
  file_type: 'page' | 'pdf' | 'word' | 'excel' | 'image' | 'other';
  file_size: number;
  created_at: string;
  file_url?: string;
  parent_id: string | null;
  icon: string | null;
  page_data?: PageData;
  template_id?: string;
  project_id: string;
  // Google Drive fields
  drive_file_id?: string;
  drive_synced_at?: string;
  drive_sync_enabled?: boolean;
}

export interface DocumentWithChildren extends Document {
  children?: DocumentWithChildren[];
  level?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'all' | 'business' | 'personal' | 'education';
  emoji: string;
  elements: PageElement[];
}
