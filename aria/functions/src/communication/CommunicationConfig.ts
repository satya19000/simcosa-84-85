export interface CommunicationConfig {
  maxMessagesPerSync: number
  maxThreadsPerList: number
  analysisBudgetTokens: number
  summaryBudgetTokens: number
  replyBudgetTokens: number
  searchLimit: number
  schedulerTickMs: number
  conversationMemoryTTLMs: number
  providerHealthCheckIntervalMs: number
  maxRetries: number
  retryDelayMs: number
}

export const DEFAULT_COMMUNICATION_CONFIG: CommunicationConfig = {
  maxMessagesPerSync: 50,
  maxThreadsPerList: 100,
  analysisBudgetTokens: 1024,
  summaryBudgetTokens: 2048,
  replyBudgetTokens: 1024,
  searchLimit: 30,
  schedulerTickMs: 60_000,
  conversationMemoryTTLMs: 20 * 60 * 1000,
  providerHealthCheckIntervalMs: 5 * 60 * 1000,
  maxRetries: 3,
  retryDelayMs: 2000,
}
