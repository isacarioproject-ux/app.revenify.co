import { Document } from '@/types/docs';

const STORAGE_KEY = 'docs-system';

export function getDocuments(): Document[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(documents: Document[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getDocument(id: string): Document | null {
  const documents = getDocuments();
  return documents.find(doc => doc.id === id) || null;
}

export function createDocument(document: Omit<Document, 'id' | 'created_at'>): Document {
  const documents = getDocuments();
  const newDoc: Document = {
    ...document,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  documents.push(newDoc);
  saveDocuments(documents);
  return newDoc;
}

export function updateDocument(id: string, updates: Partial<Document>): Document | null {
  const documents = getDocuments();
  const index = documents.findIndex(doc => doc.id === id);
  if (index === -1) return null;
  
  documents[index] = { ...documents[index], ...updates };
  saveDocuments(documents);
  return documents[index];
}

export function deleteDocument(id: string): boolean {
  let documents = getDocuments();
  const initialLength = documents.length;
  
  // Delete document and all its children recursively
  const deleteRecursive = (docId: string) => {
    const children = documents.filter(doc => doc.parent_id === docId);
    children.forEach(child => deleteRecursive(child.id));
    documents = documents.filter(doc => doc.id !== docId);
  };
  
  deleteRecursive(id);
  saveDocuments(documents);
  return documents.length < initialLength;
}

export function duplicateDocument(id: string): Document | null {
  const original = getDocument(id);
  if (!original || original.file_type !== 'page') return null;
  
  const duplicate = createDocument({
    ...original,
    name: `${original.name} (Cópia)`,
    parent_id: original.parent_id,
    project_id: original.project_id,
  });
  
  return duplicate;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
