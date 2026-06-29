import type * as admin from 'firebase-admin'
import type { PluginToolDefinition, PluginToolResult } from './PluginTypes'
import { PluginRuntime } from './PluginRuntime'
import { NotesPlugin } from './samples/NotesPlugin'
import { WeatherPlugin } from './samples/WeatherPlugin'

let runtimeInstance: PluginRuntime | null = null
let initialized = false

export function getPluginRuntime(db: admin.firestore.Firestore): PluginRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new PluginRuntime(db)
  }
  return runtimeInstance
}

export async function initializePlugins(db: admin.firestore.Firestore, userId: string): Promise<void> {
  if (initialized) return
  initialized = true

  const runtime = getPluginRuntime(db)
  const plugins = [new NotesPlugin(), new WeatherPlugin()]

  await Promise.allSettled(
    plugins.map((p) => runtime.loadPlugin(p, userId))
  )
}

export async function getPluginTools(db: admin.firestore.Firestore, userId: string): Promise<PluginToolDefinition[]> {
  await initializePlugins(db, userId)
  return getPluginRuntime(db).getAllToolDefinitions()
}

export async function executePluginTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  db: admin.firestore.Firestore
): Promise<PluginToolResult> {
  return getPluginRuntime(db).executeTool(toolName, args, userId)
}

export { PluginRuntime }
export type { PluginToolDefinition, PluginToolResult }
