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
exports.financePluginRegistry = exports.FinancePluginRegistry = exports.DEFAULT_FINANCE_CONFIG = exports.FinanceEvents = exports.FinanceValidator = exports.FinancePermissions = exports.FinanceScheduler = exports.FinanceAnalytics = exports.AssetManager = exports.ProcurementManager = exports.PaymentManager = exports.InvoiceManager = exports.VendorManager = exports.IncomeManager = exports.ExpenseManager = exports.BudgetManager = exports.NoOpFinanceProvider = exports.BaseFinanceProvider = exports.listProviders = exports.getProviderByType = exports.getProvider = exports.registerProvider = exports.FinanceRegistry = exports.FinanceEngine = void 0;
exports.getFinanceEngine = getFinanceEngine;
const FinanceEngine_1 = require("./FinanceEngine");
const FinanceConfig_1 = require("./FinanceConfig");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const session = {
        engine: new FinanceEngine_1.FinanceEngine(db, FinanceConfig_1.DEFAULT_FINANCE_CONFIG, apiKey),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getFinanceEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var FinanceEngine_2 = require("./FinanceEngine");
Object.defineProperty(exports, "FinanceEngine", { enumerable: true, get: function () { return FinanceEngine_2.FinanceEngine; } });
var FinanceRegistry_1 = require("./FinanceRegistry");
Object.defineProperty(exports, "FinanceRegistry", { enumerable: true, get: function () { return FinanceRegistry_1.FinanceRegistry; } });
Object.defineProperty(exports, "registerProvider", { enumerable: true, get: function () { return FinanceRegistry_1.registerProvider; } });
Object.defineProperty(exports, "getProvider", { enumerable: true, get: function () { return FinanceRegistry_1.getProvider; } });
Object.defineProperty(exports, "getProviderByType", { enumerable: true, get: function () { return FinanceRegistry_1.getProviderByType; } });
Object.defineProperty(exports, "listProviders", { enumerable: true, get: function () { return FinanceRegistry_1.listProviders; } });
var FinanceProvider_1 = require("./FinanceProvider");
Object.defineProperty(exports, "BaseFinanceProvider", { enumerable: true, get: function () { return FinanceProvider_1.BaseFinanceProvider; } });
Object.defineProperty(exports, "NoOpFinanceProvider", { enumerable: true, get: function () { return FinanceProvider_1.NoOpFinanceProvider; } });
var BudgetManager_1 = require("./BudgetManager");
Object.defineProperty(exports, "BudgetManager", { enumerable: true, get: function () { return BudgetManager_1.BudgetManager; } });
var ExpenseManager_1 = require("./ExpenseManager");
Object.defineProperty(exports, "ExpenseManager", { enumerable: true, get: function () { return ExpenseManager_1.ExpenseManager; } });
var IncomeManager_1 = require("./IncomeManager");
Object.defineProperty(exports, "IncomeManager", { enumerable: true, get: function () { return IncomeManager_1.IncomeManager; } });
var VendorManager_1 = require("./VendorManager");
Object.defineProperty(exports, "VendorManager", { enumerable: true, get: function () { return VendorManager_1.VendorManager; } });
var InvoiceManager_1 = require("./InvoiceManager");
Object.defineProperty(exports, "InvoiceManager", { enumerable: true, get: function () { return InvoiceManager_1.InvoiceManager; } });
var PaymentManager_1 = require("./PaymentManager");
Object.defineProperty(exports, "PaymentManager", { enumerable: true, get: function () { return PaymentManager_1.PaymentManager; } });
var ProcurementManager_1 = require("./ProcurementManager");
Object.defineProperty(exports, "ProcurementManager", { enumerable: true, get: function () { return ProcurementManager_1.ProcurementManager; } });
var AssetManager_1 = require("./AssetManager");
Object.defineProperty(exports, "AssetManager", { enumerable: true, get: function () { return AssetManager_1.AssetManager; } });
var FinanceAnalytics_1 = require("./FinanceAnalytics");
Object.defineProperty(exports, "FinanceAnalytics", { enumerable: true, get: function () { return FinanceAnalytics_1.FinanceAnalytics; } });
var FinanceScheduler_1 = require("./FinanceScheduler");
Object.defineProperty(exports, "FinanceScheduler", { enumerable: true, get: function () { return FinanceScheduler_1.FinanceScheduler; } });
var FinancePermissions_1 = require("./FinancePermissions");
Object.defineProperty(exports, "FinancePermissions", { enumerable: true, get: function () { return FinancePermissions_1.FinancePermissions; } });
var FinanceValidator_1 = require("./FinanceValidator");
Object.defineProperty(exports, "FinanceValidator", { enumerable: true, get: function () { return FinanceValidator_1.FinanceValidator; } });
var FinanceEvents_1 = require("./FinanceEvents");
Object.defineProperty(exports, "FinanceEvents", { enumerable: true, get: function () { return FinanceEvents_1.FinanceEvents; } });
var FinanceConfig_2 = require("./FinanceConfig");
Object.defineProperty(exports, "DEFAULT_FINANCE_CONFIG", { enumerable: true, get: function () { return FinanceConfig_2.DEFAULT_FINANCE_CONFIG; } });
var FinanceProgramPlugin_1 = require("./FinanceProgramPlugin");
Object.defineProperty(exports, "FinancePluginRegistry", { enumerable: true, get: function () { return FinanceProgramPlugin_1.FinancePluginRegistry; } });
Object.defineProperty(exports, "financePluginRegistry", { enumerable: true, get: function () { return FinanceProgramPlugin_1.financePluginRegistry; } });
__exportStar(require("./FinanceTypes"), exports);
//# sourceMappingURL=index.js.map