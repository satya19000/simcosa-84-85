import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const ingestDocumentFn = httpsCallable(fns, 'ingestDocument')
const searchDocumentsFn = httpsCallable(fns, 'searchDocuments')
const chatWithDocumentFn = httpsCallable(fns, 'chatWithDocument')
const listDocumentsFn = httpsCallable(fns, 'listDocuments')
const deleteDocumentFn = httpsCallable(fns, 'deleteDocument')
const getDocumentStatsFn = httpsCallable(fns, 'getDocumentStats')
const createDocumentFolderFn = httpsCallable(fns, 'createDocumentFolder')
const listDocumentFoldersFn = httpsCallable(fns, 'listDocumentFolders')
const rebuildDocumentIndexFn = httpsCallable(fns, 'rebuildDocumentIndex')

export interface DocumentRecord {
  id: string
  userId: string
  title: string
  format: string
  category: string
  status: string
  storageRef: string
  mimeType: string
  sizeBytes: number
  pageCount: number
  language: string
  tags: string[]
  pinned: boolean
  starred: boolean
  folderId?: string
  version: number
  createdAt: string
  updatedAt: string
  processedAt?: string
  processingError?: string
}

export interface DocumentFolder {
  id: string
  userId: string
  name: string
  parentId?: string
  color?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentStats {
  total: number
  byCategory: Record<string, number>
  byFormat: Record<string, number>
  byStatus: Record<string, number>
  topTags: Array<{ tag: string; count: number }>
  totalSizeBytes: number
  recentCount: number
  starredCount: number
  pinnedCount: number
}

export interface SearchResult {
  documentId: string
  chunkId: string
  score: number
  snippet: string
  title: string
}

export async function ingestDocument(input: {
  title: string; mimeType: string; sizeBytes: number; storageRef: string
  rawText?: string; filename?: string; folderId?: string; tags?: string[]
}) {
  const result = await ingestDocumentFn(input)
  return result.data as { document: DocumentRecord; chunkCount: number }
}

export async function searchDocuments(opts: { query: string; mode?: string; limit?: number; category?: string }) {
  const result = await searchDocumentsFn(opts)
  return result.data as SearchResult[]
}

export async function chatWithDocument(documentId: string, question: string): Promise<string> {
  const result = await chatWithDocumentFn({ documentId, question })
  return (result.data as { answer: string }).answer
}

export async function listDocuments(opts?: { limit?: number; category?: string; format?: string; folderId?: string }) {
  const result = await listDocumentsFn(opts ?? {})
  return result.data as DocumentRecord[]
}

export async function deleteDocument(documentId: string) {
  await deleteDocumentFn({ documentId })
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const result = await getDocumentStatsFn({})
  return result.data as DocumentStats
}

export async function createDocumentFolder(name: string, parentId?: string, color?: string): Promise<DocumentFolder> {
  const result = await createDocumentFolderFn({ name, parentId, color })
  return result.data as DocumentFolder
}

export async function listDocumentFolders(): Promise<DocumentFolder[]> {
  const result = await listDocumentFoldersFn({})
  return result.data as DocumentFolder[]
}

export async function rebuildDocumentIndex() {
  await rebuildDocumentIndexFn({})
}
