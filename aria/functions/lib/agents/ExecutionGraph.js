"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionGraph = void 0;
/**
 * Directed acyclic graph of agent tasks for a single orchestration run.
 * Nodes are tasks; edges represent dependencies.
 */
class ExecutionGraph {
    constructor(graphRunId) {
        this.graphRunId = graphRunId;
        this.nodes = new Map();
    }
    addTask(task) {
        this.nodes.set(task.taskId, { task });
    }
    setResult(taskId, result) {
        const node = this.nodes.get(taskId);
        if (node) {
            node.result = result;
            node.completedAt = result.completedAt;
            if (node.startedAt) {
                node.durationMs = new Date(node.completedAt).getTime() - new Date(node.startedAt).getTime();
            }
        }
    }
    markStarted(taskId) {
        const node = this.nodes.get(taskId);
        if (node) {
            node.startedAt = new Date().toISOString();
            node.task.startedAt = node.startedAt;
        }
    }
    setStatus(taskId, status) {
        const node = this.nodes.get(taskId);
        if (node)
            node.task.status = status;
    }
    getNode(taskId) {
        return this.nodes.get(taskId);
    }
    /** Return tasks whose dependencies have all completed successfully. */
    getReady() {
        return Array.from(this.nodes.values())
            .filter((node) => {
            if (node.task.status !== 'pending' && node.task.status !== 'queued')
                return false;
            return node.task.dependsOn.every((depId) => {
                const dep = this.nodes.get(depId);
                return dep?.task.status === 'completed';
            });
        })
            .map((n) => n.task)
            .sort((a, b) => b.priority - a.priority);
    }
    /** Return true if all tasks have a terminal status. */
    isComplete() {
        return Array.from(this.nodes.values()).every((n) => ['completed', 'failed', 'skipped', 'cancelled'].includes(n.task.status));
    }
    hasFailed() {
        return Array.from(this.nodes.values()).some((n) => n.task.status === 'failed');
    }
    allNodes() {
        return Array.from(this.nodes.values());
    }
    /** Topological order (Kahn's algorithm) — returns taskIds in dependency order. */
    topologicalOrder() {
        const inDegree = new Map();
        const adjacency = new Map();
        for (const [id, node] of this.nodes) {
            inDegree.set(id, node.task.dependsOn.length);
            adjacency.set(id, []);
        }
        for (const [id, node] of this.nodes) {
            for (const dep of node.task.dependsOn) {
                adjacency.get(dep)?.push(id);
            }
        }
        const queue = Array.from(inDegree.entries())
            .filter(([, deg]) => deg === 0)
            .map(([id]) => id);
        const result = [];
        while (queue.length > 0) {
            const id = queue.shift();
            result.push(id);
            for (const next of adjacency.get(id) ?? []) {
                const deg = (inDegree.get(next) ?? 0) - 1;
                inDegree.set(next, deg);
                if (deg === 0)
                    queue.push(next);
            }
        }
        return result;
    }
}
exports.ExecutionGraph = ExecutionGraph;
//# sourceMappingURL=ExecutionGraph.js.map