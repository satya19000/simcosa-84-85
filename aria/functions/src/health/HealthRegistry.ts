import type { HealthProvider } from './HealthProvider'

// ── Registry ──────────────────────────────────────────────────────────────────
// Health data providers (HIS, EMR, lab systems, vaccination registries, etc)
// register themselves here. Plugins may call registerProvider() at startup.
// No vendor is ever referenced by the core engine.

const providers = new Map<string, HealthProvider>()

export function registerProvider(provider: HealthProvider): void {
  providers.set(provider.id, provider)
}

export function getProvider(id: string): HealthProvider | undefined {
  return providers.get(id)
}

export function getProviderByType(type: string): HealthProvider | undefined {
  for (const p of providers.values()) {
    if (p.type === type) return p
  }
  return undefined
}

export function listProviders(): HealthProvider[] {
  return [...providers.values()]
}

export function unregisterProvider(id: string): void {
  providers.delete(id)
}

export class HealthRegistry {
  registerProvider(provider: HealthProvider): void {
    registerProvider(provider)
  }

  getProvider(id: string): HealthProvider | undefined {
    return getProvider(id)
  }

  getProviderByType(type: string): HealthProvider | undefined {
    return getProviderByType(type)
  }

  listProviders(): HealthProvider[] {
    return listProviders()
  }

  listRegistered(): Array<{ id: string; name: string; type: string }> {
    return this.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type }))
  }
}
