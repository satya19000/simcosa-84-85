import type * as admin from 'firebase-admin'
import { FinanceEngine } from './FinanceEngine'
import { DEFAULT_FINANCE_CONFIG } from './FinanceConfig'

// ── Per-user singleton sessions ───────────────────────────────────────────────

interface Session {
  engine: FinanceEngine
  createdAt: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL_MS = 20 * 60 * 1000

function getSession(userId: string, db: admin.firestore.Firestore, apiKey: string): Session {
  const existing = sessions.get(userId)
  if (existing && Date.now() - existing.createdAt < SESSION_TTL_MS) return existing
  const session: Session = {
    engine: new FinanceEngine(db, DEFAULT_FINANCE_CONFIG, apiKey),
    createdAt: Date.now(),
  }
  sessions.set(userId, session)
  return session
}

export function getFinanceEngine(userId: string, db: admin.firestore.Firestore, apiKey: string): FinanceEngine {
  return getSession(userId, db, apiKey).engine
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { FinanceEngine } from './FinanceEngine'
export { FinanceRegistry, registerProvider, getProvider, getProviderByType, listProviders } from './FinanceRegistry'
export { FinanceProvider, BaseFinanceProvider, NoOpFinanceProvider } from './FinanceProvider'
export { BudgetManager } from './BudgetManager'
export { ExpenseManager } from './ExpenseManager'
export { IncomeManager } from './IncomeManager'
export { VendorManager } from './VendorManager'
export { InvoiceManager } from './InvoiceManager'
export { PaymentManager } from './PaymentManager'
export { ProcurementManager } from './ProcurementManager'
export { AssetManager } from './AssetManager'
export { FinanceAnalytics } from './FinanceAnalytics'
export { FinanceScheduler } from './FinanceScheduler'
export { FinancePermissions } from './FinancePermissions'
export { FinanceValidator } from './FinanceValidator'
export { FinanceEvents } from './FinanceEvents'
export { DEFAULT_FINANCE_CONFIG } from './FinanceConfig'
export type { FinanceConfig } from './FinanceConfig'
export { FinancePluginRegistry, financePluginRegistry } from './FinanceProgramPlugin'
export type { FinanceProgramPlugin, FinanceProgramReport, FinanceProgramDashboardWidget } from './FinanceProgramPlugin'
export * from './FinanceTypes'
