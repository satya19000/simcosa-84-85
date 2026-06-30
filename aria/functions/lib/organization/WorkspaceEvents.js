"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceEvents = void 0;
const events_1 = require("events");
/** Lightweight in-process event bus — mirrors ApprovalEvents.ts. Best-effort, in-memory only (no cross-instance fan-out). */
class WorkspaceEvents {
    static emit(eventName, payload) {
        WorkspaceEvents.emitter.emit(eventName, payload);
        WorkspaceEvents.emitter.emit('*', payload);
    }
    static on(eventName, listener) {
        WorkspaceEvents.emitter.on(eventName, listener);
    }
    static off(eventName, listener) {
        WorkspaceEvents.emitter.off(eventName, listener);
    }
}
exports.WorkspaceEvents = WorkspaceEvents;
WorkspaceEvents.emitter = new events_1.EventEmitter();
//# sourceMappingURL=WorkspaceEvents.js.map