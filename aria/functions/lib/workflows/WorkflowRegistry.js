"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRegistry = void 0;
const WorkflowValidator_1 = require("./WorkflowValidator");
/** In-memory registry of workflow definitions. Thread-safe for Cloud Function warm instances. */
class WorkflowRegistry {
    constructor() {
        this.workflows = new Map();
    }
    register(definition) {
        const validation = (0, WorkflowValidator_1.validateWorkflow)(definition);
        if (!validation.valid) {
            const messages = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
            throw new Error(`Invalid workflow "${definition.id}": ${messages}`);
        }
        this.workflows.set(definition.id, definition);
    }
    unregister(id) {
        return this.workflows.delete(id);
    }
    get(id) {
        return this.workflows.get(id);
    }
    has(id) {
        return this.workflows.has(id);
    }
    list() {
        return Array.from(this.workflows.values());
    }
    listEnabled() {
        return this.list().filter((w) => w.enabled);
    }
    listByTrigger(triggerType) {
        return this.listEnabled().filter((w) => w.trigger.type === triggerType);
    }
    search(query) {
        const q = query.toLowerCase();
        return this.list().filter((w) => w.name.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.tags?.some((t) => t.toLowerCase().includes(q)));
    }
    setEnabled(id, enabled) {
        const wf = this.workflows.get(id);
        if (wf) {
            this.workflows.set(id, { ...wf, enabled, updatedAt: new Date().toISOString() });
        }
    }
    size() {
        return this.workflows.size;
    }
}
exports.WorkflowRegistry = WorkflowRegistry;
//# sourceMappingURL=WorkflowRegistry.js.map