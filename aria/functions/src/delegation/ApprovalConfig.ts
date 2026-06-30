export interface ApprovalConfig {
  /** Default time (ms) an approval request stays pending before expiring. */
  defaultExpiryMs: number
  /** Default time (ms) before expiry that an "expiring soon" notification fires. */
  expiringSoonWindowMs: number
  /** Risk score (0-100) below which a request MAY auto-execute without a human. */
  autoExecuteThreshold: number
  /** Risk score band upper bound for "simple" approval level. */
  simpleThreshold: number
  /** Risk score band upper bound for "executive" approval level (above = always manual/emergency). */
  executiveThreshold: number
  /** Default expiry (ms) for a delegation rule when none is specified. */
  delegationDefaultExpiryMs: number
  maxListLimit: number
  maxRetries: number
  retryDelayMs: number
}

// Risk bands per spec: <20 auto-execute eligible, 20-50 simple, 50-80 executive,
// 80+ always manual (mapped to 'manager'/'emergency' levels — never auto-executed).
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  defaultExpiryMs: 24 * 60 * 60 * 1000, // 24h
  expiringSoonWindowMs: 2 * 60 * 60 * 1000, // 2h
  autoExecuteThreshold: 20,
  simpleThreshold: 50,
  executiveThreshold: 80,
  delegationDefaultExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxListLimit: 100,
  maxRetries: 3,
  retryDelayMs: 2000,
}
