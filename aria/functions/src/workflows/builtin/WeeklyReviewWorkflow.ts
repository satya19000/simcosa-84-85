import type { WorkflowDefinition } from '../Workflow'

const now = new Date().toISOString()

export const WeeklyReviewWorkflow: WorkflowDefinition = {
  id: 'aria.builtin.weekly-review',
  name: 'Weekly Review',
  description: 'Generates a weekly review covering completed tasks, open items, and next week priorities.',
  version: '1.0.0',
  trigger: { type: 'scheduled', cron: '@weekly' },
  enabled: true,
  tags: ['builtin', 'review', 'weekly'],
  timeoutMs: 120_000,
  createdAt: now,
  updatedAt: now,
  steps: [
    {
      id: 'generate-review-briefing',
      type: 'generate_briefing',
      name: 'Generate Weekly Briefing',
      outputKey: 'weeklyBriefing',
      continueOnError: true,
    },
    {
      id: 'ai-review',
      type: 'run_ai',
      name: 'Generate Weekly Review',
      prompt: `You are ARIA, an AI executive assistant. Generate a concise weekly review for the user.
Cover: what went well this week, what's still open, top priorities for next week.
Be constructive and forward-looking. Under 120 words.`,
      maxTokens: 300,
      outputKey: 'weeklyReview',
      continueOnError: true,
    },
    {
      id: 'notify-review',
      type: 'notification',
      name: 'Send Weekly Review',
      title: '📊 Your weekly review is ready',
      body: 'ARIA has completed your weekly review. Open the app to see insights.',
    },
  ],
}
