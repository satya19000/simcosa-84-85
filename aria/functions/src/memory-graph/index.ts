import type * as admin from 'firebase-admin'
import { MemoryGraph } from './MemoryGraph'
import { GraphBuilder } from './GraphBuilder'
import { GraphIndexer } from './GraphIndexer'
import { GraphRetriever } from './GraphRetriever'
import { GraphSearch } from './GraphSearch'
import { RelationshipEngine } from './RelationshipEngine'
import { KnowledgeIndex } from './KnowledgeIndex'
import { MemoryScorer } from './MemoryScorer'
import { MemoryCompressor } from './MemoryCompressor'
import { MemoryExpander } from './MemoryExpander'
import { MemoryValidator } from './MemoryValidator'
import { MemoryVersioning } from './MemoryVersioning'
import { MemoryAnalytics } from './MemoryAnalytics'
import { DEFAULT_MEMORY_CONFIG, resolveMemoryConfig } from './MemoryConfig'
import type { MemoryConfig } from './MemoryConfig'
import type { GraphSearchOptions, GraphStats } from './MemoryTypes'

export type { GraphNode } from './MemoryTypes'
export type { GraphEdge } from './MemoryTypes'
export type { GraphSearchResult, GraphSearchOptions, GraphStats } from './MemoryTypes'
export type { NodeType, EdgeType } from './MemoryTypes'
export { MemoryEvents } from './MemoryEvents'
export { MemoryPermissions } from './MemoryPermissions'
export type { MemoryRole, MemoryAction } from './MemoryPermissions'
export type { BuildResult } from './GraphBuilder'
export type { ValidationReport } from './MemoryValidator'
export type { GraphStats as MemoryGraphStats } from './MemoryTypes'

// ── Per-user singleton state (warm-instance cache) ────────────────────────────

interface UserGraphSession {
  graph: MemoryGraph
  index: KnowledgeIndex
  indexer: GraphIndexer
  scorer: MemoryScorer
  compressor: MemoryCompressor
  expander: MemoryExpander
  relationshipEngine: RelationshipEngine
  search: GraphSearch
  retriever: GraphRetriever
  builder: GraphBuilder
  validator: MemoryValidator
  versioning: MemoryVersioning
  analytics: MemoryAnalytics
  createdAt: number
}

const sessions = new Map<string, UserGraphSession>()
const SESSION_TTL_MS = 15 * 60 * 1000 // 15 min

function getOrCreateSession(
  userId: string,
  db: admin.firestore.Firestore,
  apiKey: string,
  configOverride?: Partial<MemoryConfig>
): UserGraphSession {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing

  const config = resolveMemoryConfig(configOverride)

  const graph = new MemoryGraph(db, userId)
  const index = new KnowledgeIndex(graph, config)
  const indexer = new GraphIndexer(index, graph)
  const scorer = new MemoryScorer(config)
  const compressor = new MemoryCompressor(apiKey)
  const expander = new MemoryExpander(graph)
  const relationshipEngine = new RelationshipEngine(graph, config, apiKey)
  const search = new GraphSearch(graph, index, scorer, relationshipEngine, config, apiKey)
  const retriever = new GraphRetriever(search, graph, expander, compressor, config)
  const builder = new GraphBuilder(db, userId, apiKey, config)
  const validator = new MemoryValidator(graph)
  const versioning = new MemoryVersioning(db, userId)
  const analytics = new MemoryAnalytics(graph, config)

  const session: UserGraphSession = {
    graph, index, indexer, scorer, compressor, expander,
    relationshipEngine, search, retriever, builder,
    validator, versioning, analytics,
    createdAt: Date.now(),
  }

  sessions.set(userId, session)
  return session
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getMemoryGraph(userId: string, db: admin.firestore.Firestore, apiKey: string): MemoryGraph {
  return getOrCreateSession(userId, db, apiKey).graph
}

export function getGraphBuilder(userId: string, db: admin.firestore.Firestore, apiKey: string): GraphBuilder {
  return getOrCreateSession(userId, db, apiKey).builder
}

export function getGraphRetriever(userId: string, db: admin.firestore.Firestore, apiKey: string): GraphRetriever {
  return getOrCreateSession(userId, db, apiKey).retriever
}

export function getGraphSearch(userId: string, db: admin.firestore.Firestore, apiKey: string): GraphSearch {
  return getOrCreateSession(userId, db, apiKey).search
}

export function getGraphIndexer(userId: string, db: admin.firestore.Firestore, apiKey: string): GraphIndexer {
  return getOrCreateSession(userId, db, apiKey).indexer
}

export function getMemoryValidator(userId: string, db: admin.firestore.Firestore, apiKey: string): MemoryValidator {
  return getOrCreateSession(userId, db, apiKey).validator
}

export function getMemoryAnalytics(userId: string, db: admin.firestore.Firestore, apiKey: string): MemoryAnalytics {
  return getOrCreateSession(userId, db, apiKey).analytics
}

export function getRelationshipEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): RelationshipEngine {
  return getOrCreateSession(userId, db, apiKey).relationshipEngine
}

export function getMemoryVersioning(userId: string, db: admin.firestore.Firestore, apiKey: string): MemoryVersioning {
  return getOrCreateSession(userId, db, apiKey).versioning
}

/** High-level: search the memory graph and return compressed context for Claude. */
export async function retrieveMemoryContext(
  userId: string,
  db: admin.firestore.Firestore,
  apiKey: string,
  query: string,
  mode: GraphSearchOptions['mode'] = 'hybrid'
): Promise<string> {
  const retriever = getGraphRetriever(userId, db, apiKey)
  const result = await retriever.retrieve({ query, mode, userId, includeEdges: true })
  return result.compressedContext
}

/** High-level: get graph statistics for a user. */
export async function getGraphStats(
  userId: string,
  db: admin.firestore.Firestore,
  apiKey: string
): Promise<GraphStats> {
  return getMemoryAnalytics(userId, db, apiKey).computeStats()
}

export { DEFAULT_MEMORY_CONFIG }
export type { MemoryConfig }
