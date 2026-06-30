"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationSearch = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const ConversationThread_1 = require("./ConversationThread");
class CommunicationSearch {
    constructor(db, config, apiKey, searchLimit) {
        this.searchLimit = searchLimit;
        this.client = new sdk_1.default({ apiKey });
        this.threadStore = new ConversationThread_1.ConversationThreadStore(db);
        void config;
    }
    async search(userId, opts) {
        const scope = opts.scope ?? 'all';
        const limit = opts.limit ?? this.searchLimit;
        const results = [];
        if (scope === 'all' || scope === 'messages') {
            const msgs = await this.searchMessages(userId, opts.query, limit);
            results.push(...msgs);
        }
        if (scope === 'all' || scope === 'threads') {
            const threads = await this.searchThreads(userId, opts.query, limit);
            results.push(...threads);
        }
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    async searchMessages(userId, query, limit) {
        const messages = await this.threadStore.searchMessages(userId, query, limit);
        return messages.map((m) => ({
            type: 'message',
            id: m.id,
            threadId: m.threadId,
            title: m.subject ?? m.from.name,
            snippet: m.body.slice(0, 200),
            score: this.scoreMessage(m, query),
            providerType: m.providerType,
            date: m.receivedAt,
        }));
    }
    async searchThreads(userId, query, limit) {
        const threads = await this.threadStore.listThreads(userId, { limit: limit * 3 });
        const lower = query.toLowerCase();
        return threads
            .filter((t) => (t.subject ?? '').toLowerCase().includes(lower) ||
            t.lastMessagePreview.toLowerCase().includes(lower))
            .slice(0, limit)
            .map((t) => ({
            type: 'thread',
            id: t.id,
            threadId: t.id,
            title: t.subject ?? `Thread with ${t.participants[0]?.name ?? 'Unknown'}`,
            snippet: t.lastMessagePreview,
            score: 0.6,
            providerType: t.providerType,
            date: t.lastMessageAt,
        }));
    }
    async semanticSearch(userId, query, limit = 10) {
        const threads = await this.threadStore.listThreads(userId, { limit: 50 });
        if (threads.length === 0)
            return [];
        const list = threads
            .slice(0, 30)
            .map((t, i) => `${i}: ${t.subject ?? t.lastMessagePreview.slice(0, 80)}`)
            .join('\n');
        try {
            const response = await this.client.messages.create({
                model: 'claude-opus-4-8',
                max_tokens: 256,
                messages: [
                    {
                        role: 'user',
                        content: `Find conversations most relevant to: "${query}"\n\nConversations:\n${list}\n\nReturn JSON array of indices (0-based): [0,3,7]`,
                    },
                ],
            });
            const block = response.content.find((b) => b.type === 'text');
            const raw = block?.type === 'text' ? block.text : '[]';
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match)
                return [];
            const indices = JSON.parse(match[0]);
            const mapped = indices.map((i, rank) => {
                const t = threads[i];
                if (!t)
                    return null;
                return {
                    type: 'thread',
                    id: t.id,
                    threadId: t.id,
                    title: t.subject ?? t.lastMessagePreview.slice(0, 60),
                    snippet: t.lastMessagePreview,
                    score: 0.95 - rank * 0.05,
                    providerType: t.providerType,
                    date: t.lastMessageAt,
                };
            });
            return mapped
                .filter((r) => r !== null)
                .slice(0, limit);
        }
        catch {
            return [];
        }
    }
    scoreMessage(msg, query) {
        const lower = query.toLowerCase();
        const inSubject = (msg.subject ?? '').toLowerCase().includes(lower);
        const inBody = msg.body.toLowerCase().includes(lower);
        return inSubject ? 0.9 : inBody ? 0.7 : 0.5;
    }
}
exports.CommunicationSearch = CommunicationSearch;
//# sourceMappingURL=CommunicationSearch.js.map