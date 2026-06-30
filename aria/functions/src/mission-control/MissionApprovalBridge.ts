import type { ApprovalEngine, CreateApprovalRequestInput } from '../delegation/ApprovalEngine'
import type { ApprovalRequest } from '../delegation/ApprovalTypes'
import type { MissionTask } from './MissionTypes'
import type { MissionTaskManager } from './MissionTaskManager'

/**
 * The ONLY path by which Mission Control gates a risky step. This bridge
 * never decides risk itself and never executes anything — it builds a
 * CreateApprovalRequestInput from a MissionTask and hands it straight to the
 * real ApprovalEngine (delegation/ApprovalEngine.ts), which owns risk
 * scoring (ApprovalPolicy/computeRiskScore), auto-execute eligibility, and
 * the pending -> approved -> executed state machine. Mission Control then
 * links the resulting ApprovalRequest's id onto the MissionTask so its
 * status can be queried later. No bypass: a task is never marked completed
 * by this bridge — completion still has to go through
 * MissionEngine.completeTask once the caller observes (via
 * getLinkedApprovalStatus or ApprovalEvents) that the request reached
 * 'approved'/'executed'.
 */
export class MissionApprovalBridge {
  constructor(
    private readonly approvalEngine: ApprovalEngine,
    private readonly tasks: MissionTaskManager
  ) {}

  async requestApprovalForTask(
    userId: string,
    task: MissionTask,
    input: Omit<CreateApprovalRequestInput, 'createdBy'>
  ): Promise<ApprovalRequest> {
    const request = await this.approvalEngine.createApprovalRequest(userId, {
      ...input,
      createdBy: userId,
    })
    await this.tasks.linkApprovalRequest(userId, task.id, request.id)
    if (request.status === 'pending') {
      await this.tasks.setStatus(userId, task.id, 'blocked')
    }
    return request
  }

  async getLinkedApprovalStatus(userId: string, task: MissionTask): Promise<ApprovalRequest | null> {
    if (!task.approvalRequestId) return null
    return this.approvalEngine.getApprovalRequest(userId, task.approvalRequestId)
  }
}
