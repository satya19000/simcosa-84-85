import type * as admin from 'firebase-admin'
import type { TenantEngine } from '../security/TenantEngine'
import type { RBACEngine } from '../security/RBACEngine'
import type { ApprovalEngine } from '../delegation/ApprovalEngine'
import { ComputerCapabilityRegistry } from './ComputerCapabilityRegistry'
import { ComputerSafetyGuard } from './ComputerSafetyGuard'
import { ComputerPermissions } from './ComputerPermissions'
import { ComputerApprovalBridge } from './ComputerApprovalBridge'
import { ComputerPolicyEngine } from './ComputerPolicyEngine'
import { ComputerAudit } from './ComputerAudit'
import { ComputerLogger } from './ComputerLogger'
import { ComputerSessionManager } from './ComputerSessionManager'
import { ComputerActionPlanner } from './ComputerActionPlanner'
import { ComputerActionExecutor } from './ComputerActionExecutor'
import { ComputerAgent } from './ComputerAgent'
import { BrowserAgent } from './BrowserAgent'
import { DesktopAgent } from './DesktopAgent'
import { LocalBridge } from './LocalBridge'
import { BrowserBridge } from './BrowserBridge'
import { WebPWAProvider } from './ComputerProvider'
import { DEFAULT_COMPUTER_CONTROL_CONFIG, type ComputerControlConfig } from './ComputerConfig'
// Phase 5.6 additions
import { ComputerExecutionPipeline } from './ComputerExecutionPipeline'
import { ComputerDocumentBridge } from './ComputerDocumentBridge'
import { ComputerDownloadManager } from './ComputerDownloadManager'
import { ComputerAuditStream } from './ComputerAuditStream'
import { ComputerExecutionValidator } from './ComputerExecutionValidator'
import { ComputerFilePickerPlan } from './ComputerFilePickerPlan'
import type {
  ComputerActionPlan, ComputerApprovalInput, LocalAgentRegistration,
  BrowserExtensionRegistration, ComputerCapabilityId,
} from './ComputerTypes'
import type { PipelineExecuteInput, DownloadApprovalInput, AuditFeedPage, FilePickerPlanOptions } from './ComputerExecutionTypes'

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
export class ComputerControlEngine {
  readonly capabilityRegistry: ComputerCapabilityRegistry
  readonly safetyGuard: ComputerSafetyGuard
  readonly permissions: ComputerPermissions
  readonly approvalBridge: ComputerApprovalBridge
  readonly policy: ComputerPolicyEngine
  readonly audit: ComputerAudit
  readonly sessionManager: ComputerSessionManager
  readonly agent: ComputerAgent
  readonly browserAgent: BrowserAgent
  readonly desktopAgent: DesktopAgent
  readonly localBridge: LocalBridge
  readonly browserBridge: BrowserBridge
  // Phase 5.6 sub-modules
  readonly executionPipeline: ComputerExecutionPipeline
  readonly documentBridge: ComputerDocumentBridge
  readonly downloadManager: ComputerDownloadManager
  readonly auditStream: ComputerAuditStream
  readonly executionValidator: ComputerExecutionValidator
  readonly filePickerPlan: ComputerFilePickerPlan
  private readonly logger: ComputerLogger

  constructor(
    db: admin.firestore.Firestore,
    private readonly config: ComputerControlConfig = DEFAULT_COMPUTER_CONTROL_CONFIG,
    private readonly tenants: TenantEngine,
    private readonly rbac: RBACEngine,
    private readonly approvalEngine: ApprovalEngine
  ) {
    this.capabilityRegistry = new ComputerCapabilityRegistry()
    this.safetyGuard = new ComputerSafetyGuard(this.capabilityRegistry)
    this.permissions = new ComputerPermissions(this.rbac, this.tenants, this.capabilityRegistry)
    this.approvalBridge = new ComputerApprovalBridge(this.approvalEngine)
    this.policy = new ComputerPolicyEngine(db, this.tenants, this.rbac, this.capabilityRegistry)
    this.audit = new ComputerAudit(db)
    this.logger = new ComputerLogger()
    this.sessionManager = new ComputerSessionManager(db, this.tenants)

    const provider = new WebPWAProvider()
    const executor = new ComputerActionExecutor(
      this.safetyGuard,
      this.permissions,
      this.approvalBridge,
      this.audit,
      provider,
      this.logger
    )
    const planner = new ComputerActionPlanner(this.capabilityRegistry, this.safetyGuard, this.config)

    this.agent = new ComputerAgent(planner, executor, this.approvalBridge, this.audit, this.capabilityRegistry)
    this.browserAgent = new BrowserAgent(this.agent)
    this.desktopAgent = new DesktopAgent(this.agent)
    this.localBridge = new LocalBridge(db, this.tenants, this.audit)
    this.browserBridge = new BrowserBridge(db, this.tenants, this.audit)

    // Phase 5.6: compose sub-modules
    this.documentBridge = new ComputerDocumentBridge(db)
    this.downloadManager = new ComputerDownloadManager(this.approvalBridge, this.audit)
    this.auditStream = new ComputerAuditStream(db)
    this.executionValidator = new ComputerExecutionValidator(this.approvalBridge, this.capabilityRegistry)
    this.filePickerPlan = new ComputerFilePickerPlan(planner)
    this.executionPipeline = new ComputerExecutionPipeline(
      this.safetyGuard,
      this.approvalBridge,
      executor,
      this.audit,
      this.executionValidator
    )
    // Wire validator into executor as additional pre-execution gate
    executor.setValidator(this.executionValidator)
  }

