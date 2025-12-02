import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentWithChildren } from '../types/docs';
import { getDocuments } from '../lib/storage';

export function useDocsCard(projectId: string) {
  const [documents, setDocuments] = useState<DocumentWithChildren[]>([]);
  const [loading, setLoading] = useState(true);

  const buildHierarchy = useCallback((docs: Document[]): DocumentWithChildren[] => {
    const docMap = new Map<string, DocumentWithChildren>();
    const rootDocs: DocumentWithChildren[] = [];

    // Create map of all documents
    docs.forEach(doc => {
      docMap.set(doc.id, { ...doc, children: [], level: 0 });
    });

    // Build hierarchy
    docs.forEach(doc => {
      const docWithChildren = docMap.get(doc.id)!;
      if (doc.parent_id) {
        const parent = docMap.get(doc.parent_id);
        if (parent) {
          docWithChildren.level = (parent.level || 0) + 1;
          parent.children = parent.children || [];
          parent.children.push(docWithChildren);
        } else {
          rootDocs.push(docWithChildren);
        }
      } else {
        rootDocs.push(docWithChildren);
      }
    });

    // Sort by created_at
    const sortDocs = (docs: DocumentWithChildren[]) => {
      docs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      docs.forEach(doc => {
        if (doc.children) {
          sortDocs(doc.children);
        }
      });
    };

    sortDocs(rootDocs);
    return rootDocs;
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    try {
      const allDocs = getDocuments();
      const projectDocs = allDocs.filter(doc => doc.project_id === projectId);
      const hierarchy = buildHierarchy(projectDocs);
      setDocuments(hierarchy);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, buildHierarchy]);

  useEffect(() => {
    refetch();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'docs-system') {
        refetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetch]);

  return { documents, loading, refetch };
}
