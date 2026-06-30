"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationTemplates = void 0;
const uuid_1 = require("uuid");
const COL = (userId) => `users/${userId}/communicationTemplates`;
class CommunicationTemplates {
    constructor(db) {
        this.db = db;
    }
    async create(userId, fields) {
        const now = new Date().toISOString();
        const template = {
            ...fields,
            id: (0, uuid_1.v4)(),
            userId,
            createdAt: now,
            updatedAt: now,
        };
        await this.db.collection(COL(userId)).doc(template.id).set(template);
        return template;
    }
    async get(userId, templateId) {
        const snap = await this.db.collection(COL(userId)).doc(templateId).get();
        return snap.exists ? snap.data() : null;
    }
    async list(userId, providerType) {
        let query = this.db.collection(COL(userId));
        if (providerType)
            query = query.where('providerType', '==', providerType);
        const snap = await query.orderBy('name').get();
        return snap.docs.map((d) => d.data());
    }
    async update(userId, templateId, patch) {
        await this.db.collection(COL(userId)).doc(templateId).set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
    }
    async delete(userId, templateId) {
        await this.db.collection(COL(userId)).doc(templateId).delete();
    }
    /** Render a template by substituting {{variable}} placeholders. */
    render(template, vars) {
        const substitute = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
        return {
            subject: template.subject ? substitute(template.subject) : undefined,
            body: substitute(template.body),
        };
    }
    /** Create built-in system templates for a new user. */
    async seedDefaults(userId) {
        const defaults = [
            {
                name: 'Meeting Confirmation',
                description: 'Confirm a scheduled meeting',
                contentType: 'text',
                body: 'Dear {{name}},\n\nThis is to confirm our meeting scheduled for {{date}} at {{time}}.\n\nLooking forward to connecting.\n\nRegards',
                variables: ['name', 'date', 'time'],
                tags: ['meeting', 'formal'],
            },
            {
                name: 'Follow-up',
                description: 'Generic follow-up message',
                contentType: 'text',
                body: 'Dear {{name}},\n\nI wanted to follow up regarding {{topic}}. Please let me know if you need any further information.\n\nRegards',
                variables: ['name', 'topic'],
                tags: ['follow-up'],
            },
            {
                name: 'Out of Office',
                description: 'Automated out-of-office reply',
                contentType: 'text',
                body: 'Thank you for your message. I am currently out of office until {{returnDate}} and will respond upon my return.\n\nFor urgent matters, please contact {{contactName}} at {{contactEmail}}.',
                variables: ['returnDate', 'contactName', 'contactEmail'],
                tags: ['auto-reply', 'ooo'],
            },
        ];
        const existing = await this.list(userId);
        const existingNames = new Set(existing.map((t) => t.name));
        for (const d of defaults) {
            if (!existingNames.has(d.name)) {
                await this.create(userId, d);
            }
        }
    }
}
exports.CommunicationTemplates = CommunicationTemplates;
//# sourceMappingURL=CommunicationTemplates.js.map