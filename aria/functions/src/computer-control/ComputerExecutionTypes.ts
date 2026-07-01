/**
 * Additional types for the Phase 5.6 execution pipeline, document bridge,
 * download manager, and execution validator.
 */

import type { ComputerCapabilityId, ComputerRiskLevel, ComputerActionPlan, ComputerActionStep, ComputerActionResult, ComputerAuditEvent } from './ComputerTypes'

// ── Pipeline ─────────────────────────────────────────────────────────────────

export type PipelineStageId =
  | 'intent'
  | 'planner'
  | 'safety_guard'
  | 'approval_bridge'
  | 'provider_execution'
  | 'document_bridge'
  | 'ai_gateway'
  | 'audit'

export interface PipelineStageResult {
  stage: PipelineStageId
  success: boolean
  durationMs: number
  output?: unknown
  error?: string
  /** Stage was skipped because it was not applicable to this action. */
  skipped?: boolean
}

export interface PipelineExecutionResult {
  pipelineId: string
  planId: string
  stepIndex: number
  capabilityId: ComputerCapabilityId
  overallSuccess: boolean
  stages: PipelineStageResult[]
  actionResult?: ComputerActionResult
  auditEventId?: string
  executedAt: string
}

export interface PipelineExecuteInput {
  tenantId: string
  userId: string
  plan: ComputerActionPlan
  step: ComputerActionStep
  approvalRequestId?: string
  /** If the action involves a file, attach document metadata. */
  documentContext?: DocumentBridgeResult
}

// ── Document Bridge ──────────────────────────────────────────────────────────

export interface FileMetadata {
  fileName: string
  fileType: string       // MIME type
  fileSizeBytes: number
  source: 'browser-file-picker' | 'user-provided-url' | 'generated'
  selectedAt: string     // ISO timestamp
}

export interface DocumentAnalysisRequest {
  tenantId: string
  userId: string
  fileName: string
  fileType: string
  /** Base64-encoded file content — provided by browser file picker, never silently read. */
  fileContentBase64: string
  fileSizeBytes: number
}

export interface ExtractedActionItem {
  index: number
  text: string
  priority: 'high' | 'medium' | 'low'
  /** Suggested due date if mentioned in the document — never auto-set, for display only. */
  suggestedDueDate?: string
}

export interface DocumentSuggestion {
  type: 'task' | 'reminder'
  title: string
  notes: string
  sourcePlanId: string
  sourceDocumentId: string
  /** ALWAYS a suggestion — never auto-created. User must explicitly approve via UI. */
  _requiresUserApproval: true
}

export interface DocumentBridgeResult {
  documentId: string
  tenantId: string
  userId: string
  fileName: string
  fileType: string
  fileSizeBytes: number
  summary: string
  actionItems: ExtractedActionItem[]
  /** Suggested tasks — never auto-created. */
  suggestedTasks: DocumentSuggestion[]
  /** Suggested reminders — never auto-created. */
  suggestedReminders: DocumentSuggestion[]
  analyzedAt: string
  /** AI Gateway was used for summary/action-item extraction. */
  aiGatewayUsed: boolean
}

// ── Download Manager ─────────────────────────────────────────────────────────

export interface DownloadApprovalInput {
  tenantId: string
  userId: string
  planId: string
  stepIndex: number
  fileName: string
  fileType: string
  fileSizeBytes?: number
  sourceDescription: string   // Human-readable source — never a raw credential URL
  /** The approval request ID that must be in 'approved' status before download. */
  approvalRequestId: string
}

export interface DownloadResult {
  success: boolean
  fileName: string
  fileType: string
  downloadedAt?: string
  auditEventId?: string
  error?: string
  /** Download is not functional in the web-pwa provider — documented as placeholder. */
  notImplemented?: boolean
}

// ── Execution Validator ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  planValid: boolean
  approvalValid: boolean
  capabilityNotRevoked: boolean
  errors: string[]
}

// ── Audit Stream ─────────────────────────────────────────────────────────────

export type AuditStreamEventType =
  | 'planned'
  | 'blocked'
  | 'approval_requested'
  | 'approval_granted'
  | 'executed'
  | 'failed'
  | 'safety_guard_triggered'

export interface AuditStreamEvent {
  streamEventId: string
  /** Mapped from ComputerAuditEventType to AuditStreamEventType for front-end display. */
  streamEventType: AuditStreamEventType
  sourceAuditEvent: ComputerAuditEvent
  colorCode: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray'
  riskLevel: ComputerRiskLevel
  displayLabel: string
  timestamp: string
}

export interface AuditFeedPage {
  events: AuditStreamEvent[]
  nextPageToken?: string
  totalFetched: number
}

// ── File Picker Plan ─────────────────────────────────────────────────────────

export interface FilePickerPlanOptions {
  userId: string
  tenantId: string
  /** The intent description shown to the user in the plan. */
  intent: string
  /** If provided, limits accepted file types (e.g. 'application/pdf,image/*'). */
  acceptedFileTypes?: string
}
