import type * as admin from 'firebase-admin'
import type { GraphNode, GraphEdge, NodeId, NodeType } from './MemoryTypes'
import { createNode, updateNode, mergeNodes, nodeFingerprint } from './GraphNode'
import { createEdge, updateEdge, edgeFingerprint } from './GraphEdge'
import type { NodeType as NT, EdgeType as ET } from './MemoryTypes'

const NODES_COLLECTION = 'memoryNodes'
const EDGES_COLLECTION = 'memoryEdges'
const FINGERPRINTS_COLLECTION = 'memoryFingerprints'

/**
 * Low-level persistence layer for the memory graph.
 * All reads/writes to Firestore go through this class.
 * No AI calls, no business logic — pure storage.
 */
export class MemoryGraph {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly userId: string
  ) {}

  // ── Node operations ──────────────────────────────────────────────────────

  private nodesRef() {
    return this.db.collection(`users/${this.userId}/${NODES_COLLECTION}`)
  }

  private edgesRef() {
    return this.db.collection(`users/${this.userId}/${EDGES_COLLECTION}`)
  }

  private fingerprintsRef() {
    return this.db.collection(`users/${this.userId}/${FINGERPRINTS_COLLECTION}`)
  }

  async saveNode(node: GraphNode): Promise<void> {
    await this.nodesRef().doc(node.id).set(node)
    // Maintain fingerprint → id mapping for dedup
    const fp = nodeFingerprint(node.type, node.title, this.userId)
    await this.fingerprintsRef().doc(this.fingerprintKey(fp)).set({ nodeId: node.id, fp })
  }

  async getNode(id: NodeId): Promise<GraphNode | null> {
    const snap = await this.nodesRef().doc(id).get()
    return snap.exists ? (snap.data() as GraphNode) : null
  }

  async findByFingerprint(type: NodeType, title: string): Promise<GraphNode | null> {
    const fp = nodeFingerprint(type, title, this.userId)
    const snap = await this.fingerprintsRef().doc(this.fingerprintKey(fp)).get()
    if (!snap.exists) return null
    const { nodeId } = snap.data() as { nodeId: string }
    return this.getNode(nodeId)
  }

  async upsertNode(
    type: NT,
    title: string,
    summary: string,
    metadata: Record<string, unknown>,
    importance: number
  ): Promise<{ node: GraphNode; created: boolean }> {
    const existing = await this.findByFingerprint(type, title)
    if (existing) {
      const merged = mergeNodes(existing, { summary, metadata, importance })
      await this.saveNode(merged)
      return { node: merged, created: false }
    }
    const node = createNode(this.userId, type, title, summary, metadata, importance)
    await this.saveNode(node)
    return { node, created: true }
  }

  async updateNode(id: NodeId, patch: Partial<Omit<GraphNode, 'id' | 'userId' | 'createdAt'>>): Promise<GraphNode | null> {
    const existing = await this.getNode(id)
    if (!existing) return null
    const updated = updateNode(existing, patch)
    await this.saveNode(updated)
    return updated
  }

  async deleteNode(id: NodeId): Promise<void> {
    const node = await this.getNode(id)
    if (node) {
      const fp = nodeFingerprint(node.type, node.title, this.userId)
      await this.fingerprintsRef().doc(this.fingerprintKey(fp)).delete()
    }
    await this.nodesRef().doc(id).delete()
    // Delete connected edges
    const outgoing = await this.edgesRef().where('fromId', '==', id).get()
    const incoming = await this.edgesRef().where('toId', '==', id).get()
    const batch = this.db.batch()
    outgoing.docs.forEach((d) => batch.delete(d.ref))
    incoming.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  async listNodes(limit = 200): Promise<GraphNode[]> {
    const snap = await this.nodesRef().orderBy('importance', 'desc').limit(limit).get()
    return snap.docs.map((d) => d.data() as GraphNode)
  }

  async queryNodesByType(type: NodeType, limit = 100): Promise<GraphNode[]> {
    const snap = await this.nodesRef().where('type', '==', type).limit(limit).get()
    return snap.docs.map((d) => d.data() as GraphNode)
  }

  // ── Edge operations ──────────────────────────────────────────────────────

  async saveEdge(edge: GraphEdge): Promise<void> {
    await this.edgesRef().doc(edge.id).set(edge)
  }

  async getEdge(id: string): Promise<GraphEdge | null> {
    const snap = await this.edgesRef().doc(id).get()
    return snap.exists ? (snap.data() as GraphEdge) : null
  }

  async upsertEdge(
    fromId: NodeId,
    toId: NodeId,
    type: ET,
    opts: { weight?: number; confidence?: number; label?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<{ edge: GraphEdge; created: boolean }> {
    // Look for existing edge with same fingerprint
    const fp = edgeFingerprint(fromId, toId, type)
    const existing = await this.edgesRef().where('fromId', '==', fromId).where('toId', '==', toId).where('type', '==', type).limit(1).get()
    if (!existing.empty) {
      const edge = existing.docs[0]!.data() as GraphEdge
      const updated = updateEdge(edge, {
        weight: Math.max(edge.weight, opts.weight ?? edge.weight),
        confidence: Math.max(edge.confidence, opts.confidence ?? edge.confidence),
        metadata: { ...edge.metadata, ...opts.metadata },
      })
      await this.saveEdge(updated)
      return { edge: updated, created: false }
    }
    const edge = createEdge(this.userId, fromId, toId, type, opts)
    // Store fingerprint in metadata for reference
    await this.saveEdge({ ...edge, metadata: { ...edge.metadata, fp } })
    return { edge, created: true }
  }

  async getEdgesFrom(nodeId: NodeId): Promise<GraphEdge[]> {
    const snap = await this.edgesRef().where('fromId', '==', nodeId).get()
    return snap.docs.map((d) => d.data() as GraphEdge)
  }

  async getEdgesTo(nodeId: NodeId): Promise<GraphEdge[]> {
    const snap = await this.edgesRef().where('toId', '==', nodeId).get()
    return snap.docs.map((d) => d.data() as GraphEdge)
  }

  async getEdgesForNode(nodeId: NodeId): Promise<GraphEdge[]> {
    const [out, inc] = await Promise.all([this.getEdgesFrom(nodeId), this.getEdgesTo(nodeId)])
    return [...out, ...inc]
  }

  async countNodes(): Promise<number> {
    const snap = await this.nodesRef().count().get()
    return snap.data().count
  }

  async countEdges(): Promise<number> {
    const snap = await this.edgesRef().count().get()
    return snap.data().count
  }

  private fingerprintKey(fp: string): string {
    // Firestore doc ids can't contain '/'
    return Buffer.from(fp).toString('base64').replace(/\//g, '_')
  }
}
