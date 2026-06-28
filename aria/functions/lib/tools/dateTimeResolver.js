"use strict";
/**
 * Server-side date/time utilities for the ARIA Action Engine.
 *
 * Strategy: Claude resolves natural language ("tomorrow at 10", "after 2 hours")
 * to ISO-8601 strings — it has the current time and timezone from the system prompt.
 * This module provides:
 *  - buildTemporalContext() — injects current time into the system prompt so Claude
 *    can resolve relative expressions correctly.
 *  - validateISODatetime() — safety-checks the ISO string Claude returned before
 *    it hits the Action Engine's validate() step.
 *  - isAmbiguousTime() — heuristic to detect when Claude should ask for clarification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTemporalContext = buildTemporalContext;
exports.validateISODatetime = validateISODatetime;
exports.buildTemporalSystemSection = buildTemporalSystemSection;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
/**
 * Build temporal context to inject into the ARIA system prompt.
 * Uses the user's stored timezone if provided, falls back to Asia/Kolkata.
 */
function buildTemporalContext(userTimezone) {
    const tz = userTimezone ?? DEFAULT_TIMEZONE;
    const now = new Date();
    const currentDatetimeISO = now.toLocaleString('sv-SE', {
        timeZone: tz,
        hour12: false,
    }).replace(' ', 'T') + formatTimezoneOffset(now, tz);
    const todayLabel = now.toLocaleDateString('en-IN', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowDateISO = tomorrowDate.toLocaleDateString('sv-SE', {
        timeZone: tz,
    });
    return { currentDatetimeISO, timezone: tz, todayLabel, tomorrowDateISO };
}
/**
 * Validates that the string Claude returned is a parseable ISO-8601 datetime.
 * Returns null if valid, or an error message if invalid.
 */
function validateISODatetime(value) {
    if (!value || typeof value !== 'string')
        return 'datetime is missing';
    const parsed = Date.parse(value);
    if (isNaN(parsed))
        return `"${value}" is not a valid datetime`;
    const d = new Date(parsed);
    if (d.getFullYear() < 2020 || d.getFullYear() > 2100) {
        return `datetime year ${d.getFullYear()} is out of expected range`;
    }
    // Must be in the future (allow 5-minute grace for clock skew)
    if (parsed < Date.now() - 5 * 60 * 1000) {
        return `datetime "${value}" is in the past`;
    }
    return null; // valid
}
/**
 * Build the temporal section that gets appended to the ARIA system prompt.
 * This is what lets Claude resolve "tomorrow", "after 2 hours", "next Friday", etc.
 */
function buildTemporalSystemSection(ctx) {
    return `
## Current Time Context
- Right now: ${ctx.currentDatetimeISO}
- Today is: ${ctx.todayLabel}
- Tomorrow's date: ${ctx.tomorrowDateISO}
- User timezone: ${ctx.timezone}

When creating reminders or tasks with a time:
- Always convert relative expressions (tomorrow, next week, after 2 hours) to a full ISO-8601 datetime including timezone offset.
- Example: "tomorrow at 10 AM" → "${ctx.tomorrowDateISO}T10:00:00${getTimezoneOffsetString(ctx.timezone)}"
- If the user says "tomorrow" without a time, ask "What time tomorrow?" — do NOT guess.
- If the user says "morning" use 09:00, "evening" use 18:00, "night" use 21:00 unless told otherwise.
- Never call a tool with a past datetime.`;
}
// ── Private helpers ────────────────────────────────────────────────────────────
function formatTimezoneOffset(date, timezone) {
    try {
        // Get the UTC offset for this timezone at this moment
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        const diffMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000;
        const sign = diffMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(diffMinutes);
        const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
        const mins = String(absMinutes % 60).padStart(2, '0');
        return `${sign}${hours}:${mins}`;
    }
    catch {
        return '+05:30'; // safe fallback
    }
}
function getTimezoneOffsetString(timezone) {
    return formatTimezoneOffset(new Date(), timezone);
}
//# sourceMappingURL=dateTimeResolver.js.map