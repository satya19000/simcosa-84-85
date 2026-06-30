import type { FinanceEngine } from './FinanceEngine'

// ── Finance Program Plugin Contract ─────────────────────────────────────────
// Business/organization-specific financial logic (NGO grant compliance,
// retail POS reconciliation, school fee collection, healthcare billing, or
// any future vertical) must implement this interface rather than being baked
// into FinanceEngine. The core engine never imports or depends on a concrete
// plugin; plugins register themselves against the engine's extension points
// (BudgetManager, FinanceAnalytics, ProcurementManager).

export interface FinanceProgramReport {
  programId: string
  title: string
  generatedAt: string
  data: Record<string, unknown>
}

export interface FinanceProgramDashboardWidget {
  id: string
  title: string
  description: string
}

export interface FinanceComplianceRule {
  id: string
  name: string
  description: string
  check: (context: Record<string, unknown>) => boolean | Promise<boolean>
}

export interface FinanceApprovalChainStep {
  id: string
  role: string
  description: string
}

export interface FinanceProgramPlugin {
  readonly id: string
  readonly name: string
  readonly description: string

  /** Custom financial modules/categories this plugin contributes. */
  registerFinancialModules?(): Array<{ id: string; name: string; description: string }>

  /** Procurement workflow extensions (extra states, vendor requirements, etc.) specific to this plugin. */
  registerProcurementWorkflows?(): Array<{ id: string; name: string; description: string }>

  /** Custom analytics computed against the org's financial data. */
  computeAnalytics?(userId: string, engine: FinanceEngine): Promise<Record<string, unknown>>

  /** Compliance rules (grant conditions, audit requirements, etc.) this plugin enforces. */
  registerComplianceRules?(): FinanceComplianceRule[]

  /** Approval chains (multi-level sign-off) this plugin contributes. */
  registerApprovalChains?(): FinanceApprovalChainStep[]

  /** Custom reports generated for finance managers/auditors. */
  generateReports?(userId: string, engine: FinanceEngine): Promise<FinanceProgramReport[]>

  /** Dashboard widgets the Developer Dashboard / finance dashboard may render. */
  registerDashboards?(): FinanceProgramDashboardWidget[]
}

export class FinancePluginRegistry {
  private readonly plugins = new Map<string, FinanceProgramPlugin>()

  register(plugin: FinanceProgramPlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  unregister(id: string): void {
    this.plugins.delete(id)
  }

  get(id: string): FinanceProgramPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): FinanceProgramPlugin[] {
    return [...this.plugins.values()]
  }

  async installInto(userId: string, engine: FinanceEngine): Promise<void> {
    void userId
    void engine
    // Plugins register declaratively; core engine has no concrete hooks to
    // call into yet beyond exposing the registry for consumers to query.
    for (const plugin of this.plugins.values()) {
      plugin.registerFinancialModules?.()
      plugin.registerProcurementWorkflows?.()
      plugin.registerComplianceRules?.()
      plugin.registerApprovalChains?.()
    }
  }
}

export const financePluginRegistry = new FinancePluginRegistry()
