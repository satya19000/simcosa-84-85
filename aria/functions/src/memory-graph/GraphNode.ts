import type { GraphNode, NodeId, NodeType, GraphNodeMetadata } from './MemoryTypes'
import { v4 as uuidv4 } from 'uuid'

export function createNode(
  userId: string,
  type: NodeType,
  title: string,
  summary = '',
  metadata: GraphNodeMetadata = {},
  importance = 50
): GraphNode {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    type,
    title: title.trim(),
    summary: summary.trim(),
    metadata,
    importance: clamp(importance, 0, 100),
    pinned: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
    userId,
  }
}

export function updateNode(node: GraphNode, patch: Partial<Omit<GraphNode, 'id' | 'userId' | 'createdAt'>>): GraphNode {
  return {
    ...node,
    ...patch,
    id: node.id,
    userId: node.userId,
    createdAt: node.createdAt,
    updatedAt: new Date().toISOString(),
    version: node.version + 1,
  }
}

export function mergeNodes(base: GraphNode, incoming: Partial<GraphNode>): GraphNode {
  return updateNode(base, {
    title: incoming.title ?? base.title,
    summary: incoming.summary?.length ? incoming.summary : base.summary,
    metadata: { ...base.metadata, ...incoming.metadata },
    importance: Math.max(base.importance, incoming.importance ?? 0),
    pinned: base.pinned || (incoming.pinned ?? false),
  })
}

export function nodeFingerprint(type: NodeType, title: string, userId: string): string {
  return `${userId}::${type}::${title.trim().toLowerCase()}`
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export type { GraphNode, NodeId, NodeType }
