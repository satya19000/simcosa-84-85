"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerControlEngine = void 0;
const ComputerCapabilityRegistry_1 = require("./ComputerCapabilityRegistry");
const ComputerSafetyGuard_1 = require("./ComputerSafetyGuard");
const ComputerPermissions_1 = require("./ComputerPermissions");
const ComputerApprovalBridge_1 = require("./ComputerApprovalBridge");
const ComputerPolicyEngine_1 = require("./ComputerPolicyEngine");
const ComputerAudit_1 = require("./ComputerAudit");
const ComputerLogger_1 = require("./ComputerLogger");
const ComputerSessionManager_1 = require("./ComputerSessionManager");
const ComputerActionPlanner_1 = require("./ComputerActionPlanner");
const ComputerActionExecutor_1 = require("./ComputerActionExecutor");
const ComputerAgent_1 = require("./ComputerAgent");
const BrowserAgent_1 = require("./BrowserAgent");
const DesktopAgent_1 = require("./DesktopAgent");
const LocalBridge_1 = require("./LocalBridge");
const BrowserBridge_1 = require("./BrowserBridge");
const ComputerProvider_1 = require("./ComputerProvider");
const ComputerConfig_1 = require("./ComputerConfig");
// Phase 5.6 additions
const ComputerExecutionPipeline_1 = require("./ComputerExecutionPipeline");
const ComputerDocumentBridge_1 = require("./ComputerDocumentBridge");
const ComputerDownloadManager_1 = require("./ComputerDownloadManager");
const ComputerAuditStream_1 = require("./ComputerAuditStream");
const ComputerExecutionValidator_1 = require("./ComputerExecutionValidator");
const ComputerFilePickerPlan_1 = require("./ComputerFilePickerPlan");
/**
 * ComputerControlEngine — top-level facade for the Computer Control Foundation.
 *
 * Mirrors AIGateway / MarketplaceEngine / SecurityEngine composition pattern.
 * This is the ONLY class that computerControlApi.ts should talk to.
 *
 * Safety contract:
 * - credentialAccess is unconditionally blocked in ComputerSafetyGuard
 * - All medium/high/critical actions go through ComputerApprovalBridge -> real ApprovalEngine
 * - No direct provider execution without safety + permission + approval checks
 */
