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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildDocumentIndex = exports.listDocumentFolders = exports.createDocumentFolder = exports.getDocumentStats = exports.deleteDocument = exports.listDocuments = exports.chatWithDocument = exports.searchDocuments = exports.ingestDocument = exports.listMemoryNodes = exports.upsertMemoryNode = exports.extractRelationships = exports.getMemoryGraphStats = exports.validateMemoryGraph = exports.rebuildMemoryIndex = exports.retrieveMemoryContext = exports.searchMemoryGraph = exports.buildMemoryFromChat = exports.buildMemoryFromReminder = exports.buildMemoryFromTask = exports.buildMemoryFromContact = exports.getAgentStatus = exports.runAgentGraph = exports.setWorkflowEnabled = exports.getWorkflowSchedules = exports.listWorkflows = exports.getWorkflowHistory = exports.runWorkflow = exports.getPluginStatus = exports.generateDailyBriefing = exports.processDueReminders = exports.sendTestNotification = exports.executeAction = exports.synthesizeSpeech = exports.transcribeAudio = exports.chatWithAria = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin once
admin.initializeApp();
var chat_1 = require("./chat");
Object.defineProperty(exports, "chatWithAria", { enumerable: true, get: function () { return chat_1.chatWithAria; } });
var voice_1 = require("./voice");
Object.defineProperty(exports, "transcribeAudio", { enumerable: true, get: function () { return voice_1.transcribeAudio; } });
Object.defineProperty(exports, "synthesizeSpeech", { enumerable: true, get: function () { return voice_1.synthesizeSpeech; } });
var executeAction_1 = require("./executeAction");
Object.defineProperty(exports, "executeAction", { enumerable: true, get: function () { return executeAction_1.executeAction; } });
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "sendTestNotification", { enumerable: true, get: function () { return notifications_1.sendTestNotification; } });
var processDueReminders_1 = require("./processDueReminders");
Object.defineProperty(exports, "processDueReminders", { enumerable: true, get: function () { return processDueReminders_1.processDueReminders; } });
var briefing_1 = require("./briefing");
Object.defineProperty(exports, "generateDailyBriefing", { enumerable: true, get: function () { return briefing_1.generateDailyBriefing; } });
var pluginStatus_1 = require("./pluginStatus");
Object.defineProperty(exports, "getPluginStatus", { enumerable: true, get: function () { return pluginStatus_1.getPluginStatus; } });
var workflowApi_1 = require("./workflowApi");
Object.defineProperty(exports, "runWorkflow", { enumerable: true, get: function () { return workflowApi_1.runWorkflowFn; } });
Object.defineProperty(exports, "getWorkflowHistory", { enumerable: true, get: function () { return workflowApi_1.getWorkflowHistoryFn; } });
Object.defineProperty(exports, "listWorkflows", { enumerable: true, get: function () { return workflowApi_1.listWorkflowsFn; } });
Object.defineProperty(exports, "getWorkflowSchedules", { enumerable: true, get: function () { return workflowApi_1.getWorkflowSchedulesFn; } });
Object.defineProperty(exports, "setWorkflowEnabled", { enumerable: true, get: function () { return workflowApi_1.setWorkflowEnabledFn; } });
var agentApi_1 = require("./agentApi");
Object.defineProperty(exports, "runAgentGraph", { enumerable: true, get: function () { return agentApi_1.runAgentGraph; } });
Object.defineProperty(exports, "getAgentStatus", { enumerable: true, get: function () { return agentApi_1.getAgentStatus; } });
var memoryGraphApi_1 = require("./memoryGraphApi");
Object.defineProperty(exports, "buildMemoryFromContact", { enumerable: true, get: function () { return memoryGraphApi_1.buildMemoryFromContact; } });
Object.defineProperty(exports, "buildMemoryFromTask", { enumerable: true, get: function () { return memoryGraphApi_1.buildMemoryFromTask; } });
Object.defineProperty(exports, "buildMemoryFromReminder", { enumerable: true, get: function () { return memoryGraphApi_1.buildMemoryFromReminder; } });
Object.defineProperty(exports, "buildMemoryFromChat", { enumerable: true, get: function () { return memoryGraphApi_1.buildMemoryFromChat; } });
Object.defineProperty(exports, "searchMemoryGraph", { enumerable: true, get: function () { return memoryGraphApi_1.searchMemoryGraph; } });
Object.defineProperty(exports, "retrieveMemoryContext", { enumerable: true, get: function () { return memoryGraphApi_1.retrieveMemoryContext; } });
Object.defineProperty(exports, "rebuildMemoryIndex", { enumerable: true, get: function () { return memoryGraphApi_1.rebuildMemoryIndex; } });
Object.defineProperty(exports, "validateMemoryGraph", { enumerable: true, get: function () { return memoryGraphApi_1.validateMemoryGraph; } });
Object.defineProperty(exports, "getMemoryGraphStats", { enumerable: true, get: function () { return memoryGraphApi_1.getMemoryGraphStats; } });
Object.defineProperty(exports, "extractRelationships", { enumerable: true, get: function () { return memoryGraphApi_1.extractRelationships; } });
Object.defineProperty(exports, "upsertMemoryNode", { enumerable: true, get: function () { return memoryGraphApi_1.upsertMemoryNode; } });
Object.defineProperty(exports, "listMemoryNodes", { enumerable: true, get: function () { return memoryGraphApi_1.listMemoryNodes; } });
var documentApi_1 = require("./documentApi");
Object.defineProperty(exports, "ingestDocument", { enumerable: true, get: function () { return documentApi_1.ingestDocument; } });
Object.defineProperty(exports, "searchDocuments", { enumerable: true, get: function () { return documentApi_1.searchDocuments; } });
Object.defineProperty(exports, "chatWithDocument", { enumerable: true, get: function () { return documentApi_1.chatWithDocument; } });
Object.defineProperty(exports, "listDocuments", { enumerable: true, get: function () { return documentApi_1.listDocuments; } });
Object.defineProperty(exports, "deleteDocument", { enumerable: true, get: function () { return documentApi_1.deleteDocument; } });
Object.defineProperty(exports, "getDocumentStats", { enumerable: true, get: function () { return documentApi_1.getDocumentStats; } });
Object.defineProperty(exports, "createDocumentFolder", { enumerable: true, get: function () { return documentApi_1.createDocumentFolder; } });
Object.defineProperty(exports, "listDocumentFolders", { enumerable: true, get: function () { return documentApi_1.listDocumentFolders; } });
Object.defineProperty(exports, "rebuildDocumentIndex", { enumerable: true, get: function () { return documentApi_1.rebuildDocumentIndex; } });
//# sourceMappingURL=index.js.map