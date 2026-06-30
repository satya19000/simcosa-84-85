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
exports.ModelLogger = exports.DEFAULT_AI_GATEWAY_CONFIG = exports.ModelPermissions = exports.TokenEstimator = exports.StreamingManager = exports.ResponseNormalizer = exports.PromptNormalizer = exports.ModelTelemetry = exports.ModelUsageTracker = exports.ModelBenchmark = exports.GatewayUserFacingError = exports.ModelFallbackManager = exports.ModelCostEstimator = exports.ModelPolicyEngine = exports.MODEL_CATALOG = exports.ModelCatalogStore = exports.ProviderHealthTracker = exports.ProviderRegistry = exports.ModelRouter = exports.AIGateway = void 0;
exports.getAIGateway = getAIGateway;
const AIGateway_1 = require("./AIGateway");
const ModelConfig_1 = require("./ModelConfig");
const security_1 = require("../security");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKeys) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const tenants = new security_1.TenantEngine(db);
    const roles = new security_1.RoleManager(db, tenants);
    const permissionManager = new security_1.PermissionManager(db, tenants, roles);
    const rbac = new security_1.RBACEngine(db, tenants, roles, permissionManager);
    const session = {
        engine: new AIGateway_1.AIGateway(db, ModelConfig_1.DEFAULT_AI_GATEWAY_CONFIG, apiKeys, tenants, rbac),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getAIGateway(userId, db, apiKeys) {
    return getSession(userId, db, apiKeys).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────
var AIGateway_2 = require("./AIGateway");
Object.defineProperty(exports, "AIGateway", { enumerable: true, get: function () { return AIGateway_2.AIGateway; } });
var ModelRouter_1 = require("./ModelRouter");
Object.defineProperty(exports, "ModelRouter", { enumerable: true, get: function () { return ModelRouter_1.ModelRouter; } });
var ProviderRegistry_1 = require("./ProviderRegistry");
Object.defineProperty(exports, "ProviderRegistry", { enumerable: true, get: function () { return ProviderRegistry_1.ProviderRegistry; } });
var ProviderHealth_1 = require("./ProviderHealth");
Object.defineProperty(exports, "ProviderHealthTracker", { enumerable: true, get: function () { return ProviderHealth_1.ProviderHealthTracker; } });
var ModelCatalog_1 = require("./ModelCatalog");
Object.defineProperty(exports, "ModelCatalogStore", { enumerable: true, get: function () { return ModelCatalog_1.ModelCatalogStore; } });
Object.defineProperty(exports, "MODEL_CATALOG", { enumerable: true, get: function () { return ModelCatalog_1.MODEL_CATALOG; } });
var ModelPolicyEngine_1 = require("./ModelPolicyEngine");
Object.defineProperty(exports, "ModelPolicyEngine", { enumerable: true, get: function () { return ModelPolicyEngine_1.ModelPolicyEngine; } });
var ModelCostEstimator_1 = require("./ModelCostEstimator");
Object.defineProperty(exports, "ModelCostEstimator", { enumerable: true, get: function () { return ModelCostEstimator_1.ModelCostEstimator; } });
var ModelFallbackManager_1 = require("./ModelFallbackManager");
Object.defineProperty(exports, "ModelFallbackManager", { enumerable: true, get: function () { return ModelFallbackManager_1.ModelFallbackManager; } });
Object.defineProperty(exports, "GatewayUserFacingError", { enumerable: true, get: function () { return ModelFallbackManager_1.GatewayUserFacingError; } });
var ModelBenchmark_1 = require("./ModelBenchmark");
Object.defineProperty(exports, "ModelBenchmark", { enumerable: true, get: function () { return ModelBenchmark_1.ModelBenchmark; } });
var ModelUsageTracker_1 = require("./ModelUsageTracker");
Object.defineProperty(exports, "ModelUsageTracker", { enumerable: true, get: function () { return ModelUsageTracker_1.ModelUsageTracker; } });
var ModelTelemetry_1 = require("./ModelTelemetry");
Object.defineProperty(exports, "ModelTelemetry", { enumerable: true, get: function () { return ModelTelemetry_1.ModelTelemetry; } });
var PromptNormalizer_1 = require("./PromptNormalizer");
Object.defineProperty(exports, "PromptNormalizer", { enumerable: true, get: function () { return PromptNormalizer_1.PromptNormalizer; } });
var ResponseNormalizer_1 = require("./ResponseNormalizer");
Object.defineProperty(exports, "ResponseNormalizer", { enumerable: true, get: function () { return ResponseNormalizer_1.ResponseNormalizer; } });
var StreamingManager_1 = require("./StreamingManager");
Object.defineProperty(exports, "StreamingManager", { enumerable: true, get: function () { return StreamingManager_1.StreamingManager; } });
var TokenEstimator_1 = require("./TokenEstimator");
Object.defineProperty(exports, "TokenEstimator", { enumerable: true, get: function () { return TokenEstimator_1.TokenEstimator; } });
var ModelPermissions_1 = require("./ModelPermissions");
Object.defineProperty(exports, "ModelPermissions", { enumerable: true, get: function () { return ModelPermissions_1.ModelPermissions; } });
var ModelConfig_2 = require("./ModelConfig");
Object.defineProperty(exports, "DEFAULT_AI_GATEWAY_CONFIG", { enumerable: true, get: function () { return ModelConfig_2.DEFAULT_AI_GATEWAY_CONFIG; } });
var ModelLogger_1 = require("./ModelLogger");
Object.defineProperty(exports, "ModelLogger", { enumerable: true, get: function () { return ModelLogger_1.ModelLogger; } });
__exportStar(require("./ModelTypes"), exports);
//# sourceMappingURL=index.js.map