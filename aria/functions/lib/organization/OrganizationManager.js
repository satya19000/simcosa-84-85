"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationManager = void 0;
const uuid_1 = require("uuid");
const COL = 'organizations';
/** Repository for organizations/{organizationId}. Owns ALL raw Firestore access for this collection. */
class OrganizationManager {
    constructor(db) {
        this.db = db;
    }
    async create(createdBy, input) {
        const organizationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const record = {
            id: organizationId,
            organizationId,
            name: input.name.trim(),
            type: input.type,
            description: input.description?.trim() ?? '',
            ownerId: createdBy,
            createdBy,
            createdAt: now,
            updatedAt: now,
            settings: {
                allowGuestInvites: false,
                defaultMemberRole: input.defaultMemberRole ?? 'staff',
            },
        };
        await this.db.collection(COL).doc(organizationId).set(record);
        return record;
    }
    async get(organizationId) {
        const snap = await this.db.collection(COL).doc(organizationId).get();
        return snap.exists ? snap.data() : null;
    }
    async update(organizationId, fields) {
        const ref = this.db.collection(COL).doc(organizationId);
        const snap = await ref.get();
        if (!snap.exists)
            return null;
        const updates = { ...fields, updatedAt: new Date().toISOString() };
        await ref.update(updates);
        const updated = await ref.get();
        return updated.data();
    }
    async listForUser(userIdOrganizationIds) {
        if (userIdOrganizationIds.length === 0)
            return [];
        // Firestore 'in' supports up to 30 ids per query in current SDKs; chunk defensively.
        const chunks = [];
        for (let i = 0; i < userIdOrganizationIds.length; i += 30) {
            chunks.push(userIdOrganizationIds.slice(i, i + 30));
        }
        const results = [];
        for (const chunk of chunks) {
            const snap = await this.db.collection(COL).where('organizationId', 'in', chunk).get();
            results.push(...snap.docs.map((d) => d.data()));
        }
        return results;
    }
}
exports.OrganizationManager = OrganizationManager;
//# sourceMappingURL=OrganizationManager.js.map