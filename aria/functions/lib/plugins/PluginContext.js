"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginStorageService = void 0;
exports.buildPluginContext = buildPluginContext;
/**
 * Namespaced Firestore access for a plugin.
 * All reads/writes are scoped to: users/{userId}/plugins/{pluginId}/
 * Plugins MUST NOT call Firestore directly.
 */
class PluginStorageService {
    constructor(db, userId, pluginId) {
        this.db = db;
        this.userId = userId;
        this.pluginId = pluginId;
        this.basePath = `users/${userId}/plugins/${pluginId}`;
    }
    collection(name) {
        return this.db.doc(this.basePath).collection(name);
    }
    async get(collection, docId) {
        const snap = await this.collection(collection).doc(docId).get();
        return snap.exists ? { id: snap.id, ...snap.data() } : null;
    }
    async add(collection, data) {
        const ref = await this.collection(collection).add({
            ...data,
            _createdAt: new Date().toISOString(),
            _pluginId: this.pluginId,
            _userId: this.userId,
        });
        return ref.id;
    }
    async set(collection, docId, data, merge = true) {
        await this.collection(collection).doc(docId).set({ ...data, _updatedAt: new Date().toISOString() }, { merge });
    }
    async delete(collection, docId) {
        await this.collection(collection).doc(docId).delete();
    }
    async list(collection, opts) {
        let q = this.collection(collection);
        if (opts?.where)
            q = q.where(opts.where[0], opts.where[1], opts.where[2]);
        if (opts?.orderBy)
            q = q.orderBy(opts.orderBy, 'desc');
        if (opts?.limit)
            q = q.limit(opts.limit);
        const snap = await q.get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
}
exports.PluginStorageService = PluginStorageService;
function buildPluginContext(pluginId, userId, db, logger, events, config, metrics, capabilities) {
    return {
        userId,
        storage: new PluginStorageService(db, userId, pluginId),
        logger,
        events,
        config,
        metrics,
        capabilities,
    };
}
//# sourceMappingURL=PluginContext.js.map