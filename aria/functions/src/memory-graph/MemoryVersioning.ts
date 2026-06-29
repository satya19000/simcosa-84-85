import type * as admin from 'firebase-admin'
import type { GraphNode } from './MemoryTypes'

const HISTORY_COLLECTION = 'memoryHistory'

export interface NodeSnapshot {
  nodeId: string
  version: number
  data: GraphNode
  snapshotAt: string
  reason?: string
}

/**
 * Maintains a version history for graph nodes.
 * Writes a snapshot before each update for audit and rollback.
 */
export class MemoryVersioning {
  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly userId: string
  ) {}

  async snapshot(node: GraphNode, reason?: string): Promise<void> {
    const snap: NodeSnapshot = {
      nodeId: node.id,
      version: node.version,
      data: { ...node },
      snapshotAt: new Date().toISOString(),
      reason,
    }
    await this.db
      .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
      .doc(`${node.id}_v${node.version}`)
      .set(snap)
  }

  async getHistory(nodeId: string, limit = 20): Promise<NodeSnapshot[]> {
    const snap = await this.db
      .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
      .where('nodeId', '==', nodeId)
      .orderBy('version', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => d.data() as NodeSnapshot)
  }

  async getVersion(nodeId: string, version: number): Promise<NodeSnapshot | null> {
    const snap = await this.db
      .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
      .doc(`${nodeId}_v${version}`)
      .get()
    return snap.exists ? (snap.data() as NodeSnapshot) : null
  }
}
