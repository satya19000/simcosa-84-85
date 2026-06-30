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
exports.getSkillAnalytics = exports.getSkillDetail = exports.listMarketplaceCatalog = exports.reviewSkill = exports.revokeSkillPermission = exports.grantSkillPermission = exports.listInstalledSkills = exports.disableSkill = exports.enableSkill = exports.uninstallSkill = exports.installSkill = exports.rejectSkill = exports.approveSkill = exports.submitSkillForReview = exports.updateSkill = exports.publishSkill = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const marketplace_1 = require("./marketplace");
const SkillValidator_1 = require("./marketplace/SkillValidator");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    return request.auth.uid;
}
function wrapValidation(fn) {
    try {
        return fn();
    }
    catch (err) {
        if (err instanceof SkillValidator_1.SkillValidationError)
            throw new https_1.HttpsError('invalid-argument', err.message);
        throw err;
    }
}
function wrapEngineError(fn) {
    return fn().catch((err) => {
        const message = err instanceof Error ? err.message : 'Operation failed';
        if (message.includes('Access denied'))
            throw new https_1.HttpsError('permission-denied', message);
        if (message.includes('not found'))
            throw new https_1.HttpsError('not-found', message);
        throw new https_1.HttpsError('failed-precondition', message);
    });
}
// ── Publishing ────────────────────────────────────────────────────────────
exports.publishSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const manifest = request.data;
    wrapValidation(() => undefined); // validation occurs inside SkillManager.createDraft
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.publish(uid, manifest));
});
exports.updateSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId, ...patch } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.updateSkill(itemId, patch));
});
exports.submitSkillForReview = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.submitForReview(itemId));
});
exports.approveSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.approve(itemId));
});
exports.rejectSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.reject(itemId));
});
// ── Installation ────────────────────────────────────────────────────────
exports.installSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 30 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, organizationId, itemId } = request.data;
    if (!tenantId || !itemId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.install(uid, { tenantId, organizationId: organizationId ?? null, itemId }));
});
exports.uninstallSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, installationId } = request.data;
    if (!tenantId || !installationId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and installationId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.uninstall(uid, tenantId, installationId));
});
exports.enableSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, installationId } = request.data;
    if (!tenantId || !installationId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and installationId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.enable(uid, tenantId, installationId));
});
exports.disableSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, installationId } = request.data;
    if (!tenantId || !installationId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and installationId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.disable(uid, tenantId, installationId));
});
exports.listInstalledSkills = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId } = request.data;
    if (!tenantId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listInstalled(uid, tenantId));
});
// ── Permissions ──────────────────────────────────────────────────────────
exports.grantSkillPermission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, installationId, itemId, scopes } = request.data;
    if (!tenantId || !installationId || !itemId || !Array.isArray(scopes)) {
        throw new https_1.HttpsError('invalid-argument', 'tenantId, installationId, itemId, and scopes required');
    }
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.grantPermission(tenantId, uid, installationId, itemId, scopes));
});
exports.revokeSkillPermission = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { tenantId, permissionId } = request.data;
    if (!tenantId || !permissionId)
        throw new https_1.HttpsError('invalid-argument', 'tenantId and permissionId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.revokePermission(tenantId, uid, permissionId));
});
// ── Reviews ──────────────────────────────────────────────────────────────
exports.reviewSkill = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId, rating, reviewText, versionReviewed } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.recordReview(uid, itemId, { rating, reviewText, versionReviewed }));
});
// ── Catalog / Read ───────────────────────────────────────────────────────
exports.listMarketplaceCatalog = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { category, itemType, search, pricingModel, page, pageSize } = request.data;
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.listCatalog({ category, itemType, search, pricingModel }, page, pageSize));
});
exports.getSkillDetail = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 10 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getSkillDetail(itemId));
});
// ── Analytics ────────────────────────────────────────────────────────────
exports.getSkillAnalytics = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 15 }, async (request) => {
    const uid = requireAuth(request);
    const { itemId } = request.data;
    if (!itemId)
        throw new https_1.HttpsError('invalid-argument', 'itemId required');
    const engine = (0, marketplace_1.getMarketplaceEngine)(uid, db(), apiKey());
    return wrapEngineError(() => engine.getAnalytics(itemId));
});
//# sourceMappingURL=marketplaceApi.js.map