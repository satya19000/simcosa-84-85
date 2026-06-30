"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMMUNICATION_CONFIG = exports.CommunicationEvents = exports.CommunicationValidator = exports.CommunicationPermissions = exports.CommunicationHistory = exports.CommunicationTemplates = exports.CommunicationScheduler = exports.CommunicationAnalytics = exports.CommunicationSearch = exports.CommunicationRouter = exports.ConversationMemory = exports.ConversationThreadStore = exports.ConversationManager = exports.NoOpProvider = exports.BaseProvider = exports.listProviders = exports.getProviderByType = exports.getProvider = exports.registerProvider = exports.CommunicationRegistry = exports.CommunicationEngine = void 0;
exports.getCommunicationEngine = getCommunicationEngine;
const CommunicationEngine_1 = require("./CommunicationEngine");
const CommunicationConfig_1 = require("./CommunicationConfig");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const session = {
        engine: new CommunicationEngine_1.CommunicationEngine(db, CommunicationConfig_1.DEFAULT_COMMUNICATION_CONFIG, apiKey),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getCommunicationEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var CommunicationEngine_2 = require("./CommunicationEngine");
Object.defineProperty(exports, "CommunicationEngine", { enumerable: true, get: function () { return CommunicationEngine_2.CommunicationEngine; } });
var CommunicationRegistry_1 = require("./CommunicationRegistry");
Object.defineProperty(exports, "CommunicationRegistry", { enumerable: true, get: function () { return CommunicationRegistry_1.CommunicationRegistry; } });
Object.defineProperty(exports, "registerProvider", { enumerable: true, get: function () { return CommunicationRegistry_1.registerProvider; } });
Object.defineProperty(exports, "getProvider", { enumerable: true, get: function () { return CommunicationRegistry_1.getProvider; } });
Object.defineProperty(exports, "getProviderByType", { enumerable: true, get: function () { return CommunicationRegistry_1.getProviderByType; } });
Object.defineProperty(exports, "listProviders", { enumerable: true, get: function () { return CommunicationRegistry_1.listProviders; } });
var CommunicationProvider_1 = require("./CommunicationProvider");
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return CommunicationProvider_1.BaseProvider; } });
Object.defineProperty(exports, "NoOpProvider", { enumerable: true, get: function () { return CommunicationProvider_1.NoOpProvider; } });
var ConversationManager_1 = require("./ConversationManager");
Object.defineProperty(exports, "ConversationManager", { enumerable: true, get: function () { return ConversationManager_1.ConversationManager; } });
var ConversationThread_1 = require("./ConversationThread");
Object.defineProperty(exports, "ConversationThreadStore", { enumerable: true, get: function () { return ConversationThread_1.ConversationThreadStore; } });
var ConversationMemory_1 = require("./ConversationMemory");
Object.defineProperty(exports, "ConversationMemory", { enumerable: true, get: function () { return ConversationMemory_1.ConversationMemory; } });
var CommunicationRouter_1 = require("./CommunicationRouter");
Object.defineProperty(exports, "CommunicationRouter", { enumerable: true, get: function () { return CommunicationRouter_1.CommunicationRouter; } });
var CommunicationSearch_1 = require("./CommunicationSearch");
Object.defineProperty(exports, "CommunicationSearch", { enumerable: true, get: function () { return CommunicationSearch_1.CommunicationSearch; } });
var CommunicationAnalytics_1 = require("./CommunicationAnalytics");
Object.defineProperty(exports, "CommunicationAnalytics", { enumerable: true, get: function () { return CommunicationAnalytics_1.CommunicationAnalytics; } });
var CommunicationScheduler_1 = require("./CommunicationScheduler");
Object.defineProperty(exports, "CommunicationScheduler", { enumerable: true, get: function () { return CommunicationScheduler_1.CommunicationScheduler; } });
var CommunicationTemplates_1 = require("./CommunicationTemplates");
Object.defineProperty(exports, "CommunicationTemplates", { enumerable: true, get: function () { return CommunicationTemplates_1.CommunicationTemplates; } });
var CommunicationHistory_1 = require("./CommunicationHistory");
Object.defineProperty(exports, "CommunicationHistory", { enumerable: true, get: function () { return CommunicationHistory_1.CommunicationHistory; } });
var CommunicationPermissions_1 = require("./CommunicationPermissions");
Object.defineProperty(exports, "CommunicationPermissions", { enumerable: true, get: function () { return CommunicationPermissions_1.CommunicationPermissions; } });
var CommunicationValidator_1 = require("./CommunicationValidator");
Object.defineProperty(exports, "CommunicationValidator", { enumerable: true, get: function () { return CommunicationValidator_1.CommunicationValidator; } });
var CommunicationEvents_1 = require("./CommunicationEvents");
Object.defineProperty(exports, "CommunicationEvents", { enumerable: true, get: function () { return CommunicationEvents_1.CommunicationEvents; } });
var CommunicationConfig_2 = require("./CommunicationConfig");
Object.defineProperty(exports, "DEFAULT_COMMUNICATION_CONFIG", { enumerable: true, get: function () { return CommunicationConfig_2.DEFAULT_COMMUNICATION_CONFIG; } });
__exportStar(require("./CommunicationTypes"), exports);
//# sourceMappingURL=index.js.map