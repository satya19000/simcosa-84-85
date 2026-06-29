import type { WorkflowDefinition } from '../Workflow'

const now = new Date().toISOString()

export const TodaysPlanningWorkflow: WorkflowDefinition = {
  id: 'aria.builtin.todays-planning',
  name: "Today's Planning",
  description: "Loads today's tasks and reminders, generates a prioritised schedule, and notifies the user.",
  version: '1.0.0',
  trigger: { type: 'manual' },
  enabled: true,
  tags: ['builtin', 'planning', 'daily'],
  timeoutMs: 90_000,
  createdAt: now,
  updatedAt: now,
  steps: [
    {
      id: 'ai-plan',
      type: 'run_ai',
      name: 'Generate Daily Plan',
      prompt: 'You are ARIA, an AI executive assistant. The user wants a prioritised plan for today. Based on context, suggest a realistic schedule. Be concise — under 100 words.',
      maxTokens: 256,
      outputKey: 'dailyPlan',
      continueOnError: true,
    },
    {
      id: 'notify-plan',
      type: 'notification',
      name: 'Send Plan Notification',
      title: "Today's plan is ready",
      body: '{{dailyPlan}}',
    },
  ],
}
