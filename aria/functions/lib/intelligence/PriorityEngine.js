"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPriorityProvider = registerPriorityProvider;
exports.scoreTask = scoreTask;
exports.scoreReminder = scoreReminder;
exports.scoreContact = scoreContact;
exports.rankTasks = rankTasks;
exports.rankContacts = rankContacts;
const priorityProviders = [];
function registerPriorityProvider(p) {
    priorityProviders.push(p);
}
// ── Core Scoring ─────────────────────────────────────────────────────────────
function clamp(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
}
function applyProviders(itemId, itemType, base, factors) {
    let score = base;
    for (const p of priorityProviders) {
        const { delta, factors: extra } = p.adjust(itemId, itemType, score);
        score += delta;
        factors.push(...extra);
    }
    return clamp(score);
}
function scoreTask(task, nowIso) {
    const factors = [];
    let score = 0;
    if (task.dueAt) {
        if (task.dueAt < nowIso) {
            score += 45;
            factors.push('overdue');
        }
        else {
            const msUntilDue = new Date(task.dueAt).getTime() - Date.now();
            const hoursUntilDue = msUntilDue / (1000 * 60 * 60);
            if (hoursUntilDue <= 2) {
                score += 30;
                factors.push('due-in-2h');
            }
            else if (hoursUntilDue <= 24) {
                score += 20;
                factors.push('due-today');
            }
            else if (hoursUntilDue <= 72) {
                score += 10;
                factors.push('due-in-3-days');
            }
        }
    }
    switch (task.priority) {
        case 'critical':
            score += 35;
            factors.push('critical-priority');
            break;
        case 'high':
            score += 20;
            factors.push('high-priority');
            break;
        case 'normal':
            score += 0;
            break;
        case 'low':
            score -= 10;
            factors.push('low-priority');
            break;
    }
    return { itemId: task.id, itemType: 'task', score: applyProviders(task.id, 'task', score, factors), factors };
}
function scoreReminder(reminder, nowIso) {
    const factors = [];
    let score = 0;
    if (reminder.scheduledAt < nowIso) {
        score += 40;
        factors.push('overdue-reminder');
    }
    else {
        const msUntil = new Date(reminder.scheduledAt).getTime() - Date.now();
        const hoursUntil = msUntil / (1000 * 60 * 60);
        if (hoursUntil <= 2) {
            score += 35;
            factors.push('imminent-reminder');
        }
        else if (hoursUntil <= 24) {
            score += 20;
            factors.push('today-reminder');
        }
    }
    if (reminder.recurrence !== 'none') {
        score += 5;
        factors.push('recurring');
    }
    return {
        itemId: reminder.id,
        itemType: 'reminder',
        score: applyProviders(reminder.id, 'reminder', score, factors),
        factors,
    };
}
function scoreContact(contact, messageLower) {
    const factors = [];
    let score = 10;
    const nameLower = contact.name.toLowerCase();
    if (messageLower.includes(nameLower)) {
        score += 50;
        factors.push('named-in-message');
    }
    switch (contact.relationshipType?.toLowerCase()) {
        case 'family':
            score += 15;
            factors.push('family');
            break;
        case 'client':
            score += 12;
            factors.push('client');
            break;
        case 'manager':
            score += 12;
            factors.push('manager');
            break;
        case 'investor':
            score += 12;
            factors.push('investor');
            break;
        case 'friend':
            score += 8;
            factors.push('friend');
            break;
        case 'colleague':
            score += 5;
            factors.push('colleague');
            break;
    }
    return {
        itemId: contact.id,
        itemType: 'contact',
        score: applyProviders(contact.id, 'contact', score, factors),
        factors,
    };
}
function rankTasks(tasks, nowIso) {
    const scored = tasks.map((t) => ({ task: t, score: scoreTask(t, nowIso).score }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.task);
}
function rankContacts(contacts, messageLower) {
    const scored = contacts.map((c) => ({ contact: c, score: scoreContact(c, messageLower).score }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.contact);
}
//# sourceMappingURL=PriorityEngine.js.map