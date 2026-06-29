"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = void 0;
class AgentRegistry {
    constructor() {
        this.agents = new Map();
        this.manifests = new Map();
    }
    register(agent) {
        if (this.agents.has(agent.manifest.id)) {
            throw new Error(`Agent "${agent.manifest.id}" is already registered`);
        }
        this.agents.set(agent.manifest.id, agent);
        this.manifests.set(agent.manifest.id, agent.manifest);
    }
    unregister(id) {
        this.agents.delete(id);
        this.manifests.delete(id);
    }
    get(id) {
        return this.agents.get(id);
    }
    getByCapability(capability) {
        return Array.from(this.agents.values()).filter((a) => a.status !== 'disabled' &&
            a.status !== 'error' &&
            a.status !== 'shutdown' &&
            !a.manifest.placeholder &&
            a.manifest.capabilities.includes(capability));
    }
    listAll() {
        return Array.from(this.agents.values());
    }
    listManifests() {
        return Array.from(this.manifests.values());
    }
    has(id) {
        return this.agents.has(id);
    }
    size() {
        return this.agents.size;
    }
}
exports.AgentRegistry = AgentRegistry;
//# sourceMappingURL=AgentRegistry.js.map