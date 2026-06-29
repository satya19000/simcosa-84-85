import { getFunctions, httpsCallable } from 'firebase/functions'
import type { GraphRunResult } from '../types/agentTypes'

export interface AgentTask {
  taskId?: string
  capability: string
  description: string
  input: Record<string, unknown>
  dependsOn?: string[]
  priority?: number
  outputKey?: string
}

export interface RunAgentGraphRequest {
  tasks: AgentTask[]
  sharedVars?: Record<string, unknown>
}

export interface AgentManifest {
  id: string
  name: string
  description: string
  version: string
  capabilities: string[]
  placeholder?: boolean
}

export interface AgentManagerStats {
  total: number
  idle: number
  busy: number
  error: number
  disabled: number
}

export interface AgentStatusResponse {
  manifests: AgentManifest[]
  stats: AgentManagerStats
}

export async function runAgentGraph(request: RunAgentGraphRequest): Promise<GraphRunResult> {
  const functions = getFunctions()
  const fn = httpsCallable<RunAgentGraphRequest, GraphRunResult>(functions, 'runAgentGraph')
  const result = await fn(request)
  return result.data
}

export async function getAgentStatus(): Promise<AgentStatusResponse> {
  const functions = getFunctions()
  const fn = httpsCallable<Record<string, never>, AgentStatusResponse>(functions, 'getAgentStatus')
  const result = await fn({})
  return result.data
}
