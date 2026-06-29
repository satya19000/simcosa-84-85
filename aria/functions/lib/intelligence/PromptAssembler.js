"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assemblePrompt = assemblePrompt;
// ── Section Builders ─────────────────────────────────────────────────────────
function buildContextSection(ctx) {
    const lines = [
        `Date: ${ctx.dateFull}`,
        `Time: ${new Date(ctx.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', timeZone: ctx.userTimezone,
        })}`,
        `Timezone: ${ctx.userTimezone}`,
    ];
    if (ctx.overdueTasks.length > 0) {
        lines.push(`ALERT: ${ctx.overdueTasks.length} overdue task${ctx.overdueTasks.length > 1 ? 's' : ''}`);
    }
    if (ctx.imminentReminders.length > 0) {
        lines.push(`ALERT: ${ctx.imminentReminders.length} imminent reminder${ctx.imminentReminders.length > 1 ? 's' : ''} in next 2 hours`);
    }
    return lines.join('\n');
}
function buildDecisionsSection(decisions) {
    return decisions
        .map((d, i) => `${i + 1}. ${d.title} (confidence: ${Math.round(d.confidence * 100)}%)\n   ${d.reason}\n   → ${d.recommendedAction}`)
        .join('\n\n');
}
// ── Assembler ────────────────────────────────────────────────────────────────
function assemblePrompt(systemBase, context, memory, decisions, config) {
    const sectionsIncluded = ['system', 'context'];
    // System section — never trimmed
    const systemSection = systemBase;
    // Context section — compact, always included
    const contextSection = `=== CURRENT CONTEXT ===\n${buildContextSection(context)}`;
    // Reserve budget for mandatory sections
    const mandatory = systemSection.length + contextSection.length + 200; // 200 = section headers overhead
    let remaining = config.maxPromptChars - mandatory;
    // Memory section — trim blocks greedily from low priority end
    const memoryParts = [];
    let memoryBlocksUsed = 0;
    for (const block of memory) {
        const blockText = `[${block.title}]\n${block.summary}`;
        if (blockText.length <= remaining) {
            memoryParts.push(blockText);
            remaining -= blockText.length;
            memoryBlocksUsed++;
        }
        // Stop if no meaningful budget left
        if (remaining < 200)
            break;
    }
    const memorySection = memoryParts.length > 0
        ? `=== MEMORY ===\n${memoryParts.join('\n\n')}`
        : '';
    if (memoryParts.length > 0)
        sectionsIncluded.push('memory');
    // Decisions section — include if budget allows
    let decisionsSection = '';
    if (decisions.length > 0) {
        const candidate = `=== ARIA RECOMMENDATIONS ===\nUse these proactively when relevant to the user's message.\n${buildDecisionsSection(decisions)}`;
        if (candidate.length <= remaining) {
            decisionsSection = candidate;
            remaining -= candidate.length;
            sectionsIncluded.push('recommendations');
        }
    }
    // Assemble final prompt
    const parts = [systemSection, contextSection];
    if (memorySection)
        parts.push(memorySection);
    if (decisionsSection)
        parts.push(decisionsSection);
    const assembled = parts.join('\n\n');
    return {
        systemPrompt: assembled,
        sizeChars: assembled.length,
        memoryBlocksUsed,
        sectionsIncluded,
    };
}
//# sourceMappingURL=PromptAssembler.js.map