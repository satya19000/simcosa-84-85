import type { AIProviderId } from './ModelTypes'
import type { ModelProvider } from './ModelProvider'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'
import { GeminiProvider } from './providers/GeminiProvider'
import { OpenRouterProvider } from './providers/OpenRouterProvider'
import { LocalLLMProvider } from './providers/LocalLLMProvider'

export interface ProviderApiKeys {
  anthropicApiKey: string
  openaiApiKey: string
  geminiApiKey: string
  openrouterApiKey: string
  localLlmEndpoint: string | null
}

/**
 * Composition root for all ModelProvider implementations. Plugin-first: to
 * add a new provider, implement ModelProvider and register it here — no
 * other module needs to change. ModelRouter/AIGateway only ever talk to
 * providers through this registry, never import a provider class directly.
 */
export class ProviderRegistry {
  private readonly providers = new Map<AIProviderId, ModelProvider>()
  private initialized = false

  constructor(keys: ProviderApiKeys) {
    this.providers.set('claude', new ClaudeProvider(keys.anthropicApiKey))
    this.providers.set('openai', new OpenAIProvider(keys.openaiApiKey))
    this.providers.set('gemini', new GeminiProvider(keys.geminiApiKey))
    this.providers.set('openrouter', new OpenRouterProvider(keys.openrouterApiKey))
    this.providers.set('local', new LocalLLMProvider(keys.localLlmEndpoint))
  }

  async initializeAll(): Promise<void> {
    if (this.initialized) return
    await Promise.all(Array.from(this.providers.values()).map((p) => p.initialize().catch(() => undefined)))
    this.initialized = true
  }

  get(providerId: AIProviderId): ModelProvider {
    const provider = this.providers.get(providerId)
    if (!provider) throw new Error(`Unknown AI provider: ${providerId}`)
    return provider
  }

  list(): ModelProvider[] {
    return Array.from(this.providers.values())
  }

  ids(): AIProviderId[] {
    return Array.from(this.providers.keys())
  }

  async shutdownAll(): Promise<void> {
    await Promise.all(this.list().map((p) => p.shutdown().catch(() => undefined)))
  }
}
