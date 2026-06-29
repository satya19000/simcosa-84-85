"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNode = createNode;
exports.updateNode = updateNode;
exports.mergeNodes = mergeNodes;
exports.nodeFingerprint = nodeFingerprint;
const uuid_1 = require("uuid");
function createNode(userId, type, title, summary = '', metadata = {}, importance = 50) {
    const now = new Date().toISOString();
    return {
        id: (0, uuid_1.v4)(),
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
    };
}
function updateNode(node, patch) {
    return {
        ...node,
        ...patch,
        id: node.id,
        userId: node.userId,
        createdAt: node.createdAt,
        updatedAt: new Date().toISOString(),
        version: node.version + 1,
    };
}
function mergeNodes(base, incoming) {
    return updateNode(base, {
        title: incoming.title ?? base.title,
        summary: incoming.summary?.length ? incoming.summary : base.summary,
        metadata: { ...base.metadata, ...incoming.metadata },
        importance: Math.max(base.importance, incoming.importance ?? 0),
        pinned: base.pinned || (incoming.pinned ?? false),
    });
}
function nodeFingerprint(type, title, userId) {
    return `${userId}::${type}::${title.trim().toLowerCase()}`;
}
function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
}
//# sourceMappingURL=GraphNode.js.map