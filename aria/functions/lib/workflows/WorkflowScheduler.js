"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowScheduler = void 0;
exports.computeNextRun = computeNextRun;
/** Compute the next ISO datetime after `after` for a simple cron-like schedule. */
function computeNextRun(cron, after) {
    // Supported named schedules for built-in workflows
    const named = {
        '@daily': (d) => {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            next.setHours(7, 0, 0, 0);
            return next;
        },
        '@weekly': (d) => {
            const next = new Date(d);
            next.setDate(next.getDate() + (7 - next.getDay()));
            next.setHours(7, 0, 0, 0);
            return next;
        },
        '@monthly': (d) => {
            const next = new Date(d);
            next.setMonth(next.getMonth() + 1, 1);
            next.setHours(7, 0, 0, 0);
            return next;
        },
        '@morning': (d) => {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            next.setHours(7, 0, 0, 0);
            return next;
        },
        '@evening': (d) => {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            next.setHours(20, 0, 0, 0);
            return next;
        },
    };
    return named[cron]?.(after) ?? null;
}
class WorkflowScheduler {
    constructor(db) {
        this.db = db;
    }
    async upsert(userId, definition) {
        if (definition.trigger.type !== 'scheduled')
            return;
        const trigger = definition.trigger;
        const now = new Date();
        const nextRun = computeNextRun(trigger.cron, now);
        const schedule = {
            workflowId: definition.id,
            userId,
            cron: trigger.cron,
            timezone: trigger.timezone ?? 'UTC',
            enabled: definition.enabled,
            lastRunAt: null,
            nextRunAt: nextRun?.toISOString() ?? null,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };
        await this.db
            .collection('users')
            .doc(userId)
            .collection('workflowSchedules')
            .doc(definition.id)
            .set(schedule, { merge: true });
    }
    async markRan(userId, workflowId) {
        const now = new Date();
        const snap = await this.db
            .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId).get();
        const schedule = snap.data();
        const nextRun = schedule ? computeNextRun(schedule.cron, now) : null;
        await this.db
            .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId)
            .set({ lastRunAt: now.toISOString(), nextRunAt: nextRun?.toISOString() ?? null, updatedAt: now.toISOString() }, { merge: true });
    }
    async getDue(userId) {
        const now = new Date().toISOString();
        const snap = await this.db
            .collection('users').doc(userId).collection('workflowSchedules')
            .where('enabled', '==', true)
            .where('nextRunAt', '<=', now)
            .get();
        return snap.docs.map((d) => d.data());
    }
    async setEnabled(userId, workflowId, enabled) {
        await this.db
            .collection('users').doc(userId).collection('workflowSchedules').doc(workflowId)
            .set({ enabled, updatedAt: new Date().toISOString() }, { merge: true });
    }
    async list(userId) {
        const snap = await this.db
            .collection('users').doc(userId).collection('workflowSchedules')
            .orderBy('nextRunAt', 'asc')
            .get();
        return snap.docs.map((d) => d.data());
    }
}
exports.WorkflowScheduler = WorkflowScheduler;
//# sourceMappingURL=WorkflowScheduler.js.map