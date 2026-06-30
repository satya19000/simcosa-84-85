import type { SkillManifest, DependencyResolutionResult } from './MarketplaceTypes'

const KNOWN_ENGINES = [
  'finance', 'delegation', 'mission-control', 'organization', 'security',
  'plugins', 'action-engine', 'intelligence', 'memory-graph', 'health', 'communication', 'documents',
]

/** Resolves a skill manifest's requiredPlugins/requiredEngines against what is actually installed/available. */
export class SkillDependencyResolver {
  resolve(manifest: SkillManifest, installedPluginIds: string[]): DependencyResolutionResult {
    const missingPlugins = manifest.requiredPlugins.filter((id) => !installedPluginIds.includes(id))
    const missingEngines = manifest.requiredEngines.filter((name) => !KNOWN_ENGINES.includes(name))
    return {
      resolved: missingPlugins.length === 0 && missingEngines.length === 0,
      missingPlugins,
      missingEngines,
    }
  }
}