class ComputerControlEngine {
    constructor(db, config = ComputerConfig_1.DEFAULT_COMPUTER_CONTROL_CONFIG, tenants, rbac, approvalEngine) {
        this.config = config;
        this.tenants = tenants;
        this.rbac = rbac;
        this.approvalEngine = approvalEngine;
        this.capabilityRegistry = new ComputerCapabilityRegistry_1.ComputerCapabilityRegistry();
        this.safetyGuard = new ComputerSafetyGuard_1.ComputerSafetyGuard(this.capabilityRegistry);
        this.permissions = new ComputerPermissions_1.ComputerPermissions(this.rbac, this.tenants, this.capabilityRegistry);
        this.approvalBridge = new ComputerApprovalBridge_1.ComputerApprovalBridge(this.approvalEngine);
        this.policy = new ComputerPolicyEngine_1.ComputerPolicyEngine(db, this.tenants, this.rbac, this.capabilityRegistry);
        this.audit = new ComputerAudit_1.ComputerAudit(db);
        this.logger = new ComputerLogger_1.ComputerLogger();
        this.sessionManager = new ComputerSessionManager_1.ComputerSessionManager(db, this.tenants);
        const provider = new ComputerProvider_1.WebPWAProvider();
        const executor = new ComputerActionExecutor_1.ComputerActionExecutor(this.safetyGuard, this.permissions, this.approvalBridge, this.audit, provider, this.logger);
        const planner = new ComputerActionPlanner_1.ComputerActionPlanner(this.capabilityRegistry, this.safetyGuard, this.config);
        this.agent = new ComputerAgent_1.ComputerAgent(planner, executor, this.approvalBridge, this.audit, this.capabilityRegistry);
        this.browserAgent = new BrowserAgent_1.BrowserAgent(this.agent);
        this.desktopAgent = new DesktopAgent_1.DesktopAgent(this.agent);
        this.localBridge = new LocalBridge_1.LocalBridge(db, this.tenants, this.audit);
        this.browserBridge = new BrowserBridge_1.BrowserBridge(db, this.tenants, this.audit);
        // Phase 5.6: compose sub-modules
        this.documentBridge = new ComputerDocumentBridge_1.ComputerDocumentBridge(db);
        this.downloadManager = new ComputerDownloadManager_1.ComputerDownloadManager(this.approvalBridge, this.audit);
        this.auditStream = new ComputerAuditStream_1.ComputerAuditStream(db);
        this.executionValidator = new ComputerExecutionValidator_1.ComputerExecutionValidator(this.approvalBridge, this.capabilityRegistry);
        this.filePickerPlan = new ComputerFilePickerPlan_1.ComputerFilePickerPlan(planner);
        this.executionPipeline = new ComputerExecutionPipeline_1.ComputerExecutionPipeline(this.safetyGuard, this.approvalBridge, executor, this.audit, this.executionValidator);
        // Wire validator into executor as additional pre-execution gate
        executor.setValidator(this.executionValidator);
    }
    // ── Capability listing ─────────────────────────────────────────────────────
    listCapabilities() {
        return this.capabilityRegistry.getAll();
    }
    // ── Planning ───────────────────────────────────────────────────────────────
    async planAction(userId, tenantId, intent, manualSteps) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.agent.proposeAction(userId, tenantId, intent, manualSteps);
    }
    // ── Approval ───────────────────────────────────────────────────────────────
    async requestApproval(input) {
        await this.tenants.requireIdentity(input.tenantId, input.userId);
        return this.approvalBridge.requestApproval(input);
    }
    // ── Local agent ───────────────────────────────────────────────────────────
    async registerLocalAgent(tenantId, userId, input) {
        return this.localBridge.registerLocalAgent(tenantId, userId, input);
    }
    async revokeLocalAgent(tenantId, userId, agentId) {
        return this.localBridge.revokeLocalAgent(tenantId, userId, agentId);
    }
    async listLocalAgents(tenantId, userId) {
        return this.localBridge.listLocalAgents(tenantId, userId);
    }
    // ── Browser extension ─────────────────────────────────────────────────────
    async registerBrowserExtension(tenantId, userId, input) {
        return this.browserBridge.registerBrowserExtension(tenantId, userId, input);
    }
    async revokeBrowserExtension(tenantId, userId, extensionId) {
        return this.browserBridge.revokeBrowserExtension(tenantId, userId, extensionId);
    }
    async listBrowserExtensions(tenantId, userId) {
        return this.browserBridge.listBrowserExtensions(tenantId, userId);
    }
    // ── Audit ─────────────────────────────────────────────────────────────────
    async logActionResult(tenantId, userId, planId, capabilityId, success, metadata = {}) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.audit.record({
            tenantId, userId,
            eventType: success ? 'action.executed' : 'action.blocked',
            capabilityId, planId,
            metadata,
        });
    }
    async listAuditEvents(tenantId, userId, limit = 50) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.audit.listRecent(tenantId, limit);
    }
    // ── Phase 5.6: Execution Pipeline ─────────────────────────────────────────
    async executePipelineStep(tenantId, userId, input) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.executionPipeline.execute(input);
    }
    // ── Phase 5.6: Document Bridge ─────────────────────────────────────────────
    async analyzeDocument(tenantId, userId, req) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.documentBridge.handoffToDocumentIntelligence({ tenantId, userId, ...req }, req.aiSummary, req.aiActionItems);
    }
    // ── Phase 5.6: Download Manager ────────────────────────────────────────────
    async downloadWithApproval(tenantId, userId, input) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.downloadManager.downloadFileWithUserApproval(input);
    }
    // ── Phase 5.6: Audit Feed ──────────────────────────────────────────────────
    async getAuditFeed(tenantId, userId, limit = 25, beforeTimestamp) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.auditStream.getPage(tenantId, limit, beforeTimestamp);
    }
    // ── Phase 5.6: File Picker Plan ────────────────────────────────────────────
    async planFilePicker(tenantId, userId, options) {
        await this.tenants.requireIdentity(tenantId, userId);
        return this.filePickerPlan.generatePlan({ tenantId, userId, ...options });
    }
}
exports.ComputerControlEngine = ComputerControlEngine;
//# sourceMappingURL=ComputerControlEngine.js.map