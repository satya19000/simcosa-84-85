"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDueReminders = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
exports.processDueReminders = (0, scheduler_1.onSchedule)('every 5 minutes', async () => {
    const db = admin.firestore();
    const now = new Date();
    // Find reminders that are due, not yet notified, not completed
    const snap = await db.collectionGroup('reminders')
        .where('notified', '==', false)
        .where('completed', '==', false)
        .where('scheduledAt', '<=', now.toISOString())
        .limit(100)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    const byUser = {};
    for (const doc of snap.docs) {
        const data = doc.data();
        const userId = data.userId;
        // Mark notified
        batch.update(doc.ref, { notified: true });
        if (!byUser[userId])
            byUser[userId] = [];
        byUser[userId].push({ title: data.title, reminderId: doc.id });
        // Advance recurring reminders
        if (data.recurrence && data.recurrence !== 'none') {
            const next = new Date(data.scheduledAt);
            switch (data.recurrence) {
                case 'daily':
                    next.setDate(next.getDate() + 1);
                    break;
                case 'weekly':
                    next.setDate(next.getDate() + 7);
                    break;
                case 'monthly':
                    next.setMonth(next.getMonth() + 1);
                    break;
            }
            batch.update(doc.ref, { scheduledAt: next.toISOString(), notified: false });
        }
    }
    await batch.commit();
    // Send push notifications per user
    for (const [userId, items] of Object.entries(byUser)) {
        const tokensSnap = await db
            .collection('users').doc(userId)
            .collection('notificationTokens')
            .get();
        if (tokensSnap.empty)
            continue;
        const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
        if (tokens.length === 0)
            continue;
        for (const item of items) {
            const message = {
                tokens,
                notification: {
                    title: 'ARIA Reminder',
                    body: item.title,
                },
                webpush: {
                    notification: {
                        icon: '/icons/icon-192.png',
                        badge: '/icons/icon-72.png',
                        tag: `reminder-${item.reminderId}`,
                    },
                },
                data: {
                    type: 'reminder',
                    reminderId: item.reminderId,
                    userId,
                },
            };
            try {
                await admin.messaging().sendEachForMulticast(message);
            }
            catch {
                // Non-fatal: log and continue
                console.error(`Failed to send notification for reminder ${item.reminderId}`);
            }
        }
    }
});
//# sourceMappingURL=processDueReminders.js.map