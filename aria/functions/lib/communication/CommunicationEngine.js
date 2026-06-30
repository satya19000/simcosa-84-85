"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationEngine = void 0;
const CommunicationRegistry_1 = require("./CommunicationRegistry");
const ConversationManager_1 = require("./ConversationManager");
const CommunicationSearch_1 = require("./CommunicationSearch");
const CommunicationAnalytics_1 = require("./CommunicationAnalytics");
const CommunicationScheduler_1 = require("./CommunicationScheduler");
const CommunicationTemplates_1 = require("./CommunicationTemplates");
const ConversationMemory_1 = require("./ConversationMemory");
class CommunicationEngine {
    constructor(db, config, apiKey) {
        this.registry = new CommunicationRegistry_1.CommunicationRegistry();
        this.manager = new ConversationManager_1.ConversationManager(db, config, this.registry, apiKey);
        this.searchEngine = new CommunicationSearch_1.CommunicationSearch(db, config, apiKey, config.searchLimit);
        this.analytics = new CommunicationAnalytics_1.CommunicationAnalytics(db);
        this.scheduler = new CommunicationScheduler_1.CommunicationScheduler(db, this.registry);
        this.templates = new CommunicationTemplates_1.CommunicationTemplates(db);
        this.memory = new ConversationMemory_1.ConversationMemory(db);
    }
    // ── Provider Management ───────────────────────────────────────────────────
    registerProvider(provider) {
        this.registry.registerProvider(provider);
    }
    listProviders() {
        return this.registry.listRegistered();
    }
    async healthCheckAll(userId) {
        return Promise.all(this.registry.listProviders().map((p) => p.healthCheck(userId)));
    }
    // ── Message Operations ────────────────────────────────────────────────────
    async ingestMessage(userId, message) {
        return this.manager.ingestMessage(userId, message);
    }
    async sendMessage(userId, providerId, opts) {
        return this.manager.sendMessage(userId, providerId, opts);
    }
    async syncProvider(userId, providerId) {
        return this.manager.syncProvider(userId, providerId);
    }
    // ── Thread Operations ─────────────────────────────────────────────────────
    async getThread(userId, threadId) {
        return this.manager.getThread(userId, threadId);
    }
    async listThreads(userId, opts = {}) {
        return this.manager.listThreads(userId, opts);
    }
    async getMessages(userId, threadId, limit = 50) {
        return this.manager.getMessages(userId, threadId, limit);
    }
    async markRead(userId, threadId) {
        return this.manager.markRead(userId, threadId);
    }
    async archiveThread(userId, threadId) {
        return this.manager.archiveThread(userId, threadId);
    }
    // ── Intelligence ──────────────────────────────────────────────────────────
    async analyzeThread(userId, threadId) {
        return this.manager.analyzeThread(userId, threadId);
    }
    async generateSummary(userId, threadId, type = 'thread') {
        return this.manager.generateSummary(userId, threadId, type);
    }
    async generateReply(userId, messageId, tone) {
        return this.manager.generateReply(userId, messageId, tone);
    }
    // ── Search ────────────────────────────────────────────────────────────────
    async search(userId, opts) {
        return this.searchEngine.search(userId, opts);
    }
    // ── Analytics ────────────────────────────────────────────────────────────
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    // ── Templates ────────────────────────────────────────────────────────────
    async createTemplate(userId, fields) {
        return this.templates.create(userId, fields);
    }
    async listTemplates(userId, providerType) {
        return this.templates.list(userId, providerType);
    }
    async seedDefaultTemplates(userId) {
        return this.templates.seedDefaults(userId);
    }
    // ── Scheduler ────────────────────────────────────────────────────────────
    async scheduleMessage(userId, fields) {
        return this.scheduler.schedule(userId, fields);
    }
    async cancelScheduledMessage(userId, messageId) {
        return this.scheduler.cancel(userId, messageId);
    }
    async listScheduledMessages(userId) {
        return this.scheduler.listPending(userId);
    }
    async processDueScheduled(userId) {
        return this.scheduler.processDue(userId);
    }
    // ── Communication Memory ──────────────────────────────────────────────────
    async getContactStyle(userId, contactId) {
        return this.memory.getStyle(userId, contactId);
    }
    async updateContactStyle(userId, contactId, patch) {
        return this.memory.updateStyle(userId, contactId, patch);
    }
}
exports.CommunicationEngine = CommunicationEngine;
//# sourceMappingURL=CommunicationEngine.js.map