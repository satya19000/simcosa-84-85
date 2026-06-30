/* eslint-disable no-console */

/** Thin structured logger — mirrors ApprovalLogger's "consistent shape" philosophy, stdout-only (Cloud Functions log sink). */
export class WorkspaceLogger {
  info(organizationId: string, event: string, details?: Record<string, unknown>): void {
    console.log(JSON.stringify({ level: 'info', module: 'organization', organizationId, event, details, at: new Date().toISOString() }))
  }

  warn(organizationId: string, event: string, details?: Record<string, unknown>): void {
    console.warn(JSON.stringify({ level: 'warn', module: 'organization', organizationId, event, details, at: new Date().toISOString() }))
  }

  error(organizationId: string, event: string, details?: Record<string, unknown>): void {
    console.error(JSON.stringify({ level: 'error', module: 'organization', organizationId, event, details, at: new Date().toISOString() }))
  }
}
