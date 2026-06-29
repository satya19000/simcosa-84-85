import type { GraphEdge, EdgeId, EdgeType, NodeId } from './MemoryTypes'
import { v4 as uuidv4 } from 'uuid'

export function createEdge(
  userId: string,
  fromId: NodeId,
  toId: NodeId,
  type: EdgeType,
  opts: { weight?: number; confidence?: number; label?: string; metadata?: Record<string, unknown> } = {}
): GraphEdge {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    fromId,
    toId,
    type,
    label: opts.label,
    weight: clamp(opts.weight ?? 0.5, 0, 1),
    confidence: clamp(opts.confidence ?? 1, 0, 1),
    metadata: opts.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    userId,
  }
}

export function updateEdge(
  edge: GraphEdge,
  patch: Partial<Pick<GraphEdge, 'weight' | 'confidence' | 'label' | 'metadata'>>
): GraphEdge {
  return {
    ...edge,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
}

export function edgeFingerprint(fromId: NodeId, toId: NodeId, type: EdgeType): string {
  return `${fromId}::${type}::${toId}`
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export type { GraphEdge, EdgeId, EdgeType }
