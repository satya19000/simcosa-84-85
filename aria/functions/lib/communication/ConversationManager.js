"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const ConversationThread_1 = require("./ConversationThread");
const ConversationMemory_1 = require("./ConversationMemory");
const CommunicationRouter_1 = require("./CommunicationRouter");
const CommunicationEvents_1 = require("./CommunicationEvents");
const memory_graph_1 = require("../memory-graph");
const uuid_1 = require("uuid");
class ConversationManager {
    constructor(db, config, registry, apiKey) {
        this.db = db;
        this.registry = registry;
        this.apiKey = apiKey;
        this.threadStore = new ConversationThread_1.ConversationThreadStore(db);
        this.memory = new ConversationMemory_1.ConversationMemory(db);
        this.router = new CommunicationRouter_1.CommunicationRouter(config, this.apiKey, config.analysisBudgetTokens, config.summaryBudgetTokens, config.replyBudgetTokens);
    }
    // ── Message Ingestion ──────────────────────────────────────────────────────
    async ingestMessage(userId, message) {
        // Find or create thread
        let thread = await this.threadStore.findByProviderThreadId(userId, message.providerId, message.providerThreadId ?? message.id);
        if (!thread) {
            thread = await this.threadStore.createThread(userId, {
                providerId: message.providerId,
                providerType: message.providerType,
                providerThreadId: message.providerThreadId ?? message.id,
                subject: message.subject,
                participants: [message.from, ...message.to],
                lastMessageAt: message.receivedAt,
                lastMessagePreview: message.body.slice(0, 120),
                messageCount: 0,
                unreadCount: message.direction === 'inbound' ? 1 : 0,
                status: 'active',
                labels: message.labels,
                starred: message.starred,
            });
        }
        else {
            await this.threadStore.updateThread(userId, thread.id, {
                lastMessageAt: message.receivedAt,
                lastMessagePreview: message.body.slice(0, 120),
                messageCount: (thread.messageCount ?? 0) + 1,
                unreadCount: message.direction === 'inbound' ? (thread.unreadCount ?? 0) + 1 : thread.unreadCount,
            });
        }
        message.threadId = thread.id;
        if (!message.id)
            message.id = (0, uuid_1.v4)();
        await this.threadStore.saveMessage(message);
        // Record communication style
        if (message.direction === 'inbound') {
            for (const participant of [message.from]) {
                if (participant.contactId) {
                    await this.memory.recordInteraction(userId, participant.contactId, message.providerType);
                }
            }
        }
        void CommunicationEvents_1.CommunicationEvents.emit('message:received', userId, { messageId: message.id, threadId: thread.id });
        return thread;
    }
    // ── Send Message ───────────────────────────────────────────────────────────
    async sendMessage(userId, providerId, opts) {
        const provider = this.registry.getProvider(providerId);
        if (!provider)
            throw new Error(`Provider "${providerId}" not found`);
        const message = await provider.send(userId, opts);
        message.userId = userId;
        message.direction = 'outbound';
        if (!message.id)
            message.id = (0, uuid_1.v4)();
        if (!message.receivedAt)
            message.receivedAt = new Date().toISOString();
        const thread = await this.ingestMessage(userId, message);
        void CommunicationEvents_1.CommunicationEvents.emit('message:sent', userId, { messageId: message.id, threadId: thread.id });
        return message;
    }
    // ── Thread Operations ──────────────────────────────────────────────────────
    async getThread(userId, threadId) {
        return this.threadStore.getThread(userId, threadId);
    }
    async listThreads(userId, opts = {}) {
        return this.threadStore.listThreads(userId, opts);
    }
    async getMessages(userId, threadId, limit = 50) {
        return this.threadStore.getMessages(userId, threadId, limit);
    }
    async markRead(userId, threadId) {
        return this.threadStore.markRead(userId, threadId);
    }
    async archiveThread(userId, threadId) {
        await this.threadStore.updateThread(userId, threadId, { status: 'archived' });
        void CommunicationEvents_1.CommunicationEvents.emit('thread:archived', userId, { threadId });
    }
    // ── Intelligence ───────────────────────────────────────────────────────────
    async analyzeThread(userId, threadId) {
        const thread = await this.threadStore.getThread(userId, threadId);
        if (!thread)
            throw new Error('Thread not found');
        const messages = await this.threadStore.getMessages(userId, threadId, 30);
        const analysis = await this.router.analyzeThread(thread, messages);
        // Persist analysis
        await this.db.collection(`users/${userId}/threadAnalysis`).doc(threadId).set(analysis);
        // Link thread to memory graph
        await this.linkThreadToMemory(userId, thread, analysis);
        void CommunicationEvents_1.CommunicationEvents.emit('analysis:complete', userId, { threadId, suggestionCount: analysis.suggestions.length });
        return analysis;
    }
    async generateSummary(userId, threadId, type = 'thread') {
        const thread = await this.threadStore.getThread(userId, threadId);
        if (!thread)
            throw new Error('Thread not found');
        const messages = await this.threadStore.getMessages(userId, threadId, 50);
        const summary = await this.router.generateSummary(thread, messages, type);
        await this.db.collection(`users/${userId}/conversationSummaries`).doc(summary.id).set(summary);
        return summary;
    }
    async generateReply(userId, messageId, tone) {
        const message = await this.threadStore.getMessage(userId, messageId);
        if (!message)
            throw new Error('Message not found');
        const thread = await this.threadStore.getThread(userId, message.threadId);
        if (!thread)
            throw new Error('Thread not found');
        return this.router.generateReply(message, thread, tone);
    }
    // ── Sync ──────────────────────────────────────────────────────────────────
    async syncProvider(userId, providerId) {
        const provider = this.registry.getProvider(providerId);
        if (!provider)
            throw new Error(`Provider "${providerId}" not found`);
        return provider.sync(userId);
    }
    // ── Memory Graph Integration ───────────────────────────────────────────────
    async linkThreadToMemory(userId, thread, analysis) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node: threadNode } = await graph.upsertNode('conversation', thread.subject ?? `${thread.providerType} conversation`, `${thread.providerType} thread with ${thread.participants.length} participants`, {
                threadId: thread.id,
                providerType: thread.providerType,
                messageCount: thread.messageCount,
                topics: analysis.topics,
            }, 35);
            for (const participant of thread.participants) {
                if (!participant.name)
                    continue;
                const { node: personNode } = await graph.upsertNode('person', participant.name, `Participant in ${thread.providerType} thread`, { address: participant.address, contactId: participant.contactId }, 50);
                await graph.upsertEdge(personNode.id, threadNode.id, 'ATTENDED', {
                    weight: 0.7,
                    confidence: 0.8,
                });
            }
        }
        catch {
            // Memory linking is best-effort
        }
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=ConversationManager.js.map