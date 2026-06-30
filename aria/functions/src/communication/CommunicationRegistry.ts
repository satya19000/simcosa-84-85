import type { CommunicationProvider } from './CommunicationProvider'
import type { ProviderType } from './CommunicationTypes'
import { NoOpProvider } from './CommunicationProvider'

// ── Registry ──────────────────────────────────────────────────────────────────
// Providers register themselves here. The engine looks up by id or type.
// Plugins may call registerProvider() at startup.

const providers = new Map<string, CommunicationProvider>()

export function registerProvider(provider: CommunicationProvider): void {
  providers.set(provider.id, provider)
}

export function getProvider(id: string): CommunicationProvider | undefined {
  return providers.get(id)
}

export function getProviderByType(type: ProviderType): CommunicationProvider | undefined {
  for (const p of providers.values()) {
    if (p.type === type) return p
  }
  return undefined
}

export function listProviders(): CommunicationProvider[] {
  return [...providers.values()]
}

export function unregisterProvider(id: string): void {
  providers.delete(id)
}

// ── Placeholder providers registered at boot ─────────────────────────────────
// Real providers replace these when a plugin is loaded.

const PLACEHOLDER_TYPES: ProviderType[] = [
  'email', 'whatsapp', 'sms', 'phone', 'telegram',
  'signal', 'slack', 'teams', 'google_chat',
]

function labelFor(type: ProviderType): string {
  const labels: Record<ProviderType, string> = {
    email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS', phone: 'Phone',
    telegram: 'Telegram', signal: 'Signal', slack: 'Slack',
    teams: 'Microsoft Teams', google_chat: 'Google Chat', custom: 'Custom',
  }
  return labels[type]
}

for (const type of PLACEHOLDER_TYPES) {
  registerProvider(new NoOpProvider(type, labelFor(type), type))
}

export class CommunicationRegistry {
  registerProvider(provider: CommunicationProvider): void {
    registerProvider(provider)
  }

  getProvider(id: string): CommunicationProvider | undefined {
    return getProvider(id)
  }

  getProviderByType(type: ProviderType): CommunicationProvider | undefined {
    return getProviderByType(type)
  }

  listProviders(): CommunicationProvider[] {
    return listProviders()
  }

  listRegistered(): Array<{ id: string; name: string; type: ProviderType }> {
    return this.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type }))
  }
}
