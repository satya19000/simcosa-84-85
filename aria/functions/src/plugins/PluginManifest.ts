import type { PluginCapability, PluginPermission } from './PluginTypes'

/** Declares everything about a plugin without executing any code. */
export interface PluginManifest {
  /** Unique reverse-domain identifier, e.g. "aria.notes" or "com.example.myplugin". */
  id: string
  name: string
  version: string
  author: string
  description: string
  capabilities: PluginCapability[]
  permissions: PluginPermission[]
  settings?: PluginSettingDefinition[]
  /** Engine names this plugin depends on, e.g. ['memory', 'context']. */
  requiredEngines?: string[]
  minimumARIAVersion?: string
  supportedPlatforms?: ('web' | 'mobile' | 'desktop')[]
  /** Future marketplace fields — not used by runtime yet. */
  iconUrl?: string
  screenshotUrls?: string[]
  tags?: string[]
  homepage?: string
  license?: string
  signature?: string
}

export interface PluginSettingDefinition {
  key: string
  type: 'string' | 'boolean' | 'number' | 'select'
  label: string
  description?: string
  defaultValue?: unknown
  options?: string[]
  required?: boolean
}

/** Marketplace listing metadata — prepared for Phase 4.2+ store UI. */
export interface PluginStoreEntry {
  manifest: PluginManifest
  rating: number
  downloads: number
  publishedAt: string
  updatedAt: string
  verified: boolean
  screenshots: string[]
  compatibility: string[]
  changelog?: string
}
