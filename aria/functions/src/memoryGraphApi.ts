import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import {
  getGraphBuilder,
  getGraphRetriever,
  getGraphSearch,
  getGraphIndexer,
  getMemoryValidator,
  getMemoryAnalytics,
  getMemoryGraph,
  getRelationshipEngine,
} from './memory-graph'
import type { GraphSearchOptions } from './memory-graph'

// ── Build graph from domain objects ──────────────────────────────────────────

export const buildMemoryFromContact = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const builder = getGraphBuilder(uid, db, apiKey)
    return builder.buildFromContact(request.data)
  }
)

export const buildMemoryFromTask = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const builder = getGraphBuilder(uid, db, apiKey)
    return builder.buildFromTask(request.data)
  }
)

export const buildMemoryFromReminder = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const builder = getGraphBuilder(uid, db, apiKey)
    return builder.buildFromReminder(request.data)
  }
)

export const buildMemoryFromChat = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const builder = getGraphBuilder(uid, db, apiKey)
    return builder.buildFromChat(request.data)
  }
)

// ── Search & retrieval ────────────────────────────────────────────────────────

export const searchMemoryGraph = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const { query, mode = 'hybrid', maxNodes, nodeTypes, includeEdges } = request.data as Partial<GraphSearchOptions> & { query: string }
    if (!query) throw new HttpsError('invalid-argument', 'query is required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const search = getGraphSearch(uid, db, apiKey)
    return search.search({ query, mode, maxNodes, nodeTypes, includeEdges, userId: uid })
  }
)

export const retrieveMemoryContext = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const { query, mode = 'hybrid' } = request.data as { query: string; mode?: GraphSearchOptions['mode'] }
    if (!query) throw new HttpsError('invalid-argument', 'query is required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const retriever = getGraphRetriever(uid, db, apiKey)
    return retriever.retrieve({ query, mode, userId: uid, includeEdges: true })
  }
)

// ── Graph management ──────────────────────────────────────────────────────────

export const rebuildMemoryIndex = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    return getGraphIndexer(uid, db, apiKey).rebuild()
  }
)

export const validateMemoryGraph = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    return getMemoryValidator(uid, db, apiKey).validate()
  }
)

export const getMemoryGraphStats = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const [stats, topContacts, activeProjects] = await Promise.all([
      getMemoryAnalytics(uid, db, apiKey).computeStats(),
      getMemoryAnalytics(uid, db, apiKey).computeTopContacts(),
      getMemoryAnalytics(uid, db, apiKey).computeActiveProjects(),
    ])
    return { stats, topContacts, activeProjects }
  }
)

export const extractRelationships = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const { text } = request.data as { text: string }
    if (!text) throw new HttpsError('invalid-argument', 'text is required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    return getRelationshipEngine(uid, db, apiKey).extractAndPersist(text, uid)
  }
)

export const upsertMemoryNode = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const { type, title, summary, metadata, importance } = request.data
    if (!type || !title) throw new HttpsError('invalid-argument', 'type and title are required')
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const graph = getMemoryGraph(uid, db, apiKey)
    return graph.upsertNode(type, title, summary ?? '', metadata ?? {}, importance ?? 50)
  }
)

export const listMemoryNodes = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required')
    const { limit = 100 } = request.data as { limit?: number }
    const db = admin.firestore()
    const apiKey = process.env['ANTHROPIC_API_KEY'] ?? ''
    const graph = getMemoryGraph(uid, db, apiKey)
    return graph.listNodes(limit)
  }
)
