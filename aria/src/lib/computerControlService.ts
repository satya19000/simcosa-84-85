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
// Phase 5.6
const executeApprovedComputerActionFn = httpsCallable(fns, 'executeApprovedComputerAction')
const analyzeSelectedDocumentFn = httpsCallable(fns, 'analyzeSelectedDocument', { timeout: 60000 })
const generateComputerActionSummaryFn = httpsCallable(fns, 'generateComputerActionSummary')
const getComputerAuditFeedFn = httpsCallable(fns, 'getComputerAuditFeed')
const downloadGeneratedFileWithApprovalFn = httpsCallable(fns, 'downloadGeneratedFileWithApproval')

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
  approvalRequestId?: string
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

// ── Phase 5.6: Execute Approved Action ────────────────────────────────────────

export interface PipelineExecutionResult {
  pipelineId: string
  planId: string
  stepIndex: number
  capabilityId: ComputerCapabilityId
  overallSuccess: boolean
  stages: Array<{
    stage: string
    success: boolean
    durationMs: number
    output?: unknown
    error?: string
    skipped?: boolean
  }>
  auditEventId?: string
  executedAt: string
}

export async function executeApprovedComputerAction(
  tenantId: string,
  plan: ComputerActionPlan,
  step: ComputerActionStep,
  approvalRequestId?: string
): Promise<PipelineExecutionResult> {
  const result = await executeApprovedComputerActionFn({ tenantId, plan, step, approvalRequestId })
  return result.data as PipelineExecutionResult
}

// ── Phase 5.6: Analyze Selected Document ──────────────────────────────────────

export interface ExtractedActionItem {
  index: number
  text: string
  priority: 'high' | 'medium' | 'low'
  suggestedDueDate?: string
}

export interface DocumentSuggestion {
  type: 'task' | 'reminder'
  title: string
  notes: string
  sourcePlanId: string
  sourceDocumentId: string
  _requiresUserApproval: true
}

export interface DocumentAnalysisResult {
  documentId: string
  tenantId: string
  userId: string
  fileName: string
  fileType: string
  fileSizeBytes: number
  summary: string
  actionItems: ExtractedActionItem[]
  suggestedTasks: DocumentSuggestion[]
  suggestedReminders: DocumentSuggestion[]
  analyzedAt: string
  aiGatewayUsed: boolean
}

export async function analyzeSelectedDocument(
  tenantId: string,
  fileName: string,
  fileType: string,
  fileContentBase64: string,
  fileSizeBytes: number
): Promise<DocumentAnalysisResult> {
  const result = await analyzeSelectedDocumentFn({
    tenantId,
    fileName,
    fileType,
    fileContentBase64,
    fileSizeBytes,
  })
  return result.data as DocumentAnalysisResult
}

/**
 * Read a browser File object and encode it as base64 for analyzeSelectedDocument.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ── Phase 5.6: Generate Action Summary ────────────────────────────────────────

export interface ComputerActionSummary {
  planId: string
  intent: string
  summary: string
  stepCount: number
  aiGatewayUsed: boolean
  _note?: string
}

export async function generateComputerActionSummary(plan: ComputerActionPlan): Promise<ComputerActionSummary> {
  const result = await generateComputerActionSummaryFn({ plan })
  return result.data as ComputerActionSummary
}

// ── Phase 5.6: Audit Feed ──────────────────────────────────────────────────────

export interface AuditFeedPage {
  events: Array<{
    streamEventId: string
    streamEventType: string
    sourceAuditEvent: ComputerAuditEvent
    colorCode: string
    riskLevel: string
    displayLabel: string
    timestamp: string
  }>
  nextPageToken?: string
  totalFetched: number
}

export async function getComputerAuditFeed(
  tenantId: string,
  limit = 25,
  beforeTimestamp?: string
): Promise<AuditFeedPage> {
  const result = await getComputerAuditFeedFn({ tenantId, limit, beforeTimestamp })
  return result.data as AuditFeedPage
}

// ── Phase 5.6: Download with Approval ─────────────────────────────────────────

export interface DownloadResult {
  success: boolean
  fileName: string
  fileType: string
  downloadedAt?: string
  auditEventId?: string
  error?: string
  notImplemented?: boolean
}

export async function downloadGeneratedFileWithApproval(input: {
  tenantId: string
  planId: string
  stepIndex: number
  fileName: string
  fileType: string
  fileSizeBytes?: number
  sourceDescription: string
  approvalRequestId: string
}): Promise<DownloadResult> {
  const result = await downloadGeneratedFileWithApprovalFn(input)
  return result.data as DownloadResult
}
