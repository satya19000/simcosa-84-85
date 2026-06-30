import type { DiseaseInfo, HealthProgram, DecisionSupportRule, HealthStats } from './HealthTypes'
import type { HealthEngine } from './HealthEngine'

// ── Public Health Program Plugin Contract ───────────────────────────────────
// Program-specific logic (Maternal Health, Child Health, Immunization, Vector
// Control, Disease Surveillance, Nutrition, School Health, NCD, TB, HIV, and
// any future program) must implement this interface rather than being baked
// into HealthEngine. The core engine never imports or depends on a concrete
// program plugin; plugins register themselves against the engine's extension
// points (DiseaseKnowledge, ClinicalDecisionSupport, HealthAnalytics).

export interface HealthProgramReport {
  programId: string
  title: string
  generatedAt: string
  data: Record<string, unknown>
}

export interface HealthProgramDashboardWidget {
  id: string
  title: string
  description: string
}

export interface HealthProgramPlugin {
  readonly id: string
  readonly name: string
  readonly description: string

  /** Diseases/conditions this program tracks, registered into DiseaseKnowledge. */
  registerDiseases?(): Array<Omit<DiseaseInfo, 'id' | 'createdAt' | 'updatedAt'>>

  /** Program metadata registered into DiseaseKnowledge's program store. */
  registerProgram?(): HealthProgram

  /** Clinical decision-support rules specific to this program. */
  registerProtocols?(): DecisionSupportRule[]

  /** Custom analytics computed against the program's patient cohort. */
  computeAnalytics?(userId: string, engine: HealthEngine): Promise<Record<string, unknown>>

  /** Custom reports generated for program managers/auditors. */
  generateReports?(userId: string, engine: HealthEngine): Promise<HealthProgramReport[]>

  /** Dashboard widgets the Developer Dashboard / program dashboard may render. */
  registerDashboards?(): HealthProgramDashboardWidget[]

  /** Workflow definitions (e.g. follow-up cadences) this program contributes. */
  registerWorkflows?(): Array<{ id: string; name: string; description: string }>
}

export class HealthPluginRegistry {
  private readonly plugins = new Map<string, HealthProgramPlugin>()

  register(plugin: HealthProgramPlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  unregister(id: string): void {
    this.plugins.delete(id)
  }

  get(id: string): HealthProgramPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): HealthProgramPlugin[] {
    return [...this.plugins.values()]
  }

  async installInto(userId: string, engine: HealthEngine): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const diseases = plugin.registerDiseases?.() ?? []
      for (const d of diseases) await engine.registerDisease(userId, d)

      const program = plugin.registerProgram?.()
      if (program) await engine.registerProgram(userId, program)

      const rules = plugin.registerProtocols?.() ?? []
      for (const rule of rules) engine.registerDecisionSupportRule(rule)
    }
  }
}

export const healthPluginRegistry = new HealthPluginRegistry()

export type { HealthStats }
