"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDecisionProvider = registerDecisionProvider;
exports.generateDecisions = generateDecisions;
// ── Provider Registry ────────────────────────────────────────────────────────
const decisionProviders = [];
function registerDecisionProvider(provider) {
    decisionProviders.push(provider);
}
// ── Built-in Decision Provider ───────────────────────────────────────────────
class DefaultDecisionProvider {
    constructor() {
        this.name = 'default';
    }
    async generate(context, _memory) {
        const decisions = [];
        const now = new Date();
        const soonExpiry = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        const todayExpiry = new Date(now);
        todayExpiry.setHours(23, 59, 59, 999);
        const todayExpiryIso = todayExpiry.toISOString();
        // Overdue tasks
        if (context.overdueTasks.length > 0) {
            const count = context.overdueTasks.length;
            const topTask = context.overdueTasks[0];
            decisions.push({
                title: 'Overdue tasks need attention',
                reason: `${count} task${count > 1 ? 's are' : ' is'} past due, including "${topTask.title}".`,
                confidence: 0.95,
                recommendedAction: `Proactively surface the ${count} overdue task${count > 1 ? 's' : ''} and ask if the user needs help completing or rescheduling.`,
                priority: 90,
                expiresAt: todayExpiryIso,
            });
        }
        // Imminent reminders
        if (context.imminentReminders.length > 0) {
            const r = context.imminentReminders[0];
            decisions.push({
                title: 'Reminder coming up soon',
                reason: `"${r.title}" is scheduled within the next 2 hours.`,
                confidence: 0.9,
                recommendedAction: 'Mention the upcoming reminder and offer to help prepare.',
                priority: 80,
                expiresAt: r.scheduledAt,
            });
        }
        // High priority tasks due today
        const highDueToday = context.dueTodayTasks.filter((t) => t.priority === 'high' || t.priority === 'critical');
        if (highDueToday.length > 0 && context.overdueTasks.length === 0) {
            decisions.push({
                title: 'High-priority work due today',
                reason: `${highDueToday.length} high-priority task${highDueToday.length > 1 ? 's' : ''} due today: "${highDueToday[0].title}".`,
                confidence: 0.85,
                recommendedAction: 'Prioritise these when the user asks for guidance on what to do.',
                priority: 70,
                expiresAt: todayExpiryIso,
            });
        }
        // Heavy workload signal
        if (context.allPendingTasks.length > 8 &&
            context.overdueTasks.length === 0 &&
            highDueToday.length === 0) {
            decisions.push({
                title: 'Large task backlog',
                reason: `${context.allPendingTasks.length} pending tasks. User may feel overloaded.`,
                confidence: 0.7,
                recommendedAction: 'If the user mentions feeling busy or overloaded, suggest prioritising the top 3 tasks and deferring the rest.',
                priority: 40,
                expiresAt: soonExpiry,
            });
        }
        // Contact follow-up (only if contacts exist and no urgent tasks dominate)
        if (context.recentContacts.length > 0 && context.overdueTasks.length === 0) {
            const lastInteracted = context.recentContacts.find((c) => c.relationshipNotes && c.relationshipNotes.length > 10);
            if (lastInteracted) {
                decisions.push({
                    title: 'Relationship follow-up opportunity',
                    reason: `${lastInteracted.name} has relationship notes on file — may be worth a check-in.`,
                    confidence: 0.5,
                    recommendedAction: `If the conversation involves ${lastInteracted.name} or relationships, reference their history proactively.`,
                    priority: 30,
                    expiresAt: soonExpiry,
                });
            }
        }
        return decisions;
    }
}
// Register the built-in provider at module load time
registerDecisionProvider(new DefaultDecisionProvider());
// ── Engine ───────────────────────────────────────────────────────────────────
async function generateDecisions(context, memory, config) {
    // Run all providers in parallel
    const results = await Promise.all(decisionProviders.map((p) => p.generate(context, memory).catch(() => [])));
    const all = results.flat();
    // Sort by priority descending, remove expired
    const nowIso = new Date().toISOString();
    const valid = all
        .filter((d) => !d.expiresAt || d.expiresAt > nowIso)
        .sort((a, b) => b.priority - a.priority);
    return valid.slice(0, config.maxRecommendations);
}
//# sourceMappingURL=DecisionEngine.js.map