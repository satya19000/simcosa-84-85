"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.ActionRegistry = void 0;
const Errors_1 = require("./Errors");
/**
 * Central registry of all ARIA tools.
 *
 * Actions self-register at module load time via register().
 * ToolExecutor resolves by name — no switch, no if-chains.
 * Singleton: one instance per Cloud Function cold start.
 */
class ActionRegistry {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.actions = new Map();
    }
    static getInstance() {
        if (!ActionRegistry.instance) {
            ActionRegistry.instance = new ActionRegistry();
        }
        return ActionRegistry.instance;
    }
    /**
     * Register an action. Called once per action class at module load time.
     * Throws if the same toolName is registered twice (catches copy-paste bugs).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register(action) {
        if (this.actions.has(action.toolName)) {
            throw new Error(`ActionRegistry: duplicate tool name '${action.toolName}'. Each tool must have a unique name.`);
        }
        this.actions.set(action.toolName, action);
    }
    /**
     * Resolve an action by name.
     * Throws ToolNotFoundError — never returns undefined.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve(toolName) {
        const action = this.actions.get(toolName);
        if (!action)
            throw new Errors_1.ToolNotFoundError(toolName);
        return action;
    }
    /** Returns all registered tool names — useful for system prompt injection. */
    listTools() {
        return Array.from(this.actions.keys()).sort();
    }
    /** Returns true if the given name is registered. */
    has(toolName) {
        return this.actions.has(toolName);
    }
}
exports.ActionRegistry = ActionRegistry;
ActionRegistry.instance = null;
/** Module-level singleton accessor — import this everywhere instead of constructing directly. */
exports.registry = ActionRegistry.getInstance();
//# sourceMappingURL=ActionRegistry.js.map