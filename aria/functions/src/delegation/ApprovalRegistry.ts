import type { ApprovalRequest, ApprovalTriggerType } from './ApprovalTypes'

/**
 * Provider-pattern style executor contract. Each triggerType's actual
 * execution logic (e.g. how to send an email once approved, and how to
 * "unsend"/compensate it) is registered here rather than hardcoded into
 * ApprovalEngine — the engine only ever calls execute()/rollback()/verify()
 * on a registered executor, and only after a request has genuinely reached
 * status 'approved'.
 */
export interface ApprovalExecutor {
  triggerType: ApprovalTriggerType
  execute(request: ApprovalRequest): Promise<void>
  rollback(request: ApprovalRequest): Promise<void>
  verify(request: ApprovalRequest): Promise<boolean>
}

const executors = new Map<ApprovalTriggerType, ApprovalExecutor>()

export function registerExecutor(executor: ApprovalExecutor): void {
  executors.set(executor.triggerType, executor)
}

export function getExecutor(triggerType: ApprovalTriggerType): ApprovalExecutor | undefined {
  return executors.get(triggerType)
}

export function listExecutors(): ApprovalExecutor[] {
  return [...executors.values()]
}

export function unregisterExecutor(triggerType: ApprovalTriggerType): void {
  executors.delete(triggerType)
}

// ── Registry ──────────────────────────────────────────────────────────────────
// Deliberately empty by default, mirroring Finance/Health's registry pattern.
// No concrete executor is pre-registered for ANY triggerType — wiring an
// actual "send_email", "delete_documents", etc. executor is the
// responsibility of the calling module/plugin that owns that capability
// (e.g. the Communication Hub registers the send_email/send_whatsapp
// executors, the Document Workspace registers delete_documents, etc.).
// Until an executor is registered for a triggerType, ApprovalEngine will
// leave matching approved requests sitting in 'approved' state — it will
// NEVER perform the action itself.

export class ApprovalRegistry {
  registerExecutor(executor: ApprovalExecutor): void {
    registerExecutor(executor)
  }

  getExecutor(triggerType: ApprovalTriggerType): ApprovalExecutor | undefined {
    return getExecutor(triggerType)
  }

  listExecutors(): ApprovalExecutor[] {
    return listExecutors()
  }

  unregisterExecutor(triggerType: ApprovalTriggerType): void {
    unregisterExecutor(triggerType)
  }
}
