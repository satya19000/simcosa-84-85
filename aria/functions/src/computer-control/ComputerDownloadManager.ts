import type { ComputerApprovalBridge } from './ComputerApprovalBridge'
import type { ComputerAudit } from './ComputerAudit'
import type { DownloadApprovalInput, DownloadResult } from './ComputerExecutionTypes'

/**
 * ComputerDownloadManager — approval-gated file download manager.
 *
 * ALL downloads must:
 * 1. Show file name, type, and source description to the user BEFORE any download.
 * 2. Require an approved ApprovalRequest via ComputerApprovalBridge.
 * 3. Be audited.
 *
 * SAFETY CONSTRAINTS:
 * - No download may start without an approval record in 'approved' status.
 * - No download may be triggered silently — file name, type, and source must be
 *   shown to the user in the UI before the approval request is created.
 * - Downloads in the web-pwa provider are documented as NOT FUNCTIONAL —
 *   they return a structured notImplemented result.
 * - No credential-bearing URLs, session tokens, or private file paths are logged.
 *
 * In a future implementation, the actual download would be routed through the
 * DesktopAgent or BrowserExtension provider after approval is granted.
 */
export class ComputerDownloadManager {
  constructor(
    private readonly approvalBridge: ComputerApprovalBridge,
    private readonly audit: ComputerAudit
  ) {}

  /**
   * Download a file only if an approved approval record exists.
   *
   * The caller (Cloud Function) must:
   * 1. Have already shown the user the file name, type, and source description.
   * 2. Have already called `requestApproval` via ComputerApprovalBridge.
   * 3. Pass the resulting approvalRequestId here.
   *
   * This method verifies the approval status before proceeding.
   */
  async downloadFileWithUserApproval(input: DownloadApprovalInput): Promise<DownloadResult> {
    // Verify approval record is genuinely 'approved'
    const approval = await this.approvalBridge.getApprovalStatus(input.userId, input.approvalRequestId)

    if (!approval || approval.status !== 'approved') {
      const reason = `Download of "${input.fileName}" requires an approved approval request. Current status: ${approval?.status ?? 'not found'}.`
      await this.audit.record({
        tenantId: input.tenantId,
        userId: input.userId,
        eventType: 'action.blocked',
        capabilityId: 'downloadFileWithUserApproval',
        planId: input.planId,
        approvalRequestId: input.approvalRequestId,
        metadata: {
          reason,
          fileName: input.fileName,
          fileType: input.fileType,
        },
      })
      return { success: false, fileName: input.fileName, fileType: input.fileType, error: reason }
    }

    // Audit the download attempt
    const auditEvent = await this.audit.record({
      tenantId: input.tenantId,
      userId: input.userId,
      eventType: 'action.executed',
      capabilityId: 'downloadFileWithUserApproval',
      planId: input.planId,
      approvalRequestId: input.approvalRequestId,
      riskLevel: 'medium',
      metadata: {
        fileName: input.fileName,
        fileType: input.fileType,
        fileSizeBytes: input.fileSizeBytes,
        // sourceDescription is logged but NOT a raw URL to avoid leaking credentials
        sourceDescription: input.sourceDescription,
        notImplemented: true,  // WebPWA provider cannot actually trigger downloads from server
      },
    })

    // In the web-pwa provider, actual file download is NOT implemented at the server level.
    // The browser-side download must be triggered by the front-end using the browser's
    // native download API after the approval is granted. This result indicates that the
    // approval was verified and audited — the actual file transfer happens in the browser.
    return {
      success: true,
      fileName: input.fileName,
      fileType: input.fileType,
      downloadedAt: new Date().toISOString(),
      auditEventId: auditEvent.auditId,
      notImplemented: true,  // Actual download is browser-side; server side is approval+audit only
    }
  }

  /**
   * Build the approval request input for a download — callers use this to
   * create the approval record before calling downloadFileWithUserApproval.
   */
  buildDownloadApprovalRequest(params: {
    tenantId: string
    userId: string
    planId: string
    stepIndex: number
    fileName: string
    fileType: string
    fileSizeBytes?: number
    sourceDescription: string
  }) {
    return {
      userId: params.userId,
      tenantId: params.tenantId,
      planId: params.planId,
      stepIndex: params.stepIndex,
      capabilityId: 'downloadFileWithUserApproval' as const,
      riskLevel: 'medium' as const,
      description: `Download file: "${params.fileName}" (${params.fileType}${params.fileSizeBytes ? ', ' + Math.round(params.fileSizeBytes / 1024) + ' KB' : ''}) from ${params.sourceDescription}`,
      reason: `User requested download of "${params.fileName}". Source: ${params.sourceDescription}. File type: ${params.fileType}.`,
      irreversible: false,
      parameters: {
        fileName: params.fileName,
        fileType: params.fileType,
        fileSizeBytes: params.fileSizeBytes,
        sourceDescription: params.sourceDescription,
      },
    }
  }
}
