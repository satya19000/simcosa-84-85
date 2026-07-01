"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerAuditStream = void 0;
const AUDIT_COL = (tenantId) => `tenants/${tenantId}/computerAudit`;
/**
 * ComputerAuditStream — reads real-time audit events from Firestore and maps
 * them to front-end-friendly AuditStreamEvent objects.
 *
 * Reads from `tenants/{tenantId}/computerAudit` ordered by timestamp.
 * Supports pagination via a lastTimestamp cursor.
 *
 * This is a READ-ONLY view of the audit log — it never writes.
 * All writes go through ComputerAudit.record().
 */
class ComputerAuditStream {
    constructor(db) {
        this.db = db;
    }
    /**
     * Fetch a page of audit events ordered by timestamp descending.
     * Pass `beforeTimestamp` from a previous page's earliest event for pagination.
     */
    async getPage(tenantId, limit = 25, beforeTimestamp) {
        let query = this.db
            .collection(AUDIT_COL(tenantId))
            .orderBy('timestamp', 'desc')
            .limit(limit + 1); // fetch one extra to detect if there's a next page
        if (beforeTimestamp) {
            query = query.where('timestamp', '<', beforeTimestamp);
        }
        const snap = await query.get();
        const docs = snap.docs.map((d) => d.data());
        let nextPageToken;
        let events = docs;
        if (docs.length > limit) {
            events = docs.slice(0, limit);
            nextPageToken = events[events.length - 1].timestamp;
        }
        return {
            events: events.map((e) => this.mapToStreamEvent(e)),
            nextPageToken,
            totalFetched: events.length,
        };
    }
    /**
     * Fetch recent events since a given timestamp (ascending) — for polling.
     * Front-end can use this to append new events without a full re-fetch.
     */
    async getSince(tenantId, sinceTimestamp, limit = 50) {
        const snap = await this.db
            .collection(AUDIT_COL(tenantId))
            .orderBy('timestamp', 'asc')
            .where('timestamp', '>', sinceTimestamp)
            .limit(limit)
            .get();
        return snap.docs.map((d) => this.mapToStreamEvent(d.data()));
    }
    mapToStreamEvent(event) {
        const streamType = this.mapEventType(event.eventType);
        const riskLevel = event.riskLevel ?? 'low';
        return {
            streamEventId: event.auditId,
            streamEventType: streamType,
            sourceAuditEvent: event,
            colorCode: this.colorForType(streamType, riskLevel),
            riskLevel,
            displayLabel: this.labelForType(streamType, event),
            timestamp: event.timestamp,
        };
    }
    mapEventType(eventType) {
        switch (eventType) {
            case 'action.planned': return 'planned';
            case 'action.blocked': return 'blocked';
            case 'action.executed': return 'executed';
            case 'action.approved': return 'approval_granted';
            case 'approval.requested': return 'approval_requested';
            case 'safety_guard.triggered': return 'safety_guard_triggered';
            case 'capability.denied': return 'blocked';
            default: return 'planned';
        }
    }
    colorForType(type, riskLevel) {
        switch (type) {
            case 'executed': return 'green';
            case 'approval_granted': return 'green';
            case 'planned': return riskLevel === 'low' ? 'blue' : 'yellow';
            case 'approval_requested': return 'yellow';
            case 'blocked': return 'orange';
            case 'failed': return 'red';
            case 'safety_guard_triggered': return 'red';
            default: return 'gray';
        }
    }
    labelForType(type, event) {
        const cap = event.capabilityId ? ` [${event.capabilityId}]` : '';
        switch (type) {
            case 'planned': return `Planned${cap}`;
            case 'blocked': return `Blocked${cap}`;
            case 'approval_requested': return `Approval Requested${cap}`;
            case 'approval_granted': return `Approval Granted${cap}`;
            case 'executed': return `Executed${cap}`;
            case 'failed': return `Failed${cap}`;
            case 'safety_guard_triggered': return `Safety Guard Triggered${cap}`;
            default: return `Event${cap}`;
        }
    }
}
exports.ComputerAuditStream = ComputerAuditStream;
//# sourceMappingURL=ComputerAuditStream.js.map