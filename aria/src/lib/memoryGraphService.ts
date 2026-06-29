import { getFunctions, httpsCallable } from 'firebase/functions'

// ── Types mirrored from functions ─────────────────────────────────────────────

export type NodeType =
  | 'person' | 'organization' | 'hospital' | 'office' | 'project' | 'meeting'
  | 'task' | 'reminder' | 'location' | 'document' | 'conversation'
  | 'preference' | 'habit' | 'vehicle' | 'expense' | 'health_record'
  | 'public_health_program' | 'custom'

export type EdgeType =
  | 'KNOWS' | 'WORKS_AT' | 'BELONGS_TO' | 'PART_OF' | 'LOCATED_IN' | 'MANAGES'
  | 'ASSIGNED_TO' | 'RELATED_TO' | 'FOLLOW_UP' | 'DEPENDS_ON' | 'MENTIONED_IN'
  | 'CREATED_BY' | 'UPDATED_BY' | 'ATTENDED' | 'VISITED' | 'CUSTOM'

export interface GraphNode {
  id: string
  type: NodeType
  title: string
  summary: string
  metadata: Record<string, unknown>
  importance: number
  pinned: boolean
  version: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface GraphEdge {
  id: string
  fromId: string
  toId: string
  type: EdgeType
  label?: string
  weight: number
  confidence: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  userId: string
}

export interface GraphSearchResult {
  node: GraphNode
  score: number
  matchReason: string
  edges?: GraphEdge[]
}

export interface GraphStats {
  nodeCount: number
  edgeCount: number
  nodesByType: Record<string, number>
  edgesByType: Record<string, number>
  avgEdgesPerNode: number
  orphanNodes: number
  mostConnectedNodes: Array<{ id: string; title: string; degree: number }>
  compressionRatio: number
  lastIndexedAt: string
}

export interface BuildResult {
  nodesCreated: number
  nodesUpdated: number
  edgesCreated: number
  edgesUpdated: number
}

// ── Callable helpers ──────────────────────────────────────────────────────────

function fn<Req, Res>(name: string) {
  return (data: Req) => httpsCallable<Req, Res>(getFunctions(), name)(data).then((r) => r.data)
}

export const memoryGraphService = {
  buildFromContact: fn<{ id: string; name: string; role?: string; organization?: string; notes?: string }, BuildResult>('buildMemoryFromContact'),
  buildFromTask: fn<object, BuildResult>('buildMemoryFromTask'),
  buildFromReminder: fn<object, BuildResult>('buildMemoryFromReminder'),
  buildFromChat: fn<object, BuildResult>('buildMemoryFromChat'),
  searchGraph: fn<{ query: string; mode?: string; maxNodes?: number; includeEdges?: boolean }, GraphSearchResult[]>('searchMemoryGraph'),
  retrieveContext: fn<{ query: string; mode?: string }, { results: GraphSearchResult[]; compressedContext: string; tokenEstimate: number; retrievedAt: string }>('retrieveMemoryContext'),
  rebuildIndex: fn<Record<string, never>, object>('rebuildMemoryIndex'),
  validate: fn<Record<string, never>, { valid: boolean; issues: unknown[]; checkedNodes: number; checkedEdges: number; ranAt: string }>('validateMemoryGraph'),
  getStats: fn<Record<string, never>, { stats: GraphStats; topContacts: unknown[]; activeProjects: unknown[] }>('getMemoryGraphStats'),
  extractRelationships: fn<{ text: string }, GraphEdge[]>('extractRelationships'),
  upsertNode: fn<{ type: NodeType; title: string; summary?: string; metadata?: object; importance?: number }, { node: GraphNode; created: boolean }>('upsertMemoryNode'),
  listNodes: fn<{ limit?: number }, GraphNode[]>('listMemoryNodes'),
}
