export interface AgentResult {
  taskId: string
  graphRunId: string
  agentId: string
  status: string
  output: unknown
  summary: string
  tokenUsage?: { input: number; output: number }
  durationMs: number
  attempts: number
  error?: string
  completedAt: string
}

export interface GraphRunResult {
  graphRunId: string
  userId: string
  status: 'completed' | 'partial' | 'failed' | 'cancelled'
  assembledResponse: string
  taskResults: AgentResult[]
  sharedVars: Record<string, unknown>
  totalDurationMs: number
  startedAt: string
  completedAt: string
  error?: string
}
