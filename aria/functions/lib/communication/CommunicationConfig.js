"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMMUNICATION_CONFIG = void 0;
exports.DEFAULT_COMMUNICATION_CONFIG = {
    maxMessagesPerSync: 50,
    maxThreadsPerList: 100,
    analysisBudgetTokens: 1024,
    summaryBudgetTokens: 2048,
    replyBudgetTokens: 1024,
    searchLimit: 30,
    schedulerTickMs: 60000,
    conversationMemoryTTLMs: 20 * 60 * 1000,
    providerHealthCheckIntervalMs: 5 * 60 * 1000,
    maxRetries: 3,
    retryDelayMs: 2000,
};
//# sourceMappingURL=CommunicationConfig.js.map