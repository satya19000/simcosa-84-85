"use strict";
/**
 * meeting-agent/index.ts — per-user singleton session + public re-exports.
 *
 * Follows the same singleton pattern as ai-gateway/index.ts and
 * computer-control/index.ts exactly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEETING_CONFIG = exports.MeetingExportManager = exports.MeetingLogger = exports.MeetingValidator = exports.MeetingEvents = exports.MeetingAnalytics = exports.MeetingCommunicationBridge = exports.MeetingMemoryBridge = exports.MeetingWorkflowBridge = exports.MeetingFollowUpManager = exports.MeetingNotesManager = exports.MeetingSafetyError = exports.MeetingSafetyGuard = exports.MeetingPolicyEngine = exports.MeetingApprovalBridge = exports.MeetingConsentManager = exports.MeetingParticipantManager = exports.MeetingActionExtractor = exports.MeetingSummaryEngine = exports.MeetingTranscriptionEngine = exports.MeetingSessionManager = exports.MeetingAgentEngine = void 0;
exports.getMeetingAgentEngine = getMeetingAgentEngine;
const MeetingAgentEngine_1 = require("./MeetingAgentEngine");
const MeetingConfig_1 = require("./MeetingConfig");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getMeetingAgentEngine(userId, db, tenants, approvalEngine, aiGateway, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing.engine;
    const session = {
        engine: new MeetingAgentEngine_1.MeetingAgentEngine(db, tenants, approvalEngine, aiGateway, apiKey, MeetingConfig_1.DEFAULT_MEETING_CONFIG),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session.engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────
var MeetingAgentEngine_2 = require("./MeetingAgentEngine");
Object.defineProperty(exports, "MeetingAgentEngine", { enumerable: true, get: function () { return MeetingAgentEngine_2.MeetingAgentEngine; } });
var MeetingSessionManager_1 = require("./MeetingSessionManager");
Object.defineProperty(exports, "MeetingSessionManager", { enumerable: true, get: function () { return MeetingSessionManager_1.MeetingSessionManager; } });
var MeetingTranscriptionEngine_1 = require("./MeetingTranscriptionEngine");
Object.defineProperty(exports, "MeetingTranscriptionEngine", { enumerable: true, get: function () { return MeetingTranscriptionEngine_1.MeetingTranscriptionEngine; } });
var MeetingSummaryEngine_1 = require("./MeetingSummaryEngine");
Object.defineProperty(exports, "MeetingSummaryEngine", { enumerable: true, get: function () { return MeetingSummaryEngine_1.MeetingSummaryEngine; } });
var MeetingActionExtractor_1 = require("./MeetingActionExtractor");
Object.defineProperty(exports, "MeetingActionExtractor", { enumerable: true, get: function () { return MeetingActionExtractor_1.MeetingActionExtractor; } });
var MeetingParticipantManager_1 = require("./MeetingParticipantManager");
Object.defineProperty(exports, "MeetingParticipantManager", { enumerable: true, get: function () { return MeetingParticipantManager_1.MeetingParticipantManager; } });
var MeetingConsentManager_1 = require("./MeetingConsentManager");
Object.defineProperty(exports, "MeetingConsentManager", { enumerable: true, get: function () { return MeetingConsentManager_1.MeetingConsentManager; } });
var MeetingApprovalBridge_1 = require("./MeetingApprovalBridge");
Object.defineProperty(exports, "MeetingApprovalBridge", { enumerable: true, get: function () { return MeetingApprovalBridge_1.MeetingApprovalBridge; } });
var MeetingPolicyEngine_1 = require("./MeetingPolicyEngine");
Object.defineProperty(exports, "MeetingPolicyEngine", { enumerable: true, get: function () { return MeetingPolicyEngine_1.MeetingPolicyEngine; } });
var MeetingSafetyGuard_1 = require("./MeetingSafetyGuard");
Object.defineProperty(exports, "MeetingSafetyGuard", { enumerable: true, get: function () { return MeetingSafetyGuard_1.MeetingSafetyGuard; } });
Object.defineProperty(exports, "MeetingSafetyError", { enumerable: true, get: function () { return MeetingSafetyGuard_1.MeetingSafetyError; } });
var MeetingNotesManager_1 = require("./MeetingNotesManager");
Object.defineProperty(exports, "MeetingNotesManager", { enumerable: true, get: function () { return MeetingNotesManager_1.MeetingNotesManager; } });
var MeetingFollowUpManager_1 = require("./MeetingFollowUpManager");
Object.defineProperty(exports, "MeetingFollowUpManager", { enumerable: true, get: function () { return MeetingFollowUpManager_1.MeetingFollowUpManager; } });
var MeetingWorkflowBridge_1 = require("./MeetingWorkflowBridge");
Object.defineProperty(exports, "MeetingWorkflowBridge", { enumerable: true, get: function () { return MeetingWorkflowBridge_1.MeetingWorkflowBridge; } });
var MeetingMemoryBridge_1 = require("./MeetingMemoryBridge");
Object.defineProperty(exports, "MeetingMemoryBridge", { enumerable: true, get: function () { return MeetingMemoryBridge_1.MeetingMemoryBridge; } });
var MeetingCommunicationBridge_1 = require("./MeetingCommunicationBridge");
Object.defineProperty(exports, "MeetingCommunicationBridge", { enumerable: true, get: function () { return MeetingCommunicationBridge_1.MeetingCommunicationBridge; } });
var MeetingAnalytics_1 = require("./MeetingAnalytics");
Object.defineProperty(exports, "MeetingAnalytics", { enumerable: true, get: function () { return MeetingAnalytics_1.MeetingAnalytics; } });
var MeetingEvents_1 = require("./MeetingEvents");
Object.defineProperty(exports, "MeetingEvents", { enumerable: true, get: function () { return MeetingEvents_1.MeetingEvents; } });
var MeetingValidator_1 = require("./MeetingValidator");
Object.defineProperty(exports, "MeetingValidator", { enumerable: true, get: function () { return MeetingValidator_1.MeetingValidator; } });
var MeetingLogger_1 = require("./MeetingLogger");
Object.defineProperty(exports, "MeetingLogger", { enumerable: true, get: function () { return MeetingLogger_1.MeetingLogger; } });
var MeetingExportManager_1 = require("./MeetingExportManager");
Object.defineProperty(exports, "MeetingExportManager", { enumerable: true, get: function () { return MeetingExportManager_1.MeetingExportManager; } });
var MeetingConfig_2 = require("./MeetingConfig");
Object.defineProperty(exports, "DEFAULT_MEETING_CONFIG", { enumerable: true, get: function () { return MeetingConfig_2.DEFAULT_MEETING_CONFIG; } });
//# sourceMappingURL=index.js.map