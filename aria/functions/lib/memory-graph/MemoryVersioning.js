"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryVersioning = void 0;
const HISTORY_COLLECTION = 'memoryHistory';
/**
 * Maintains a version history for graph nodes.
 * Writes a snapshot before each update for audit and rollback.
 */
class MemoryVersioning {
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }
    async snapshot(node, reason) {
        const snap = {
            nodeId: node.id,
            version: node.version,
            data: { ...node },
            snapshotAt: new Date().toISOString(),
            reason,
        };
        await this.db
            .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
            .doc(`${node.id}_v${node.version}`)
            .set(snap);
    }
    async getHistory(nodeId, limit = 20) {
        const snap = await this.db
            .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
            .where('nodeId', '==', nodeId)
            .orderBy('version', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async getVersion(nodeId, version) {
        const snap = await this.db
            .collection(`users/${this.userId}/${HISTORY_COLLECTION}`)
            .doc(`${nodeId}_v${version}`)
            .get();
        return snap.exists ? snap.data() : null;
    }
}
exports.MemoryVersioning = MemoryVersioning;
//# sourceMappingURL=MemoryVersioning.js.map