import type { FinanceProvider } from './FinanceProvider'

// ── Registry ──────────────────────────────────────────────────────────────────
// Financial data providers (banks, UPI, credit cards, accounting systems, ERP,
// government finance APIs) register themselves here. No vendor is ever
// referenced by the core engine. No placeholders pre-registered — providers
// are vendor-specific, not a fixed enumerable channel set.

const providers = new Map<string, FinanceProvider>()

export function registerProvider(provider: FinanceProvider): void {
  providers.set(provider.id, provider)
}

export function getProvider(id: string): FinanceProvider | undefined {
  return providers.get(id)
}

export function getProviderByType(type: string): FinanceProvider | undefined {
  for (const p of providers.values()) {
    if (p.type === type) return p
  }
  return undefined
}

export function listProviders(): FinanceProvider[] {
  return [...providers.values()]
}

export function unregisterProvider(id: string): void {
  providers.delete(id)
}

export class FinanceRegistry {
  registerProvider(provider: FinanceProvider): void {
    registerProvider(provider)
  }

  getProvider(id: string): FinanceProvider | undefined {
    return getProvider(id)
  }

  getProviderByType(type: string): FinanceProvider | undefined {
    return getProviderByType(type)
  }

  listProviders(): FinanceProvider[] {
    return listProviders()
  }

  listRegistered(): Array<{ id: string; name: string; type: string }> {
    return this.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type }))
  }
}
