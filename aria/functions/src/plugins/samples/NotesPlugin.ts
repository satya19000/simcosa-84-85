import type { ARIAPlugin } from '../Plugin'
import type { PluginContext } from '../PluginContext'
import type { PluginHealth, PluginToolDefinition, PluginToolResult } from '../PluginTypes'
import type { MemoryProvider, MemoryBlock } from '../../intelligence/MemoryTypes'
import type { PluginManifest } from '../PluginManifest'
import type * as admin from 'firebase-admin'

const MANIFEST: PluginManifest = {
  id: 'aria-notes',
  name: 'Notes',
  version: '1.0.0',
  author: 'ARIA Core',
  description: 'Create, search, and delete personal notes from chat.',
  capabilities: ['chat', 'storage'],
  permissions: ['read:notes', 'write:notes'],
  minimumARIAVersion: '1.0.0',
}

export class NotesPlugin implements ARIAPlugin {
  readonly manifest = MANIFEST
  private ctx: PluginContext | null = null

  async install(ctx: PluginContext): Promise<void> {
    ctx.logger.info('NotesPlugin installed')
  }

  async initialize(ctx: PluginContext): Promise<void> {
    this.ctx = ctx
    ctx.logger.info('NotesPlugin initialized')
  }

  async enable(): Promise<void> {
    this.ctx?.logger.info('NotesPlugin enabled')
  }

  async disable(): Promise<void> {
    this.ctx?.logger.info('NotesPlugin disabled')
  }

  async upgrade(previousVersion: string, ctx: PluginContext): Promise<void> {
    ctx.logger.info(`NotesPlugin upgraded from ${previousVersion}`)
  }

  async shutdown(): Promise<void> {
    this.ctx?.logger.info('NotesPlugin shut down')
    this.ctx = null
  }

  async healthCheck(): Promise<PluginHealth> {
    return {
      healthy: true,
      status: 'enabled',
      lastCheckedAt: new Date().toISOString(),
      responseTimeMs: 0,
    }
  }

  getToolDefinitions(): PluginToolDefinition[] {
    return [
      {
        name: 'create_note',
        description: 'Create a new personal note for the user.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short title for the note' },
            content: { type: 'string', description: 'Full note content' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'search_notes',
        description: "Search the user's notes by keyword.",
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keyword' },
          },
          required: ['query'],
        },
      },
      {
        name: 'delete_note',
        description: 'Delete a note by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: { type: 'string', description: 'The ID of the note to delete' },
          },
          required: ['noteId'],
        },
      },
    ]
  }

  async executeTool(toolName: string, args: Record<string, unknown>, ctx: PluginContext): Promise<PluginToolResult> {
    switch (toolName) {
      case 'create_note':
        return this.createNote(args as { title: string; content: string }, ctx)
      case 'search_notes':
        return this.searchNotes(args as { query: string }, ctx)
      case 'delete_note':
        return this.deleteNote(args as { noteId: string }, ctx)
      default:
        return { success: false, message: `Unknown tool: ${toolName}`, error: 'unknown_tool' }
    }
  }

  private async createNote(args: { title: string; content: string }, ctx: PluginContext): Promise<PluginToolResult> {
    try {
      const id = await ctx.storage.add('notes', { title: args.title, content: args.content })
      await ctx.events.emit('note:created', MANIFEST.id, { noteId: id, title: args.title }, ctx.userId)
      return { success: true, message: `Note "${args.title}" created.`, data: { noteId: id, title: args.title } }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: msg, error: msg }
    }
  }

  private async searchNotes(args: { query: string }, ctx: PluginContext): Promise<PluginToolResult> {
    try {
      const notes = await ctx.storage.list('notes', { orderBy: '_createdAt', limit: 20 })
      const q = args.query.toLowerCase()
      const matches = notes.filter(
        (n) =>
          String(n['title'] ?? '').toLowerCase().includes(q) ||
          String(n['content'] ?? '').toLowerCase().includes(q)
      )
      return { success: true, message: `Found ${matches.length} notes.`, data: { notes: matches, count: matches.length } }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: msg, error: msg }
    }
  }

  private async deleteNote(args: { noteId: string }, ctx: PluginContext): Promise<PluginToolResult> {
    try {
      await ctx.storage.delete('notes', args.noteId)
      await ctx.events.emit('note:deleted', MANIFEST.id, { noteId: args.noteId }, ctx.userId)
      return { success: true, message: `Note ${args.noteId} deleted.` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: msg, error: msg }
    }
  }

  getMemoryProviders(): MemoryProvider[] {
    return [
      {
        name: 'notes-memory',
        type: 'recent_activity',
        load: async (userId: string, db: admin.firestore.Firestore): Promise<MemoryBlock[]> => {
          try {
            const snap = await db
              .collection('users')
              .doc(userId)
              .collection('plugins')
              .doc(MANIFEST.id)
              .collection('notes')
              .orderBy('_createdAt', 'desc')
              .limit(5)
              .get()

            if (snap.empty) return []
            const titles = snap.docs.map((d) => `• ${String(d.data()['title'] ?? 'Untitled')}`).join('\n')
            return [
              {
                type: 'recent_activity',
                title: 'Recent Notes',
                summary: titles,
                priority: 20,
                sizeChars: titles.length + 30,
                data: { source: 'notes-plugin' },
              },
            ]
          } catch {
            return []
          }
        },
      },
    ]
  }
}
