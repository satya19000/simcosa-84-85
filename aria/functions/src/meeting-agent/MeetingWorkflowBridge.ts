/**
 * MeetingWorkflowBridge.ts — workflow integration for the Meeting Agent.
 *
 * Supported workflows:
 * - start_meeting_notes
 * - end_meeting_and_summarize
 * - extract_action_items
 * - request_approvals
 * - generate_follow_up_reminders
 * - generate_meeting_minutes
 * - archive_meeting_notes
 */

import { MeetingLogger } from './MeetingLogger'

export type MeetingWorkflowType =
  | 'start_meeting_notes'
  | 'end_meeting_and_summarize'
  | 'extract_action_items'
  | 'request_approvals'
  | 'generate_follow_up_reminders'
  | 'generate_meeting_minutes'
  | 'archive_meeting_notes'

export interface WorkflowTriggerResult {
  workflowType: MeetingWorkflowType
  sessionId: string
  triggered: boolean
  message: string
}

export class MeetingWorkflowBridge {
  private readonly logger = new MeetingLogger()

  /**
   * Trigger a workflow for a meeting session.
   * Workflows are defined here as named operations — actual execution
   * is orchestrated by the MeetingAgentEngine.
   */
  triggerWorkflow(
    workflowType: MeetingWorkflowType,
    sessionId: string
  ): WorkflowTriggerResult {
    this.logger.log(`workflow_triggered:${workflowType}`, sessionId)
    return {
      workflowType,
      sessionId,
      triggered: true,
      message: `Workflow "${workflowType}" triggered for session ${sessionId}.`,
    }
  }

  /**
   * List available workflow types and their descriptions.
   */
  listWorkflows(): Array<{ type: MeetingWorkflowType; description: string }> {
    return [
      { type: 'start_meeting_notes', description: 'Initialize session, request consent, start transcription.' },
      { type: 'end_meeting_and_summarize', description: 'End session, stop transcription, generate AI summary.' },
      { type: 'extract_action_items', description: 'Extract action item suggestions from the transcript.' },
      { type: 'request_approvals', description: 'Request user approval for pending follow-ups.' },
      { type: 'generate_follow_up_reminders', description: 'Generate follow-up draft communications for participants.' },
      { type: 'generate_meeting_minutes', description: 'Compile and format structured meeting minutes.' },
      { type: 'archive_meeting_notes', description: 'Archive the meeting session and associated notes.' },
    ]
  }
}
