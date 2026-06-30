/**
 * Shared types for the Computer Control Foundation (Phase 5.5).
 *
 * All computer actions must be visible, reversible where possible,
 * auditable, and approval-gated. credentialAccess is ALWAYS blocked.
 */

// ── Risk levels ─────────────────────────────────────────────────────────────

export type ComputerRiskLevel = 'low' | 'medium' | 'high' | 'critical'

// ── Provider types ───────────────────────────────────────────────────────────

export type ComputerProviderType =
  | 'web-pwa'            // Only semi-functional provider — operates in browser via web APIs
  | 'browser-extension'  // PLACEHOLDER — not implemented
  | 'desktop-agent'      // PLACEHOLDER — not implemented
  | 'electron'           // PLACEHOLDER — not implemented
  | 'tauri'              // PLACEHOLDER — not implemented
  | 'native-os'          // PLACEHOLDER — not implemented

// ── Capability IDs ───────────────────────────────────────────────────────────

export type ComputerCapabilityId =
  | 'readVisiblePage'
  | 'summarizeVisiblePage'
  | 'openUrl'
  | 'searchWeb'
  | 'copyToClipboard'
  | 'pasteFromClipboard'
  | 'readClipboard'
  | 'uploadFileWithUserPicker'
  | 'downloadFileWithUserApproval'
  | 'screenshotWithApproval'
  | 'ocrScreenshot'
  | 'listBrowserTabs'
  | 'switchTab'
  | 'openApp'
  | 'createFile'
  | 'moveFile'
  | 'renameFile'
  | 'deleteFile'
  | 'sendMessage'
  | 'submitForm'
  | 'paymentAction'
  | 'credentialAccess'  // ALWAYS BLOCKED — unconditionally rejected by ComputerSafetyGuard

// ── Permission scopes ────────────────────────────────────────────────────────

export type ComputerPermission =
  | 'computer.readPage'
  | 'computer.openUrl'
  | 'computer.clipboard.read'
  | 'computer.clipboard.write'
  | 'computer.screenshot'
  | 'computer.ocr'
  | 'computer.files.read'
  | 'computer.files.write'
  | 'computer.files.delete'
  | 'computer.browser.tabs'
  | 'computer.forms.submit'
  | 'computer.apps.open'
  | 'computer.network.request'

// ── Capability descriptor ────────────────────────────────────────────────────

export interface ComputerCapabilityDescriptor {
  id: ComputerCapabilityId
  name: string
  description: string
  riskLevel: ComputerRiskLevel
  requiredPermissions: ComputerPermission[]
  requiresApproval: boolean
  reversible: boolean
  auditRequired: boolean
  /** If true, this capability is blocked at the policy level and cannot be requested. */
  policyBlocked?: boolean
  /** If true, this capability is ALWAYS blocked by ComputerSafetyGuard — no bypass path. */
  alwaysBlocked?: boolean
}

// ── Action plan ──────────────────────────────────────────────────────────────

export interface ComputerActionStep {
  stepIndex: number
  description: string
  capabilityId: ComputerCapabilityId
  riskLevel: ComputerRiskLevel
  requiresApproval: boolean
  reversible: boolean
  parameters?: Record<string, unknown>
  /** Only set after execution (not during planning). */
  status?: 'pending' | 'approved' | 'executed' | 'skipped' | 'blocked'
  executedAt?: string
  result?: ComputerActionResult
}

export interface ComputerActionPlan {
  planId: string
  userId: string
  tenantId: string
  intent: string
  steps: ComputerActionStep[]
  overallRiskLevel: ComputerRiskLevel
  requiresApproval: boolean
  createdAt: string
  /** Plans are PROPOSED ONLY — they must never auto-execute. */
  status: 'proposed' | 'approved' | 'rejected' | 'cancelled' | 'executing' | 'completed'
}

// ── Action result ────────────────────────────────────────────────────────────

export interface ComputerActionResult {
  success: boolean
  capabilityId: ComputerCapabilityId
  output?: unknown
  error?: string
  /** Placeholder indication — provider was not able to execute (not yet implemented). */
  notImplemented?: boolean
}

// ── Session ──────────────────────────────────────────────────────────────────

export type ComputerSessionStatus = 'active' | 'idle' | 'expired' | 'revoked'

export interface ComputerSession {
  sessionId: string
  userId: string
  tenantId: string
  deviceId: string | null
  startedAt: string
  expiresAt: string
  status: ComputerSessionStatus
  capabilities: ComputerCapabilityId[]
  approvals: string[]    // approvalRequestIds
  auditTrail: string[]   // auditEventIds
}

// ── Local Agent ──────────────────────────────────────────────────────────────
// Architecture/placeholder only. No native app or agent executable exists.

export interface LocalAgentRegistration {
  agentId: string
  deviceId: string
  userId: string
  tenantId: string
  /** Public key for a future mutual-auth handshake. Placeholder — not validated today. */
  publicKey: string
  sessionId: string | null
  capabilityGrant: ComputerCapabilityId[]
  expiresAt: string
  revokedAt: string | null
  healthStatus: 'unknown' | 'healthy' | 'degraded' | 'unreachable'
  registeredAt: string
  updatedAt: string
  /** Explicit documentation that this is a placeholder registration only. */
  _placeholder: true
}

// ── Browser Extension Bridge ─────────────────────────────────────────────────
// Architecture/placeholder only. No browser extension package is built or published.

export interface BrowserExtensionRegistration {
  extensionId: string
  userId: string
  tenantId: string
  browserName: string
  version: string
  grantedCapabilities: ComputerCapabilityId[]
  activeTabAccess: boolean
  permissionStatus: 'pending' | 'granted' | 'revoked' | 'expired'
  lastSeenAt: string | null
  registeredAt: string
  revokedAt: string | null
  /** Explicit documentation that this is a placeholder registration only. */
  _placeholder: true
}

// ── Audit events ─────────────────────────────────────────────────────────────

export type ComputerAuditEventType =
  | 'action.planned'
  | 'action.approved'
  | 'action.blocked'
  | 'action.executed'
  | 'capability.denied'
  | 'safety_guard.triggered'
  | 'agent.registered'
  | 'agent.revoked'
  | 'extension.registered'
  | 'extension.revoked'
  | 'session.created'
  | 'session.revoked'
  | 'approval.requested'

export interface ComputerAuditEvent {
  auditId: string
  tenantId: string
  userId: string
  eventType: ComputerAuditEventType
  capabilityId?: ComputerCapabilityId
  planId?: string
  sessionId?: string
  agentId?: string
  extensionId?: string
  approvalRequestId?: string
  riskLevel?: ComputerRiskLevel
  /** Metadata only — never log sensitive content (passwords, tokens, clipboard text, etc.) */
  metadata: Record<string, unknown>
  timestamp: string
}

// ── Computer approval request input ─────────────────────────────────────────

export interface ComputerApprovalInput {
  userId: string
  tenantId: string
  planId: string
  stepIndex: number
  capabilityId: ComputerCapabilityId
  riskLevel: ComputerRiskLevel
  description: string
  reason: string
  irreversible: boolean
  parameters?: Record<string, unknown>
}
