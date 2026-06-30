import { MarketplaceLogger } from './MarketplaceLogger'

export interface SkillNotificationInput {
  recipientUserId: string
  title: string
  message: string
  itemId: string | null
  installationId: string | null
}

/**
 * STRUCTURED STUB for marketplace-related notifications (install complete,
 * approval needed, review published). There is no notifications/ module
 * elsewhere in aria/functions/src to integrate with as of Phase 5.3, and
 * no push/email delivery integration exists yet — this class documents the
 * shape a real notification would take and logs it via MarketplaceLogger
 * so callers have a single stable call site to swap in real delivery
 * (e.g. FCM push, email) later without touching SkillInstaller/SkillManager.
 */
export class SkillNotifications {
  private readonly logger = new MarketplaceLogger()

  notifyInstallComplete(input: SkillNotificationInput): void {
    this.send({ ...input, title: input.title || 'Skill installed', message: input.message })
  }

  notifyApprovalNeeded(input: SkillNotificationInput): void {
    this.send(input)
  }

  notifyReviewPublished(input: SkillNotificationInput): void {
    this.send(input)
  }

  private send(input: SkillNotificationInput): void {
    // PLACEHOLDER: real delivery would call into a push/email provider here.
    this.logger.info('notifications', `[stub] ${input.title} -> ${input.recipientUserId}`, {
      message: input.message,
      itemId: input.itemId,
      installationId: input.installationId,
    })
  }
}
