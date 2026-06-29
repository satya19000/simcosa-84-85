"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphBuilder = void 0;
const MemoryGraph_1 = require("./MemoryGraph");
const RelationshipEngine_1 = require("./RelationshipEngine");
const MemoryEvents_1 = require("./MemoryEvents");
/**
 * Translates domain objects (tasks, contacts, reminders, chat) into graph nodes and edges.
 * Always upserts — never creates duplicates.
 */
class GraphBuilder {
    constructor(db, userId, apiKey, config) {
        this.userId = userId;
        this.graph = new MemoryGraph_1.MemoryGraph(db, userId);
        this.relationshipEngine = new RelationshipEngine_1.RelationshipEngine(this.graph, config, apiKey);
    }
    async buildFromTask(input) {
        const result = { nodesCreated: 0, nodesUpdated: 0, edgesCreated: 0, edgesUpdated: 0 };
        const { node: taskNode, created: taskCreated } = await this.graph.upsertNode('task', input.title, input.description ?? '', { externalId: input.id, source: 'task' }, 55);
        created(taskCreated, result);
        if (input.assignedTo) {
            const { node: personNode, created: pc } = await this.graph.upsertNode('person', input.assignedTo, '', { source: 'task' }, 60);
            created(pc, result);
            const { created: ec } = await this.graph.upsertEdge(taskNode.id, personNode.id, 'ASSIGNED_TO', { weight: 0.8, confidence: 1 });
            edgeCreated(ec, result);
        }
        if (input.projectName) {
            const { node: projNode, created: pc } = await this.graph.upsertNode('project', input.projectName, '', { source: 'task' }, 65);
            created(pc, result);
            const { created: ec } = await this.graph.upsertEdge(taskNode.id, projNode.id, 'PART_OF', { weight: 0.9, confidence: 1 });
            edgeCreated(ec, result);
        }
        // AI relationship extraction from description
        if (input.description && input.description.length > 20) {
            const edges = await this.relationshipEngine.extractAndPersist(input.description, this.userId);
            result.edgesCreated += edges.length;
        }
        await MemoryEvents_1.MemoryEvents.emit('graph:node:created', this.userId, { nodeId: taskNode.id, source: 'task' });
        return result;
    }
    async buildFromContact(input) {
        const result = { nodesCreated: 0, nodesUpdated: 0, edgesCreated: 0, edgesUpdated: 0 };
        const { node: personNode, created: pc } = await this.graph.upsertNode('person', input.name, input.role ?? '', { externalId: input.id, source: 'contact', role: input.role }, 70);
        created(pc, result);
        if (input.organization) {
            const orgType = isHospital(input.organization) ? 'hospital' : 'organization';
            const { node: orgNode, created: oc } = await this.graph.upsertNode(orgType, input.organization, '', { source: 'contact' }, 65);
            created(oc, result);
            const { created: ec } = await this.graph.upsertEdge(personNode.id, orgNode.id, 'WORKS_AT', { weight: 0.9, confidence: 1 });
            edgeCreated(ec, result);
        }
        if (input.notes && input.notes.length > 20) {
            const edges = await this.relationshipEngine.extractAndPersist(input.notes, this.userId);
            result.edgesCreated += edges.length;
        }
        await MemoryEvents_1.MemoryEvents.emit('graph:node:created', this.userId, { nodeId: personNode.id, source: 'contact' });
        return result;
    }
    async buildFromReminder(input) {
        const result = { nodesCreated: 0, nodesUpdated: 0, edgesCreated: 0, edgesUpdated: 0 };
        const { node: reminderNode, created: rc } = await this.graph.upsertNode('reminder', input.title, input.dueAt ? `Due: ${input.dueAt}` : '', { externalId: input.id, source: 'reminder', dueAt: input.dueAt }, 60);
        created(rc, result);
        if (input.relatedContactName) {
            const { node: personNode, created: pc } = await this.graph.upsertNode('person', input.relatedContactName, '', { source: 'reminder' }, 60);
            created(pc, result);
            const { created: ec } = await this.graph.upsertEdge(reminderNode.id, personNode.id, 'RELATED_TO', { weight: 0.7, confidence: 0.9 });
            edgeCreated(ec, result);
        }
        // Extract any relationships from reminder text
        const edges = await this.relationshipEngine.extractAndPersist(input.title, this.userId);
        result.edgesCreated += edges.length;
        return result;
    }
    async buildFromChat(input) {
        const result = { nodesCreated: 0, nodesUpdated: 0, edgesCreated: 0, edgesUpdated: 0 };
        // Only extract from user messages (they contain real-world facts)
        if (input.role !== 'user')
            return result;
        if (input.text.length < 20)
            return result;
        const edges = await this.relationshipEngine.extractAndPersist(input.text, this.userId);
        result.edgesCreated += edges.length;
        // Log the conversation as a node
        const { created: cc } = await this.graph.upsertNode('conversation', `Chat: ${input.text.slice(0, 60)}`, input.text.slice(0, 300), { source: 'chat', messageId: input.messageId }, 30);
        created(cc, result);
        return result;
    }
}
exports.GraphBuilder = GraphBuilder;
function created(wasCreated, result) {
    if (wasCreated)
        result.nodesCreated++;
    else
        result.nodesUpdated++;
}
function edgeCreated(wasCreated, result) {
    if (wasCreated)
        result.edgesCreated++;
    else
        result.edgesUpdated++;
}
function isHospital(name) {
    const lower = name.toLowerCase();
    return lower.includes('hospital') || lower.includes('clinic') || lower.includes('medical');
}
//# sourceMappingURL=GraphBuilder.js.map