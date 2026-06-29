// ── Node types ────────────────────────────────────────────────────────────────

export type NodeType =
  | 'person'
  | 'organization'
  | 'hospital'
  | 'office'
  | 'project'
  | 'meeting'
  | 'task'
  | 'reminder'
  | 'location'
  | 'document'
  | 'conversation'
  | 'preference'
  | 'habit'
  | 'vehicle'
  | 'expense'
  | 'health_record'
  | 'public_health_program'
  | 'custom'

export type EdgeType =
  | 'KNOWS'
  | 'WORKS_AT'
  | 'BELONGS_TO'
  | 'PART_OF'
  | 'LOCATED_IN'
  | 'MANAGES'
  | 'ASSIGNED_TO'
  | 'RELATED_TO'
  | 'FOLLOW_UP'
  | 'DEPENDS_ON'
  | 'MENTIONED_IN'
  | 'CREATED_BY'
  | 'UPDATED_BY'
  | 'ATTENDED'
  | 'VISITED'
  | 'CUSTOM'

export type NodeId = string
export type EdgeId = string
export type GraphVersion = number

// ── Graph node ────────────────────────────────────────────────────────────────

export interface GraphNodeMetadata {
  externalId?: string   // e.g. Firestore doc id this node was derived from
  source?: string       // 'task' | 'contact' | 'chat' | 'plugin' | ...
  [key: string]: unknown
}

export interface GraphNode {
  id: NodeId
  type: NodeType
  title: string
  summary: string
  metadata: GraphNodeMetadata
  importance: number      // 0-100
  pinned: boolean
  version: GraphVersion
  createdAt: string
  updatedAt: string
  userId: string
}

// ── Graph edge ────────────────────────────────────────────────────────────────

export interface GraphEdge {
  id: EdgeId
  fromId: NodeId
  toId: NodeId
  type: EdgeType
  label?: string          // human-readable override
  weight: number          // 0-1 strength
  confidence: number      // 0-1 AI confidence
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  userId: string
}

// ── Search / retrieval ────────────────────────────────────────────────────────

export type SearchMode = 'semantic' | 'keyword' | 'relationship' | 'hybrid'

export interface GraphSearchOptions {
  query: string
  mode: SearchMode
  maxNodes?: number
  maxDepth?: number         // for relationship traversal
  nodeTypes?: NodeType[]
  minImportance?: number
  includeEdges?: boolean
  userId: string
}

export interface GraphSearchResult {
  node: GraphNode
  score: number             // combined ranking score 0-100
  matchReason: string
  edges?: GraphEdge[]
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface GraphStats {
  nodeCount: number
  edgeCount: number
  nodesByType: Record<string, number>
  edgesByType: Record<string, number>
  avgEdgesPerNode: number
  orphanNodes: number
  mostConnectedNodes: Array<{ id: NodeId; title: string; degree: number }>
  compressionRatio: number
  lastIndexedAt: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export type MemoryEventName =
  | 'graph:node:created'
  | 'graph:node:updated'
  | 'graph:node:merged'
  | 'graph:node:deleted'
  | 'graph:edge:created'
  | 'graph:edge:updated'
  | 'graph:edge:deleted'
  | 'graph:indexed'
  | 'graph:compressed'
  | 'graph:rebuilt'

export interface MemoryEvent<T = unknown> {
  name: MemoryEventName
  userId: string
  payload: T
  emittedAt: string
}

// ── Plugin extension points ───────────────────────────────────────────────────

export interface NodeTypeRegistration {
  type: string
  label: string
  description: string
}

export interface EdgeTypeRegistration {
  type: string
  label: string
  description: string
}

export interface GraphEnricher {
  readonly name: string
  enrich(node: GraphNode, db: import('firebase-admin').firestore.Firestore): Promise<Partial<GraphNode>>
}

export interface GraphSearchProvider {
  readonly name: string
  search(opts: GraphSearchOptions, nodes: GraphNode[]): Promise<GraphSearchResult[]>
}

export interface AnalyticsProvider {
  readonly name: string
  compute(nodes: GraphNode[], edges: GraphEdge[]): Promise<Record<string, unknown>>
}
