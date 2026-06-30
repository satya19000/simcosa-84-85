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
exports.healthPluginRegistry = exports.HealthPluginRegistry = exports.DEFAULT_HEALTH_CONFIG = exports.HealthEvents = exports.HealthValidator = exports.HealthPermissions = exports.HealthScheduler = exports.HealthAnalytics = exports.ClinicalDecisionSupport = exports.DiseaseKnowledge = exports.VaccinationManager = exports.MedicationManager = exports.AppointmentManager = exports.FacilityManager = exports.PatientManager = exports.NoOpHealthProvider = exports.BaseHealthProvider = exports.listProviders = exports.getProviderByType = exports.getProvider = exports.registerProvider = exports.HealthRegistry = exports.HealthEngine = void 0;
exports.getHealthEngine = getHealthEngine;
const HealthEngine_1 = require("./HealthEngine");
const HealthConfig_1 = require("./HealthConfig");
const sessions = new Map();
const SESSION_TTL_MS = 20 * 60 * 1000;
function getSession(userId, db, apiKey) {
    const existing = sessions.get(userId);
    if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS)
        return existing;
    const session = {
        engine: new HealthEngine_1.HealthEngine(db, HealthConfig_1.DEFAULT_HEALTH_CONFIG, apiKey),
        createdAt: Date.now(),
    };
    sessions.set(userId, session);
    return session;
}
function getHealthEngine(userId, db, apiKey) {
    return getSession(userId, db, apiKey).engine;
}
// ── Re-exports ────────────────────────────────────────────────────────────────
var HealthEngine_2 = require("./HealthEngine");
Object.defineProperty(exports, "HealthEngine", { enumerable: true, get: function () { return HealthEngine_2.HealthEngine; } });
var HealthRegistry_1 = require("./HealthRegistry");
Object.defineProperty(exports, "HealthRegistry", { enumerable: true, get: function () { return HealthRegistry_1.HealthRegistry; } });
Object.defineProperty(exports, "registerProvider", { enumerable: true, get: function () { return HealthRegistry_1.registerProvider; } });
Object.defineProperty(exports, "getProvider", { enumerable: true, get: function () { return HealthRegistry_1.getProvider; } });
Object.defineProperty(exports, "getProviderByType", { enumerable: true, get: function () { return HealthRegistry_1.getProviderByType; } });
Object.defineProperty(exports, "listProviders", { enumerable: true, get: function () { return HealthRegistry_1.listProviders; } });
var HealthProvider_1 = require("./HealthProvider");
Object.defineProperty(exports, "BaseHealthProvider", { enumerable: true, get: function () { return HealthProvider_1.BaseHealthProvider; } });
Object.defineProperty(exports, "NoOpHealthProvider", { enumerable: true, get: function () { return HealthProvider_1.NoOpHealthProvider; } });
var PatientManager_1 = require("./PatientManager");
Object.defineProperty(exports, "PatientManager", { enumerable: true, get: function () { return PatientManager_1.PatientManager; } });
var FacilityManager_1 = require("./FacilityManager");
Object.defineProperty(exports, "FacilityManager", { enumerable: true, get: function () { return FacilityManager_1.FacilityManager; } });
var AppointmentManager_1 = require("./AppointmentManager");
Object.defineProperty(exports, "AppointmentManager", { enumerable: true, get: function () { return AppointmentManager_1.AppointmentManager; } });
var MedicationManager_1 = require("./MedicationManager");
Object.defineProperty(exports, "MedicationManager", { enumerable: true, get: function () { return MedicationManager_1.MedicationManager; } });
var VaccinationManager_1 = require("./VaccinationManager");
Object.defineProperty(exports, "VaccinationManager", { enumerable: true, get: function () { return VaccinationManager_1.VaccinationManager; } });
var DiseaseKnowledge_1 = require("./DiseaseKnowledge");
Object.defineProperty(exports, "DiseaseKnowledge", { enumerable: true, get: function () { return DiseaseKnowledge_1.DiseaseKnowledge; } });
var ClinicalDecisionSupport_1 = require("./ClinicalDecisionSupport");
Object.defineProperty(exports, "ClinicalDecisionSupport", { enumerable: true, get: function () { return ClinicalDecisionSupport_1.ClinicalDecisionSupport; } });
var HealthAnalytics_1 = require("./HealthAnalytics");
Object.defineProperty(exports, "HealthAnalytics", { enumerable: true, get: function () { return HealthAnalytics_1.HealthAnalytics; } });
var HealthScheduler_1 = require("./HealthScheduler");
Object.defineProperty(exports, "HealthScheduler", { enumerable: true, get: function () { return HealthScheduler_1.HealthScheduler; } });
var HealthPermissions_1 = require("./HealthPermissions");
Object.defineProperty(exports, "HealthPermissions", { enumerable: true, get: function () { return HealthPermissions_1.HealthPermissions; } });
var HealthValidator_1 = require("./HealthValidator");
Object.defineProperty(exports, "HealthValidator", { enumerable: true, get: function () { return HealthValidator_1.HealthValidator; } });
var HealthEvents_1 = require("./HealthEvents");
Object.defineProperty(exports, "HealthEvents", { enumerable: true, get: function () { return HealthEvents_1.HealthEvents; } });
var HealthConfig_2 = require("./HealthConfig");
Object.defineProperty(exports, "DEFAULT_HEALTH_CONFIG", { enumerable: true, get: function () { return HealthConfig_2.DEFAULT_HEALTH_CONFIG; } });
var HealthProgramPlugin_1 = require("./HealthProgramPlugin");
Object.defineProperty(exports, "HealthPluginRegistry", { enumerable: true, get: function () { return HealthProgramPlugin_1.HealthPluginRegistry; } });
Object.defineProperty(exports, "healthPluginRegistry", { enumerable: true, get: function () { return HealthProgramPlugin_1.healthPluginRegistry; } });
__exportStar(require("./HealthTypes"), exports);
//# sourceMappingURL=index.js.map