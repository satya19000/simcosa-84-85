"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryGraph = void 0;
const GraphNode_1 = require("./GraphNode");
const GraphEdge_1 = require("./GraphEdge");
const NODES_COLLECTION = 'memoryNodes';
const EDGES_COLLECTION = 'memoryEdges';
const FINGERPRINTS_COLLECTION = 'memoryFingerprints';
/**
 * Low-level persistence layer for the memory graph.
 * All reads/writes to Firestore go through this class.
 * No AI calls, no business logic — pure storage.
 */
class MemoryGraph {
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }
    // ── Node operations ──────────────────────────────────────────────────────
    nodesRef() {
        return this.db.collection(`users/${this.userId}/${NODES_COLLECTION}`);
    }
    edgesRef() {
        return this.db.collection(`users/${this.userId}/${EDGES_COLLECTION}`);
    }
    fingerprintsRef() {
        return this.db.collection(`users/${this.userId}/${FINGERPRINTS_COLLECTION}`);
    }
    async saveNode(node) {
        await this.nodesRef().doc(node.id).set(node);
        // Maintain fingerprint → id mapping for dedup
        const fp = (0, GraphNode_1.nodeFingerprint)(node.type, node.title, this.userId);
        await this.fingerprintsRef().doc(this.fingerprintKey(fp)).set({ nodeId: node.id, fp });
    }
    async getNode(id) {
        const snap = await this.nodesRef().doc(id).get();
        return snap.exists ? snap.data() : null;
    }
    async findByFingerprint(type, title) {
        const fp = (0, GraphNode_1.nodeFingerprint)(type, title, this.userId);
        const snap = await this.fingerprintsRef().doc(this.fingerprintKey(fp)).get();
        if (!snap.exists)
            return null;
        const { nodeId } = snap.data();
        return this.getNode(nodeId);
    }
    async upsertNode(type, title, summary, metadata, importance) {
        const existing = await this.findByFingerprint(type, title);
        if (existing) {
            const merged = (0, GraphNode_1.mergeNodes)(existing, { summary, metadata, importance });
            await this.saveNode(merged);
            return { node: merged, created: false };
        }
        const node = (0, GraphNode_1.createNode)(this.userId, type, title, summary, metadata, importance);
        await this.saveNode(node);
        return { node, created: true };
    }
    async updateNode(id, patch) {
        const existing = await this.getNode(id);
        if (!existing)
            return null;
        const updated = (0, GraphNode_1.updateNode)(existing, patch);
        await this.saveNode(updated);
        return updated;
    }
    async deleteNode(id) {
        const node = await this.getNode(id);
        if (node) {
            const fp = (0, GraphNode_1.nodeFingerprint)(node.type, node.title, this.userId);
            await this.fingerprintsRef().doc(this.fingerprintKey(fp)).delete();
        }
        await this.nodesRef().doc(id).delete();
        // Delete connected edges
        const outgoing = await this.edgesRef().where('fromId', '==', id).get();
        const incoming = await this.edgesRef().where('toId', '==', id).get();
        const batch = this.db.batch();
        outgoing.docs.forEach((d) => batch.delete(d.ref));
        incoming.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    async listNodes(limit = 200) {
        const snap = await this.nodesRef().orderBy('importance', 'desc').limit(limit).get();
        return snap.docs.map((d) => d.data());
    }
    async queryNodesByType(type, limit = 100) {
        const snap = await this.nodesRef().where('type', '==', type).limit(limit).get();
        return snap.docs.map((d) => d.data());
    }
    // ── Edge operations ──────────────────────────────────────────────────────
    async saveEdge(edge) {
        await this.edgesRef().doc(edge.id).set(edge);
    }
    async getEdge(id) {
        const snap = await this.edgesRef().doc(id).get();
        return snap.exists ? snap.data() : null;
    }
    async upsertEdge(fromId, toId, type, opts = {}) {
        // Look for existing edge with same fingerprint
        const fp = (0, GraphEdge_1.edgeFingerprint)(fromId, toId, type);
        const existing = await this.edgesRef().where('fromId', '==', fromId).where('toId', '==', toId).where('type', '==', type).limit(1).get();
        if (!existing.empty) {
            const edge = existing.docs[0].data();
            const updated = (0, GraphEdge_1.updateEdge)(edge, {
                weight: Math.max(edge.weight, opts.weight ?? edge.weight),
                confidence: Math.max(edge.confidence, opts.confidence ?? edge.confidence),
                metadata: { ...edge.metadata, ...opts.metadata },
            });
            await this.saveEdge(updated);
            return { edge: updated, created: false };
        }
        const edge = (0, GraphEdge_1.createEdge)(this.userId, fromId, toId, type, opts);
        // Store fingerprint in metadata for reference
        await this.saveEdge({ ...edge, metadata: { ...edge.metadata, fp } });
        return { edge, created: true };
    }
    async getEdgesFrom(nodeId) {
        const snap = await this.edgesRef().where('fromId', '==', nodeId).get();
        return snap.docs.map((d) => d.data());
    }
    async getEdgesTo(nodeId) {
        const snap = await this.edgesRef().where('toId', '==', nodeId).get();
        return snap.docs.map((d) => d.data());
    }
    async getEdgesForNode(nodeId) {
        const [out, inc] = await Promise.all([this.getEdgesFrom(nodeId), this.getEdgesTo(nodeId)]);
        return [...out, ...inc];
    }
    async countNodes() {
        const snap = await this.nodesRef().count().get();
        return snap.data().count;
    }
    async countEdges() {
        const snap = await this.edgesRef().count().get();
        return snap.data().count;
    }
    fingerprintKey(fp) {
        // Firestore doc ids can't contain '/'
        return Buffer.from(fp).toString('base64').replace(/\//g, '_');
    }
}
exports.MemoryGraph = MemoryGraph;
//# sourceMappingURL=MemoryGraph.js.map