"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillNotifications = void 0;
const MarketplaceLogger_1 = require("./MarketplaceLogger");
/**
 * STRUCTURED STUB for marketplace-related notifications (install complete,
 * approval needed, review published). There is no notifications/ module
 * elsewhere in aria/functions/src to integrate with as of Phase 5.3, and
 * no push/email delivery integration exists yet — this class documents the
 * shape a real notification would take and logs it via MarketplaceLogger
 * so callers have a single stable call site to swap in real delivery
 * (e.g. FCM push, email) later without touching SkillInstaller/SkillManager.
 */
class SkillNotifications {
    constructor() {
        this.logger = new MarketplaceLogger_1.MarketplaceLogger();
    }
    notifyInstallComplete(input) {
        this.send({ ...input, title: input.title || 'Skill installed', message: input.message });
    }
    notifyApprovalNeeded(input) {
        this.send(input);
    }
    notifyReviewPublished(input) {
        this.send(input);
    }
    send(input) {
        // PLACEHOLDER: real delivery would call into a push/email provider here.
        this.logger.info('notifications', `[stub] ${input.title} -> ${input.recipientUserId}`, {
            message: input.message,
            itemId: input.itemId,
            installationId: input.installationId,
        });
    }
}
exports.SkillNotifications = SkillNotifications;
//# sourceMappingURL=SkillNotifications.js.map