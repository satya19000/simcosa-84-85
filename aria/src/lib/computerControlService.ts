import { httpsCallable } from 'firebase/functions'
import { functions as fns } from './firebase'

const listComputerCapabilitiesFn = httpsCallable(fns, 'listComputerCapabilities')
const planComputerActionFn = httpsCallable(fns, 'planComputerAction')
const requestComputerApprovalFn = httpsCallable(fns, 'requestComputerApproval')
const registerLocalAgentFn = httpsCallable(fns, 'registerLocalAgent')
const revokeLocalAgentFn = httpsCallable(fns, 'revokeLocalAgent')
const listLocalAgentsFn = httpsCallable(fns, 'listLocalAgents')
const registerBrowserExtensionFn = httpsCallable(fns, 'registerBrowserExtension')
const revokeBrowserExtensionFn = httpsCallable(fns, 'revokeBrowserExtension')
const listBrowserExtensionsFn = httpsCallable(fns, 'listBrowserExtensions')
const logComputerActionResultFn = httpsCallable(fns, 'logComputerActionResult')

// ── Shared types (mirrors computer-control/ComputerTypes.ts) ─────────────────

export type ComputerRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type ComputerCapabilityId =
  | 'readVisiblePage' | 'summarizeVisiblePage' | 'openUrl' | 'searchWeb'
  | 'copyToClipboard' | 'pasteFromClipboard' | 'readClipboard'
  | 'uploadFileWithUserPicker' | 'downloadFileWithUserApproval'
  | 'screenshotWithApproval' | 'ocrScreenshot' | 'listBrowserTabs' | 'switchTab'
  | 'openApp' | 'createFile' | 'moveFile' | 'renameFile' | 'deleteFile'
  | 'sendMessage' | 'submitForm' | 'paymentAction' | 'credentialAccess'

export type ComputerPermission =
  | 'computer.readPage' | 'computer.openUrl' | 'computer.clipboard.read'
  | 'computer.clipboard.write' | 'computer.screenshot' | 'computer.ocr'
  | 'computer.files.read' | 'computer.files.write' | 'computer.files.delete'
  | 'computer.browser.tabs' | 'computer.forms.submit' | 'computer.apps.open'
  | 'computer.network.request'

export interface ComputerCapabilityDescriptor {
  id: ComputerCapabilityId
  name: string
  description: string
  riskLevel: ComputerRiskLevel
  requiredPermissions: ComputerPermission[]
  requiresApproval: boolean
  reversible: boolean
  auditRequired: boolean
  policyBlocked?: boolean
  alwaysBlocked?: boolean
}

export interface ComputerActionStep {
  stepIndex: number
  description: string
  capabilityId: ComputerCapabilityId
  riskLevel: ComputerRiskLevel
  requiresApproval: boolean
  reversible: boolean
  parameters?: Record<string, unknown>
  status?: 'pending' | 'approved' | 'executed' | 'skipped' | 'blocked'
  executedAt?: string
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
  status: 'proposed' | 'approved' | 'rejected' | 'cancelled' | 'executing' | 'completed'
}

export interface LocalAgentRegistration {
  agentId: string
  deviceId: string
  userId: string
  tenantId: string
  publicKey: string
  sessionId: string | null
  capabilityGrant: ComputerCapabilityId[]
  expiresAt: string
  revokedAt: string | null
  healthStatus: 'unknown' | 'healthy' | 'degraded' | 'unreachable'
  registeredAt: string
  updatedAt: string
  _placeholder: true
}

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
  _placeholder: true
}

export interface ComputerAuditEvent {
  auditId: string
  tenantId: string
  userId: string
  eventType: string
  capabilityId?: ComputerCapabilityId
  planId?: string
  riskLevel?: ComputerRiskLevel
  metadata: Record<string, unknown>
  timestamp: string
}

// ── Capability listing ─────────────────────────────────────────────────────

export async function listComputerCapabilities(): Promise<ComputerCapabilityDescriptor[]> {
  const result = await listComputerCapabilitiesFn()
  return result.data as ComputerCapabilityDescriptor[]
}

// ── Planning ───────────────────────────────────────────────────────────────

export async function planComputerAction(
  tenantId: string,
  intent: string,
  manualSteps?: Array<{ capabilityId: ComputerCapabilityId; description: string; parameters?: Record<string, unknown> }>
): Promise<ComputerActionPlan> {
  const result = await planComputerActionFn({ tenantId, intent, manualSteps })
  return result.data as ComputerActionPlan
}

// ── Approval ───────────────────────────────────────────────────────────────

export async function requestComputerApproval(input: {
  tenantId: string
  planId: string
  stepIndex: number
  capabilityId: ComputerCapabilityId
  riskLevel: ComputerRiskLevel
  description: string
  reason: string
  irreversible: boolean
}): Promise<{ id: string; status: string }> {
  const result = await requestComputerApprovalFn(input)
  return result.data as { id: string; status: string }
}

// ── Local agent ─────────────────────────────────────────────────────────────

export async function registerLocalAgent(
  tenantId: string,
  deviceId: string,
  publicKey: string,
  capabilityGrant: ComputerCapabilityId[] = []
): Promise<LocalAgentRegistration> {
  const result = await registerLocalAgentFn({ tenantId, deviceId, publicKey, capabilityGrant })
  return result.data as LocalAgentRegistration
}

export async function revokeLocalAgent(tenantId: string, agentId: string): Promise<void> {
  await revokeLocalAgentFn({ tenantId, agentId })
}

export async function listLocalAgents(tenantId: string): Promise<LocalAgentRegistration[]> {
  const result = await listLocalAgentsFn({ tenantId })
  return result.data as LocalAgentRegistration[]
}

// ── Browser extension ──────────────────────────────────────────────────────

export async function registerBrowserExtension(
  tenantId: string,
  browserName: string,
  version: string,
  grantedCapabilities: ComputerCapabilityId[] = []
): Promise<BrowserExtensionRegistration> {
  const result = await registerBrowserExtensionFn({ tenantId, browserName, version, grantedCapabilities })
  return result.data as BrowserExtensionRegistration
}

export async function revokeBrowserExtension(tenantId: string, extensionId: string): Promise<void> {
  await revokeBrowserExtensionFn({ tenantId, extensionId })
}

export async function listBrowserExtensions(tenantId: string): Promise<BrowserExtensionRegistration[]> {
  const result = await listBrowserExtensionsFn({ tenantId })
  return result.data as BrowserExtensionRegistration[]
}

// ── Audit ──────────────────────────────────────────────────────────────────

export async function logComputerActionResult(
  tenantId: string,
  planId: string,
  capabilityId: ComputerCapabilityId,
  success: boolean,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logComputerActionResultFn({ tenantId, planId, capabilityId, success, metadata })
}
