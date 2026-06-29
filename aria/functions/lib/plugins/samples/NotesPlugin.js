"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesPlugin = void 0;
const MANIFEST = {
    id: 'aria-notes',
    name: 'Notes',
    version: '1.0.0',
    author: 'ARIA Core',
    description: 'Create, search, and delete personal notes from chat.',
    capabilities: ['chat', 'storage'],
    permissions: ['read:notes', 'write:notes'],
    minimumARIAVersion: '1.0.0',
};
class NotesPlugin {
    constructor() {
        this.manifest = MANIFEST;
        this.ctx = null;
    }
    async install(ctx) {
        ctx.logger.info('NotesPlugin installed');
    }
    async initialize(ctx) {
        this.ctx = ctx;
        ctx.logger.info('NotesPlugin initialized');
    }
    async enable() {
        this.ctx?.logger.info('NotesPlugin enabled');
    }
    async disable() {
        this.ctx?.logger.info('NotesPlugin disabled');
    }
    async upgrade(previousVersion, ctx) {
        ctx.logger.info(`NotesPlugin upgraded from ${previousVersion}`);
    }
    async shutdown() {
        this.ctx?.logger.info('NotesPlugin shut down');
        this.ctx = null;
    }
    async healthCheck() {
        return {
            healthy: true,
            status: 'enabled',
            lastCheckedAt: new Date().toISOString(),
            responseTimeMs: 0,
        };
    }
    getToolDefinitions() {
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
        ];
    }
    async executeTool(toolName, args, ctx) {
        switch (toolName) {
            case 'create_note':
                return this.createNote(args, ctx);
            case 'search_notes':
                return this.searchNotes(args, ctx);
            case 'delete_note':
                return this.deleteNote(args, ctx);
            default:
                return { success: false, message: `Unknown tool: ${toolName}`, error: 'unknown_tool' };
        }
    }
    async createNote(args, ctx) {
        try {
            const id = await ctx.storage.add('notes', { title: args.title, content: args.content });
            await ctx.events.emit('note:created', MANIFEST.id, { noteId: id, title: args.title }, ctx.userId);
            return { success: true, message: `Note "${args.title}" created.`, data: { noteId: id, title: args.title } };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { success: false, message: msg, error: msg };
        }
    }
    async searchNotes(args, ctx) {
        try {
            const notes = await ctx.storage.list('notes', { orderBy: '_createdAt', limit: 20 });
            const q = args.query.toLowerCase();
            const matches = notes.filter((n) => String(n['title'] ?? '').toLowerCase().includes(q) ||
                String(n['content'] ?? '').toLowerCase().includes(q));
            return { success: true, message: `Found ${matches.length} notes.`, data: { notes: matches, count: matches.length } };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { success: false, message: msg, error: msg };
        }
    }
    async deleteNote(args, ctx) {
        try {
            await ctx.storage.delete('notes', args.noteId);
            await ctx.events.emit('note:deleted', MANIFEST.id, { noteId: args.noteId }, ctx.userId);
            return { success: true, message: `Note ${args.noteId} deleted.` };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { success: false, message: msg, error: msg };
        }
    }
    getMemoryProviders() {
        return [
            {
                name: 'notes-memory',
                type: 'recent_activity',
                load: async (userId, db) => {
                    try {
                        const snap = await db
                            .collection('users')
                            .doc(userId)
                            .collection('plugins')
                            .doc(MANIFEST.id)
                            .collection('notes')
                            .orderBy('_createdAt', 'desc')
                            .limit(5)
                            .get();
                        if (snap.empty)
                            return [];
                        const titles = snap.docs.map((d) => `• ${String(d.data()['title'] ?? 'Untitled')}`).join('\n');
                        return [
                            {
                                type: 'recent_activity',
                                title: 'Recent Notes',
                                summary: titles,
                                priority: 20,
                                sizeChars: titles.length + 30,
                                data: { source: 'notes-plugin' },
                            },
                        ];
                    }
                    catch {
                        return [];
                    }
                },
            },
        ];
    }
}
exports.NotesPlugin = NotesPlugin;
//# sourceMappingURL=NotesPlugin.js.map