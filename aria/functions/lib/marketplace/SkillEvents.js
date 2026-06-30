"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillEvents = void 0;
const MarketplaceLogger_1 = require("./MarketplaceLogger");
/**
 * Typed structured event log helper for marketplace lifecycle events.
 * This is a lightweight, logger-backed emit() — not a real pub/sub broker.
 * Consistent in style with MarketplaceLogger; consumers (e.g. a future
 * notifications/analytics subscriber) can be wired in later without
 * changing this contract.
 */
class SkillEvents {
    constructor() {
        this.logger = new MarketplaceLogger_1.MarketplaceLogger();
    }
    emit(name, actorId, itemId, installationId, payload) {
        const event = {
            name,
            itemId,
            installationId,
            actorId,
            payload,
            emittedAt: new Date().toISOString(),
        };
        this.logger.info('events', name, { itemId, installationId, actorId, payload });
        return event;
    }
}
exports.SkillEvents = SkillEvents;
//# sourceMappingURL=SkillEvents.js.map