  // ── Capability listing ─────────────────────────────────────────────────────

  listCapabilities() {
    return this.capabilityRegistry.getAll()
  }

  // ── Planning ───────────────────────────────────────────────────────────────

  async planAction(
    userId: string,
    tenantId: string,
    intent: string,
    manualSteps?: Array<{ capabilityId: ComputerCapabilityId; description: string; parameters?: Record<string, unknown> }>
  ): Promise<ComputerActionPlan> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.agent.proposeAction(userId, tenantId, intent, manualSteps)
  }

  // ── Approval ───────────────────────────────────────────────────────────────

  async requestApproval(input: ComputerApprovalInput) {
    await this.tenants.requireIdentity(input.tenantId, input.userId)
    return this.approvalBridge.requestApproval(input)
  }

  // ── Local agent ───────────────────────────────────────────────────────────

  async registerLocalAgent(tenantId: string, userId: string, input: Parameters<LocalBridge['registerLocalAgent']>[2]): Promise<LocalAgentRegistration> {
    return this.localBridge.registerLocalAgent(tenantId, userId, input)
  }

  async revokeLocalAgent(tenantId: string, userId: string, agentId: string): Promise<void> {
    return this.localBridge.revokeLocalAgent(tenantId, userId, agentId)
  }

  async listLocalAgents(tenantId: string, userId: string): Promise<LocalAgentRegistration[]> {
    return this.localBridge.listLocalAgents(tenantId, userId)
  }

  // ── Browser extension ─────────────────────────────────────────────────────

  async registerBrowserExtension(tenantId: string, userId: string, input: Parameters<BrowserBridge['registerBrowserExtension']>[2]): Promise<BrowserExtensionRegistration> {
    return this.browserBridge.registerBrowserExtension(tenantId, userId, input)
  }

  async revokeBrowserExtension(tenantId: string, userId: string, extensionId: string): Promise<void> {
    return this.browserBridge.revokeBrowserExtension(tenantId, userId, extensionId)
  }

  async listBrowserExtensions(tenantId: string, userId: string): Promise<BrowserExtensionRegistration[]> {
    return this.browserBridge.listBrowserExtensions(tenantId, userId)
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  async logActionResult(
    tenantId: string,
    userId: string,
    planId: string,
    capabilityId: ComputerCapabilityId,
    success: boolean,
    metadata: Record<string, unknown> = {}
  ) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.audit.record({
      tenantId, userId,
      eventType: success ? 'action.executed' : 'action.blocked',
      capabilityId, planId,
      metadata,
    })
  }

  async listAuditEvents(tenantId: string, userId: string, limit = 50) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.audit.listRecent(tenantId, limit)
  }

  // ── Phase 5.6: Execution Pipeline ─────────────────────────────────────────

  async executePipelineStep(tenantId: string, userId: string, input: PipelineExecuteInput) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.executionPipeline.execute(input)
  }

  // ── Phase 5.6: Document Bridge ─────────────────────────────────────────────

  async analyzeDocument(tenantId: string, userId: string, req: {
    fileName: string
    fileType: string
    fileContentBase64: string
    fileSizeBytes: number
    aiSummary?: string
    aiActionItems?: import('./ComputerExecutionTypes').ExtractedActionItem[]
  }) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.documentBridge.handoffToDocumentIntelligence(
      { tenantId, userId, ...req },
      req.aiSummary,
      req.aiActionItems
    )
  }

  // ── Phase 5.6: Download Manager ────────────────────────────────────────────

  async downloadWithApproval(tenantId: string, userId: string, input: DownloadApprovalInput) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.downloadManager.downloadFileWithUserApproval(input)
  }

  // ── Phase 5.6: Audit Feed ──────────────────────────────────────────────────

  async getAuditFeed(tenantId: string, userId: string, limit = 25, beforeTimestamp?: string): Promise<AuditFeedPage> {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.auditStream.getPage(tenantId, limit, beforeTimestamp)
  }

  // ── Phase 5.6: File Picker Plan ────────────────────────────────────────────

  async planFilePicker(tenantId: string, userId: string, options: Omit<FilePickerPlanOptions, 'userId' | 'tenantId'>) {
    await this.tenants.requireIdentity(tenantId, userId)
    return this.filePickerPlan.generatePlan({ tenantId, userId, ...options })
  }
}
