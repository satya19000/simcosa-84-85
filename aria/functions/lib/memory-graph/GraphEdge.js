"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEdge = createEdge;
exports.updateEdge = updateEdge;
exports.edgeFingerprint = edgeFingerprint;
const uuid_1 = require("uuid");
function createEdge(userId, fromId, toId, type, opts = {}) {
    const now = new Date().toISOString();
    return {
        id: (0, uuid_1.v4)(),
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
    };
}
function updateEdge(edge, patch) {
    return {
        ...edge,
        ...patch,
        updatedAt: new Date().toISOString(),
    };
}
function edgeFingerprint(fromId, toId, type) {
    return `${fromId}::${type}::${toId}`;
}
function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
}
//# sourceMappingURL=GraphEdge.js.map