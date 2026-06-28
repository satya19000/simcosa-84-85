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
exports.executeAction = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const ActionEngine_1 = require("./action-engine/ActionEngine");
// Importing the index ensures all built-in actions are registered before any call arrives.
require("./action-engine");
/**
 * Universal action execution endpoint.
 * Claude sends tool_name + args; this function routes through the Action Engine.
 * Claude NEVER writes to Firestore directly — all writes go through here.
 */
exports.executeAction = (0, https_1.onCall)({ timeoutSeconds: 30, memory: '256MiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { toolName, args } = request.data;
    if (!toolName || typeof toolName !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'toolName must be a non-empty string.');
    }
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
        throw new https_1.HttpsError('invalid-argument', 'args must be a plain object.');
    }
    const result = await ActionEngine_1.ActionEngine.run({
        toolName,
        args,
        userId: request.auth.uid,
        userDisplayName: request.auth.token.name,
        db: admin.firestore(),
    });
    return result;
});
//# sourceMappingURL=executeAction.js.map