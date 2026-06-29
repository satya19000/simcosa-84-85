import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { getDocumentManager } from './documents'
import type { SearchOptions } from './documents/DocumentSearch'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function apiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? ''
}

export const ingestDocument = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 300, memory: '1GiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { title, mimeType, sizeBytes, storageRef, rawText, filename, folderId, tags } = request.data as {
      title: string; mimeType: string; sizeBytes: number; storageRef: string
      rawText?: string; filename?: string; folderId?: string; tags?: string[]
    }
    if (!title || !mimeType || !storageRef) throw new HttpsError('invalid-argument', 'title, mimeType, storageRef required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.ingestDocument({ userId: request.auth.uid, title, mimeType, sizeBytes: sizeBytes ?? 0, storageRef, rawText, filename, folderId, tags })
  }
)

export const searchDocuments = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const opts = request.data as SearchOptions
    if (!opts.query) throw new HttpsError('invalid-argument', 'query required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.searchDocuments(request.auth.uid, opts)
  }
)

export const chatWithDocument = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { documentId, question } = request.data as { documentId: string; question: string }
    if (!documentId || !question) throw new HttpsError('invalid-argument', 'documentId and question required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    const answer = await manager.chatWithDocument(request.auth.uid, documentId, question)
    return { answer }
  }
)

export const listDocuments = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { limit, category, format, folderId } = (request.data ?? {}) as {
      limit?: number; category?: string; format?: string; folderId?: string
    }
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.listDocuments(request.auth.uid, { limit, category: category as never, format: format as never, folderId })
  }
)

export const deleteDocument = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { documentId } = request.data as { documentId: string }
    if (!documentId) throw new HttpsError('invalid-argument', 'documentId required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    await manager.deleteDocument(request.auth.uid, documentId)
    return { success: true }
  }
)

export const getDocumentStats = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.getStats(request.auth.uid)
  }
)

export const createDocumentFolder = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const { name, parentId, color } = request.data as { name: string; parentId?: string; color?: string }
    if (!name) throw new HttpsError('invalid-argument', 'name required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.createFolder(request.auth.uid, name, parentId, color)
  }
)

export const listDocumentFolders = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    return manager.listFolders(request.auth.uid)
  }
)

export const rebuildDocumentIndex = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
    const manager = getDocumentManager(request.auth.uid, db(), apiKey())
    await manager.rebuildIndex(request.auth.uid)
    return { success: true }
  }
)
